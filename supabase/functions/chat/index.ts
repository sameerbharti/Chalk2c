import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const ChatSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID format").optional(),
  sessionIds: z.array(z.string().uuid("Invalid session ID format")).max(20, "Too many sessions").optional(),
  question: z.string().min(1, "Question is required").max(2000, "Question too long"),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(5000, "Message content too long")
  })).max(20, "Too many messages in history").optional().default([]),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
  dateFilter: z.string().optional()
}).refine(data => data.sessionId || (data.sessionIds && data.sessionIds.length > 0), {
  message: "Either sessionId or sessionIds is required"
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    const rawBody = await req.json();
    const validationResult = ChatSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      return new Response(JSON.stringify({ 
        error: "Validation failed", 
        details: validationResult.error.errors.map(e => e.message).join(", ")
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { sessionId, sessionIds, question, messages, difficulty, dateFilter } = validationResult.data;
    
    const activeSessionIds = sessionIds || (sessionId ? [sessionId] : []);

    console.log("Chat request for sessions:", activeSessionIds, "Question:", question.substring(0, 100), "Difficulty:", difficulty);

    const HUGGINGFACE_API_KEY = Deno.env.get('HUGGINGFACE_API_KEY');
    if (!HUGGINGFACE_API_KEY) {
      throw new Error('HUGGINGFACE_API_KEY is not configured. Get a free API key at https://huggingface.co/settings/tokens');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration is missing. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Retrieve chunks from all sessions
    const chunksQuery = supabase
      .from('knowledge_chunks')
      .select('*')
      .in('session_id', activeSessionIds)
      .order('chunk_order', { ascending: true });

    const { data: chunks, error: chunksError } = await chunksQuery;

    if (chunksError) {
      console.error("Error fetching chunks:", chunksError);
      throw chunksError;
    }

    // Get sessions metadata
    const { data: sessions } = await supabase
      .from('classroom_sessions')
      .select('*')
      .in('id', activeSessionIds);

    // Apply date filter if specified
    let filteredChunks = chunks || [];
    if (dateFilter) {
      try {
        const filterDate = new Date(dateFilter);
        if (!isNaN(filterDate.getTime())) {
          const sessionIdsForDate = sessions
            ?.filter(s => new Date(s.session_date) <= filterDate)
            .map(s => s.id) || [];
          filteredChunks = filteredChunks.filter(c => sessionIdsForDate.includes(c.session_id));
        }
      } catch (e) {
        console.warn("Invalid date filter, ignoring:", dateFilter);
      }
    }

    // Retrieve relevant chunks with difficulty preference
    const relevantChunks = retrieveRelevantChunks(question, filteredChunks, difficulty);
    const retrievedContent = relevantChunks.map(c => c.chunk_text).join('\n\n');
    
    console.log(`Found ${relevantChunks.length} relevant chunks`);

    // Build the RAG prompt with difficulty adaptation and question context
    const systemPrompt = buildRAGPrompt(retrievedContent, sessions?.[0], difficulty, question);

    // Use Gemma via Hugging Face Inference API
    // Build the prompt from messages
    const conversationText = [
      systemPrompt,
      ...messages.slice(-6).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`),
      `User: ${question}`,
      "Assistant:"
    ].join('\n\n');

    let response = await fetch("https://api-inference.huggingface.co/models/google/gemma-7b-it", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: conversationText,
        parameters: {
          max_new_tokens: 2048,
          temperature: 0.4,
          return_full_text: false,
        },
      }),
    });

    // Handle model loading (503 status)
    if (response.status === 503) {
      // Model is loading, wait and retry
      const retryAfter = response.headers.get('retry-after') || '30';
      await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter) * 1000));
      
      response = await fetch("https://api-inference.huggingface.co/models/google/gemma-7b-it", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: conversationText,
          parameters: {
            max_new_tokens: 2048,
            temperature: 0.4,
            return_full_text: false,
          },
        }),
      });
    }

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 401) {
        return new Response(JSON.stringify({ error: "Invalid API key. Please check your HUGGINGFACE_API_KEY." }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 503) {
        return new Response(JSON.stringify({ error: "Model is loading. Please wait 30-60 seconds and try again." }), {
          status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("Hugging Face API error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status} - ${errorText}`);
    }

    const aiResult = await response.json();
    
    // Handle Hugging Face response format
    let answer = "I couldn't generate a response.";
    if (Array.isArray(aiResult)) {
      answer = aiResult[0]?.generated_text || aiResult[0]?.text || answer;
    } else if (aiResult.error) {
      // Hugging Face error response
      throw new Error(aiResult.error || 'Model error occurred');
    } else {
      answer = aiResult.generated_text || aiResult.text || answer;
    }
    
    // Clean up the answer (remove prompt if included)
    if (answer.includes('Assistant:')) {
      answer = answer.split('Assistant:').pop()?.trim() || answer;
    }
    
    // Only mark as refusal if truly refusing (not for general knowledge answers)
    const isRefusal = answer.toLowerCase().includes("not been covered") && 
                      answer.toLowerCase().includes("upload") &&
                      !detectQuestionType(question);

    // Generate sources from multiple sessions
    const sources = relevantChunks.length > 0 
      ? [...new Set(relevantChunks.map(c => {
          const session = sessions?.find(s => s.id === c.session_id);
          return `${session?.subject || 'Class'}: ${session?.chapter || 'Lesson'}`;
        }))]
      : [];

    // Save chat (use first session for storage)
    await supabase.from('chat_messages').insert([
      { session_id: activeSessionIds[0], role: 'user', content: question.substring(0, 5000) },
      { session_id: activeSessionIds[0], role: 'assistant', content: answer.substring(0, 10000), sources, is_refusal: isRefusal }
    ]);

    const retrievalDetails = relevantChunks.map(c => {
      const session = sessions?.find(s => s.id === c.session_id);
      return {
        text: c.chunk_text,
        type: c.chunk_type,
        difficulty: c.difficulty,
        score: Math.round((c.score / Math.max(...relevantChunks.map((x) => x.score), 1)) * 100),
        matchedKeywords: getMatchedKeywords(question, c.chunk_text),
        source: `${session?.subject}: ${session?.chapter}`
      };
    });

    return new Response(JSON.stringify({
      answer,
      sources,
      isRefusal,
      chunksUsed: relevantChunks.length,
      retrievalDetails
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

interface KnowledgeChunk {
  chunk_text: string;
  chunk_type: string | null;
  difficulty: string | null;
  session_id: string;
  chunk_order: number | null;
}

interface ChunkWithScore extends KnowledgeChunk {
  score: number;
}

// Common stop words to filter out
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how'
]);

function retrieveRelevantChunks(question: string, chunks: KnowledgeChunk[], difficulty: string): ChunkWithScore[] {
  const questionLower = question.toLowerCase();
  
  // Enhanced keyword extraction with stop word filtering and stemming
  const questionWords = extractSignificantWords(questionLower);
  const keyPhrases = extractKeyPhrases(questionLower);
  const questionStem = extractQuestionStem(question);
  
  // Calculate document frequencies for IDF
  const wordFrequencies = new Map<string, number>();
  chunks.forEach(chunk => {
    const chunkWords = extractSignificantWords(chunk.chunk_text.toLowerCase());
    const uniqueWords = new Set(chunkWords);
    uniqueWords.forEach(word => {
      wordFrequencies.set(word, (wordFrequencies.get(word) || 0) + 1);
    });
  });
  
  const totalChunks = chunks.length;
  
  const scored = chunks.map(chunk => {
    const chunkLower = chunk.chunk_text.toLowerCase();
    const chunkWords = extractSignificantWords(chunkLower);
    let score = 0;
    
    // Enhanced TF-IDF-like weighting with better normalization
    for (const word of questionWords) {
      if (chunkLower.includes(word)) {
        // Term frequency in chunk
        const termFreq = (chunkLower.match(new RegExp(`\\b${word}\\b`, 'gi')) || []).length;
        const tf = 1 + Math.log(1 + termFreq);
        
        // Inverse document frequency
        const docFreq = wordFrequencies.get(word) || 1;
        const idf = Math.log((totalChunks + 1) / (docFreq + 1)) + 1;
        
        // Weighted score
        score += tf * idf * 1.5;
      }
    }
    
    // Enhanced phrase matching with proximity scoring
    for (const phrase of keyPhrases) {
      const phraseLower = phrase.toLowerCase();
      if (chunkLower.includes(phraseLower)) {
        // Check if words appear close together (better match)
        const words = phraseLower.split(/\s+/);
        const positions = words.map(w => chunkLower.indexOf(w)).filter(p => p >= 0);
        if (positions.length === words.length) {
          const maxDist = Math.max(...positions) - Math.min(...positions);
          const proximityBonus = maxDist < phrase.length * 2 ? 2 : 1;
          score += 4 * proximityBonus; // Higher weight for phrases
        } else {
          score += 3;
        }
      }
    }
    
    // Exact question stem matching (very high weight)
    if (questionStem && chunkLower.includes(questionStem.toLowerCase())) {
      score += 6;
    }
    
    // Semantic similarity indicators
    const questionConcepts = extractConcepts(questionLower);
    const chunkConcepts = extractConcepts(chunkLower);
    const conceptOverlap = questionConcepts.filter(c => chunkConcepts.includes(c)).length;
    if (conceptOverlap > 0) {
      score += conceptOverlap * 2;
    }
    
    // Chunk type weighting (concepts are more valuable)
    if (chunk.chunk_type === 'concept') score += 2;
    else if (chunk.chunk_type === 'summary') score += 1;
    
    // Difficulty matching with adaptive scoring
    if (chunk.difficulty === difficulty) {
      score += 2;
    } else if (difficulty === 'hard' && chunk.difficulty === 'medium') {
      score += 0.5; // Allow medium chunks for hard questions
    } else if (difficulty === 'easy' && chunk.difficulty === 'medium') {
      score += 0.5; // Allow medium chunks for easy questions
    }
    
    // Recency boost (newer content is often more relevant)
    if (chunk.chunk_order !== null) {
      const recencyBoost = Math.max(0, 1 - (chunk.chunk_order / 20));
      score += recencyBoost * 0.5;
    }
    
    // Length normalization (prefer chunks of reasonable size)
    const chunkLength = chunk.chunk_text.length;
    if (chunkLength > 50 && chunkLength < 500) {
      score += 0.3; // Optimal chunk size
    } else if (chunkLength > 1000) {
      score *= 0.9; // Penalize very long chunks
    }
    
    return { ...chunk, score };
  });
  
  // Adaptive threshold based on question complexity
  const avgScore = scored.reduce((sum, c) => sum + c.score, 0) / scored.length;
  const threshold = Math.max(0.5, avgScore * 0.3);
  
  const topChunks = scored
    .filter(c => c.score > threshold)
    .sort((a, b) => b.score - a.score);
  
  // Return top chunks, but ensure diversity (don't return all from same session if possible)
  const diverseChunks: ChunkWithScore[] = [];
  const sessionIds = new Set<string>();
  const maxPerSession = Math.ceil(7 / 2); // Max 3-4 chunks per session
  
  for (const chunk of topChunks) {
    if (diverseChunks.length >= 10) break; // Increased from 7 to 10 for better context
    
    const sessionCount = sessionIds.has(chunk.session_id) 
      ? diverseChunks.filter(c => c.session_id === chunk.session_id).length
      : 0;
    
    if (sessionCount < maxPerSession || diverseChunks.length < 5) {
      diverseChunks.push(chunk);
      sessionIds.add(chunk.session_id);
    }
  }
  
  return diverseChunks.slice(0, 10);
}

function extractSignificantWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
    .filter((w, i, arr) => arr.indexOf(w) === i); // Remove duplicates
}

function extractQuestionStem(question: string): string {
  // Extract the core question (remove question words)
  const q = question.toLowerCase().trim();
  const questionStarters = /^(what|how|why|when|where|who|which|can|could|would|should|is|are|does|do|did|will)\s+/i;
  return q.replace(questionStarters, '').substring(0, 50).trim();
}

function extractConcepts(text: string): string[] {
  // Extract potential concepts (capitalized words, technical terms, etc.)
  const concepts: string[] = [];
  const words = text.split(/\s+/);
  
  for (let i = 0; i < words.length - 1; i++) {
    const word = words[i].toLowerCase().replace(/[^\w]/g, '');
    if (word.length > 4 && !STOP_WORDS.has(word)) {
      // Check for technical terms (often longer words)
      if (word.length > 5 || /^[a-z]+(?:tion|sion|ment|ing|ity|ism)$/i.test(word)) {
        concepts.push(word);
      }
    }
  }
  
  return [...new Set(concepts)].slice(0, 10);
}

function extractKeyPhrases(text: string): string[] {
  // Extract meaningful 2-3 word phrases (excluding stop words)
  const words = text
    .split(/\s+/)
    .map(w => w.toLowerCase().replace(/[^\w]/g, ''))
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
  
  const phrases: string[] = [];
  
  // Extract bigrams (2-word phrases)
  for (let i = 0; i < words.length - 1; i++) {
    const phrase = `${words[i]} ${words[i + 1]}`;
    if (phrase.length > 5) { // Filter out very short phrases
      phrases.push(phrase);
    }
  }
  
  // Extract trigrams (3-word phrases) for important concepts
  for (let i = 0; i < words.length - 2; i++) {
    const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    // Only include trigrams if they don't contain stop words
    if (phrase.length > 8 && !phrase.split(/\s+/).some(w => STOP_WORDS.has(w))) {
      phrases.push(phrase);
    }
  }
  
  // Remove duplicates and return top phrases
  return [...new Set(phrases)].slice(0, 15);
}

function detectQuestionType(question: string): string {
  const q = question.toLowerCase();
  let score = { math: 0, science: 0, explanation: 0, calculation: 0 };
  
  // Math detection with scoring
  const mathPatterns = [
    /\d+\s*[+\-*/^=]\s*\d+/, // Numbers with operators
    /\b(solve|calculate|compute|find|evaluate|derive|integrate|differentiate)\b/,
    /\b(equation|formula|theorem|proof|algebra|geometry|trigonometry|calculus)\b/,
    /\b(percentage|fraction|ratio|proportion|probability|statistics)\b/,
    /\b(square|root|cube|exponent|logarithm|sine|cosine|tangent)\b/,
    /\b(derivative|integral|limit|matrix|vector|polynomial)\b/
  ];
  mathPatterns.forEach(pattern => {
    if (pattern.test(question)) score.math += 1;
  });
  
  // Calculation detection (specific math operations)
  if (/\d+\s*[+\-*/^]\s*\d+/.test(question) || /\b(calculate|compute|solve)\s+\d+/.test(q)) {
    score.calculation += 2;
  }
  
  // Science detection with scoring
  const sciencePatterns = [
    /\b(physics|chemistry|biology|anatomy|physiology)\b/,
    /\b(atom|molecule|element|compound|reaction)\b/,
    /\b(force|energy|power|velocity|acceleration|momentum)\b/,
    /\b(cell|tissue|organ|organism|species|evolution)\b/,
    /\b(gravity|magnetism|electricity|light|sound|wave)\b/,
    /\b(photosynthesis|respiration|digestion|circulation)\b/,
    /\b(genetics|dna|rna|protein|enzyme|hormone)\b/
  ];
  sciencePatterns.forEach(pattern => {
    if (pattern.test(question)) score.science += 1;
  });
  
  // Explanation request detection
  const explanationPatterns = [
    /\b(explain|describe|define|what is|what are|what does)\b/,
    /\b(how does|how do|how is|how are)\b/,
    /\b(why does|why do|why is|why are)\b/,
    /\b(tell me about|tell me|meaning of|meaning)\b/,
    /\b(understand|understanding|clarify|elaborate)\b/
  ];
  explanationPatterns.forEach(pattern => {
    if (pattern.test(question)) score.explanation += 1;
  });
  
  // Return the type with highest score
  const maxScore = Math.max(score.math, score.science, score.explanation, score.calculation);
  if (maxScore === 0) return 'general';
  
  if (score.calculation >= maxScore) return 'calculation';
  if (score.math >= maxScore) return 'math';
  if (score.science >= maxScore) return 'science';
  if (score.explanation >= maxScore) return 'explanation';
  
  return 'general';
}

interface SessionData {
  subject?: string | null;
  chapter?: string | null;
}

function buildRAGPrompt(retrievedContent: string, session: SessionData | null | undefined, difficulty: string, question: string): string {
  const subject = session?.subject || 'the class';
  const chapter = session?.chapter || 'this lesson';
  const questionType = detectQuestionType(question);
  
  const difficultyInstructions: Record<string, string> = {
    easy: `**EASY MODE - For beginners:**
- Use simple, everyday language - explain like talking to a friend
- Use relatable analogies and real-world examples (like "think of electricity as water flowing through pipes")
- Break complex ideas into small, numbered steps
- Define any technical terms before using them
- Use bullet points and short sentences
- Include visual descriptions when helpful ("imagine a ball rolling down a hill...")
- Celebrate understanding with encouraging phrases`,
    medium: `**MEDIUM MODE - Balanced approach:**
- Clear explanations with appropriate examples
- Include relevant technical terms with brief explanations
- Balance depth with accessibility
- Use structured formatting with headers when helpful
- Connect concepts to show relationships
- Include practice tips or memory aids when relevant`,
    hard: `**HARD MODE - Advanced depth:**
- Provide comprehensive, detailed explanations
- Include technical terminology, formulas, and derivations
- Discuss edge cases and nuances
- Reference underlying principles and theories
- Assume strong foundational knowledge
- Include advanced applications and connections
- Mention common misconceptions to avoid`
  };

  const mathInstructions = `
**MATH PROBLEM SOLVING - CRITICAL NOTATION RULES:**

**ALWAYS USE PROPER MATHEMATICAL NOTATION:**

1. **Fractions:** NEVER write a/b or (a)/(b)
   ✅ CORRECT: Use stacked fractions: \frac{a}{b}
   ❌ WRONG: a/b, (a)/(b), a divided by b

2. **Greek Letters:** Use actual Greek symbols, not text
   ✅ CORRECT: θ, α, β, λ, π, φ, ω, Σ, Δ
   ❌ WRONG: theta, alpha, beta, lambda, pi, phi, omega

3. **Square Roots:** Use proper root symbol
   ✅ CORRECT: √(x), √(a² + b²), ∛(x)
   ❌ WRONG: sqrt(x), square root of x

4. **Trigonometric Functions:** Use proper notation
   ✅ CORRECT: sin θ, cos(θ), tan²θ, sin⁻¹(x)
   ❌ WRONG: sin(theta), sin(theta), sin^2(theta)

5. **Exponents and Subscripts:** Use proper superscripts/subscripts
   ✅ CORRECT: x², x³, a₁, a₂, e⁻ˣ, xⁿ
   ❌ WRONG: x^2, x^3, a_1, e^-x, x^n

6. **Operators:** Use proper mathematical symbols
   ✅ CORRECT: ×, ÷, ±, ∓, ≤, ≥, ≠, ≈, ∞, ∫, ∑, ∏
   ❌ WRONG: *, /, +-, <=, >=, !=, ~=, infinity

7. **Equations:** Write cleanly, vertically aligned, step-by-step
   ✅ CORRECT:
     x² + 2x + 1 = 0
     (x + 1)² = 0
     x + 1 = 0
     x = -1
   
   ❌ WRONG: x^2 + 2x + 1 = 0, so (x+1)^2 = 0, so x = -1

**FORMATTING RULES:**
- Write equations on separate lines, vertically aligned
- Use proper spacing around operators
- Make math look like a textbook or chalkboard, not code
- Let notation speak before explanation
- Show each step clearly with proper notation
- Use proper mathematical symbols throughout

**SOLUTION STRUCTURE:**
1. Write the problem with proper notation
2. Show each step with clean mathematical notation
3. Explain WHY each step is taken (after showing the notation)
4. Present final answer clearly with proper notation
5. Verify the answer makes sense

**EXAMPLES:**
- Instead of "sin(theta) = opposite/hypotenuse"
- Write: "sin θ = \frac{opposite}{hypotenuse}"

- Instead of "x^2 + 2x + 1 = 0"
- Write: "x² + 2x + 1 = 0"

- Instead of "sqrt(a^2 + b^2)"
- Write: "√(a² + b²)"

Remember: Clean. Visual. Elegant. Make it look like a textbook, not code.`;

  const scienceInstructions = `
**SCIENCE EXPLANATION:**
- Start with the core concept/definition
- Explain the underlying mechanism or process
- Use analogies to make abstract concepts concrete
- Connect to real-world applications and examples
- For formulas: explain each variable and its units
- Mention any common misconceptions`;

  const explanationInstructions = `
**TOPIC EXPLANATION (ChatGPT-style):**
- Start with a clear, concise definition or summary (1-2 sentences)
- Expand with key details and context
- Use the "what, why, how" framework when applicable
- Include relevant examples or analogies
- Structure with clear sections for complex topics
- End with key takeaways or implications
- Make it conversational and engaging`;
  
  const hasContent = retrievedContent && retrievedContent.trim().length > 0;
  
  // For math/science/explanation/calculation questions, allow general knowledge with content enhancement
  const allowGeneralKnowledge = ['math', 'science', 'explanation', 'calculation'].includes(questionType);
  
  if (!hasContent && !allowGeneralKnowledge) {
    return `You are an expert AI tutor. The student asked about a topic not found in the classroom materials.

RESPONSE: Politely explain that "This topic hasn't been covered in your uploaded class materials yet. Would you like to upload notes about this topic, or ask about something from your existing materials?"

Do NOT provide an answer using general knowledge for non-academic questions. Stay strictly within classroom content.`;
  }
  
  let typeSpecificInstructions = '';
  if (questionType === 'math' || questionType === 'calculation') typeSpecificInstructions = mathInstructions;
  else if (questionType === 'science') typeSpecificInstructions = scienceInstructions;
  else if (questionType === 'explanation') typeSpecificInstructions = explanationInstructions;
  
  const contentSection = hasContent ? `
--- CLASSROOM CONTENT (PRIMARY SOURCE) ---
${retrievedContent}
--- CLASSROOM CONTENT END ---

**CONTENT PRIORITY:** Use the classroom content above as your PRIMARY source. Enhance with your knowledge for math solutions, scientific explanations, and topic elaborations when the content doesn't fully answer the question.` : `
**NOTE:** No specific classroom content matches this question. You may use your general knowledge to help with this ${questionType} question, but keep answers educational and accurate.`;
  
  return `You are an expert AI tutor and educational assistant, similar to ChatGPT but specialized for students.
${session ? `Currently helping with: ${subject} - ${chapter}` : ''}

${difficultyInstructions[difficulty] || difficultyInstructions.medium}

${typeSpecificInstructions}

**YOUR CAPABILITIES:**
1. **Math Problem Solving:** Solve equations, word problems, calculations step-by-step
2. **Science Questions:** Explain concepts, processes, formulas with examples
3. **Topic Explanations:** Provide clear, comprehensive explanations like ChatGPT
4. **Study Help:** Connect concepts, provide memory aids, and clarify confusion
5. **Multi-step Reasoning:** Break down complex problems into manageable steps
6. **Context Integration:** Connect classroom content with real-world applications

**RESPONSE GUIDELINES:**
1. Be accurate, thorough, and educational
2. Use markdown formatting for clarity (headers, bullets, bold for key terms)
3. **For MATH questions:** ALWAYS use proper mathematical notation (see math instructions above)
4. For calculations: show your work step-by-step with proper notation, then explain
5. Be encouraging and supportive - learning is a journey!
6. If you're unsure, say so rather than guess
7. End complex answers with a "**Key Takeaway:**" summary
8. For explanations, structure as: Definition → Explanation → Examples → Summary
9. **Think step-by-step:** Show your reasoning process, not just the answer
10. **Connect ideas:** Link related concepts from the classroom content
11. **Use analogies:** Make abstract concepts concrete with relatable examples
12. **Notation first, explanation second:** Present clean mathematical notation, then explain what it means
${contentSection}

Answer at the ${difficulty.toUpperCase()} difficulty level. Be helpful, accurate, and engaging like a great tutor would be.

**CRITICAL FOR MATH QUESTIONS:** Always use proper mathematical notation. Never use programming-style notation (a/b, x^2, sqrt(x), sin(theta)). Use textbook-quality notation: \frac{a}{b}, x², √x, sin θ. Make it visual and elegant.`;
}

function getMatchedKeywords(question: string, chunkText: string): string[] {
  const questionWords = question.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const chunkLower = chunkText.toLowerCase();
  return questionWords.filter(word => chunkLower.includes(word));
}