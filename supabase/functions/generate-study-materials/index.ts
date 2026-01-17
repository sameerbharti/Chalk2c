import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GenerateSchema = z.object({
  sessionIds: z.array(z.string().uuid("Invalid session ID format")).min(1).max(20),
  type: z.enum(['summary', 'quiz', 'flashcards']),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
  count: z.number().min(3).max(20).optional().default(5)
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    const validationResult = GenerateSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      return new Response(JSON.stringify({ 
        error: "Validation failed", 
        details: validationResult.error.errors.map(e => e.message).join(", ")
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { sessionIds, type, difficulty, count } = validationResult.data;

    console.log(`Generating ${type} for sessions:`, sessionIds);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration is missing. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch chunks from all sessions
    const { data: chunks, error: chunksError } = await supabase
      .from('knowledge_chunks')
      .select('*')
      .in('session_id', sessionIds)
      .order('chunk_order', { ascending: true });

    if (chunksError) throw chunksError;

    // Fetch session metadata
    const { data: sessions } = await supabase
      .from('classroom_sessions')
      .select('subject, chapter')
      .in('id', sessionIds);

    const content = chunks?.map(c => c.chunk_text).join('\n\n') || '';
    const subjects = [...new Set(sessions?.map(s => s.subject).filter(Boolean))];
    const chapters = [...new Set(sessions?.map(s => s.chapter).filter(Boolean))];
    const contextInfo = `Subject: ${subjects.join(', ') || 'General'}. Topics: ${chapters.join(', ') || 'Various'}`;

    if (!content.trim()) {
      return new Response(JSON.stringify({ 
        error: "No content found for the selected sessions" 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const difficultyGuidelines: Record<string, string> = {
      easy: `- Use simple, everyday language
- Include helpful analogies and relatable examples
- Focus on core concepts only, skip advanced details
- Shorter, more digestible content`,
      medium: `- Balance clarity with appropriate technical detail
- Include relevant examples and applications
- Cover main concepts with some depth
- Standard academic language`,
      hard: `- Include comprehensive technical details
- Cover advanced concepts and edge cases
- Use precise academic/professional terminology
- Include derivations, proofs, or detailed explanations where relevant`
    };

    interface ToolConfig {
      type: string;
      function: {
        name: string;
        description: string;
        parameters: Record<string, unknown>;
      };
    }
    
    interface ToolChoice {
      type: string;
      function: { name: string };
    }
    
    interface PromptConfig {
      system: string;
      tools?: ToolConfig[];
      toolChoice?: ToolChoice;
    }
    
    const prompts: Record<string, PromptConfig> = {
      summary: {
        system: `You are an expert educational content creator. Create a comprehensive, well-organized summary of the following classroom content.

**Context:** ${contextInfo}
**Difficulty Level:** ${difficulty.toUpperCase()}

**Guidelines for ${difficulty} level:**
${difficultyGuidelines[difficulty] || difficultyGuidelines.medium}

**Summary Requirements:**
1. Start with a brief overview (2-3 sentences)
2. Organize content into logical sections with clear headings
3. Use bullet points for key facts and concepts
4. Highlight important terms in **bold**
5. Include a "Key Takeaways" section at the end
6. Add "Study Tips" relevant to the material
7. **For mathematical content:** Use proper mathematical notation:
   - Fractions: \frac{a}{b} (never a/b)
   - Greek letters: θ, α, β, λ, π (not theta, alpha, etc.)
   - Exponents: x², x³ (not x^2, x^3)
   - Roots: √x, √(a² + b²) (not sqrt(x))
   - Trig functions: sin θ, cos(θ) (not sin(theta))
   - Make math look like a textbook, not code

**Content to summarize:**
${content}

Format your response in clean markdown with proper headings (##), bullet points, and emphasis. Use proper mathematical notation throughout.`
      },
      quiz: {
        system: `You are an expert educational assessment designer. Create exactly ${count} high-quality multiple-choice questions that effectively test understanding of the content.

**Context:** ${contextInfo}
**Difficulty Level:** ${difficulty.toUpperCase()}

**Question Quality Guidelines for ${difficulty} level:**
${difficultyGuidelines[difficulty] || difficultyGuidelines.medium}

**Quiz Design Principles:**
1. Test UNDERSTANDING, not just memorization
2. Each question should have exactly 4 options
3. Wrong answers should be plausible but clearly incorrect when understood
4. Avoid "all of the above" or "none of the above"
5. Questions should cover different aspects of the material
6. Explanations should teach, not just state the answer
7. **For mathematical questions:** Use proper mathematical notation:
   - Fractions: \frac{a}{b} (never a/b)
   - Greek letters: θ, π, α, β (not theta, pi, etc.)
   - Exponents: x², e⁻ˣ (not x^2, e^-x)
   - Roots: √x, ∛x (not sqrt(x))
   - Trig: sin θ, cos²θ (not sin(theta), cos^2(theta))
   - Make all math notation clean and textbook-quality

**Content:**
${content}

Generate ${count} questions that progressively test understanding. Use proper mathematical notation in all questions and answers.`,
        tools: [{
          type: "function",
          function: {
            name: "create_quiz",
            description: "Create a comprehensive quiz with multiple choice questions",
            parameters: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question: { type: "string", description: "Clear, well-phrased question" },
                      options: { 
                        type: "array", 
                        items: { type: "string" },
                        description: "4 distinct answer options" 
                      },
                      correctIndex: { 
                        type: "number", 
                        description: "Index of correct answer (0-3)" 
                      },
                      explanation: { 
                        type: "string", 
                        description: "Educational explanation of why the answer is correct and others are wrong" 
                      }
                    },
                    required: ["question", "options", "correctIndex", "explanation"]
                  }
                }
              },
              required: ["questions"]
            }
          }
        }],
        toolChoice: { type: "function", function: { name: "create_quiz" } }
      },
      flashcards: {
        system: `You are an expert in spaced repetition and memory techniques. Create exactly ${count} effective flashcards optimized for learning and retention.

**Context:** ${contextInfo}
**Difficulty Level:** ${difficulty.toUpperCase()}

**Flashcard Design Guidelines for ${difficulty} level:**
${difficultyGuidelines[difficulty] || difficultyGuidelines.medium}

**Flashcard Best Practices:**
1. Front: Ask ONE clear question or present ONE term/concept
2. Back: Provide a concise, memorable answer
3. Include helpful hints that prompt recall without giving away the answer
4. Cover a variety of question types: definitions, applications, comparisons, processes
5. Make answers specific and unambiguous
6. Order from fundamental to advanced concepts
7. **For mathematical flashcards:** Use proper mathematical notation:
   - Fractions: \frac{a}{b} (never a/b)
   - Greek letters: θ, π, α, β (not theta, pi, etc.)
   - Exponents: x², aⁿ (not x^2, a^n)
   - Roots: √x, √(a² + b²) (not sqrt(x))
   - Trig: sin θ, cos(θ) (not sin(theta))
   - Make notation clean and visual

**Content:**
${content}

Generate ${count} flashcards that build understanding progressively. Use proper mathematical notation throughout.`,
        tools: [{
          type: "function",
          function: {
            name: "create_flashcards",
            description: "Create effective flashcards for spaced repetition learning",
            parameters: {
              type: "object",
              properties: {
                flashcards: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      front: { type: "string", description: "Question, term, or prompt on the front" },
                      back: { type: "string", description: "Clear, concise answer on the back" },
                      hint: { type: "string", description: "Helpful hint that prompts recall without revealing the answer" }
                    },
                    required: ["front", "back", "hint"]
                  }
                }
              },
              required: ["flashcards"]
            }
          }
        }],
        toolChoice: { type: "function", function: { name: "create_flashcards" } }
      }
    };

    const promptConfig = prompts[type];
    interface RequestBody {
      model: string;
      messages: Array<{ role: string; content: string }>;
      max_tokens: number;
      temperature: number;
      tools?: ToolConfig[];
      tool_choice?: ToolChoice;
    }
    const requestBody: RequestBody = {
      model: "gpt-4o",
      messages: [
        { role: "system", content: promptConfig.system },
        { role: "user", content: `Generate the ${type} now.` }
      ],
      max_tokens: 4096,
      temperature: 0.7,
    };

    if (promptConfig.tools) {
      requestBody.tools = promptConfig.tools;
      requestBody.tool_choice = promptConfig.toolChoice;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    console.log("AI result:", JSON.stringify(aiResult).substring(0, 500));

    interface SummaryResult {
      type: 'summary';
      content: string;
      metadata: { subjects: string[]; chapters: string[]; difficulty: string };
    }
    
    interface QuizResult {
      type: 'quiz';
      questions: Array<{
        question: string;
        options: string[];
        correctIndex: number;
        explanation: string;
      }>;
      metadata: { subjects: string[]; chapters: string[]; difficulty: string; count: number };
    }
    
    interface FlashcardsResult {
      type: 'flashcards';
      flashcards: Array<{
        front: string;
        back: string;
        hint: string;
      }>;
      metadata: { subjects: string[]; chapters: string[]; difficulty: string; count: number };
    }
    
    let result: SummaryResult | QuizResult | FlashcardsResult;

    if (type === 'summary') {
      result = {
        type: 'summary',
        content: aiResult.choices?.[0]?.message?.content || 'Failed to generate summary',
        metadata: { subjects, chapters, difficulty }
      };
    } else {
      // Extract from tool call
      const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        try {
          const parsed = JSON.parse(toolCall.function.arguments);
          result = {
            type,
            ...parsed,
            metadata: { subjects, chapters, difficulty, count }
          };
        } catch (e) {
          console.error("Failed to parse tool response:", e);
          throw new Error("Failed to parse generated content");
        }
      } else {
        throw new Error("No structured response received");
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Generate error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
