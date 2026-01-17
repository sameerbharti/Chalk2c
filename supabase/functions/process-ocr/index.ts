import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const ProcessOCRSchema = z.object({
  imageBase64: z.string().max(10_000_000, "Image too large (max ~7MB)").optional(),
  pdfBase64: z.string().max(15_000_000, "PDF too large (max ~10MB)").optional(),
  fileName: z.string().max(255, "Filename too long").optional(),
  sessionId: z.string().uuid("Invalid session ID format"),
  subject: z.string().max(200, "Subject too long").optional(),
  chapter: z.string().max(200, "Chapter too long").optional(),
  skipIndexing: z.boolean().optional().default(false)
}).refine(data => data.imageBase64 || data.pdfBase64, {
  message: "Either imageBase64 or pdfBase64 is required"
});

// Sanitize text output from AI
function sanitizeText(text: string): string {
  if (!text) return '';
  // Remove control characters (excluding common whitespace)
  return text
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Remove control characters
    .substring(0, 100000); // Reasonable max length
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    const rawBody = await req.json();
    const validationResult = ProcessOCRSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      return new Response(JSON.stringify({ 
        error: "Validation failed", 
        details: validationResult.error.errors.map(e => e.message).join(", ")
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { imageBase64, pdfBase64, fileName, sessionId, subject, chapter, skipIndexing } = validationResult.data;

    const isPDF = !!pdfBase64;
    console.log("Processing", isPDF ? "PDF" : "Image", "for session:", sessionId, "Skip indexing:", skipIndexing);

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

    // Build the appropriate prompt based on content type
    interface UserContentItem {
      type: string;
      text?: string;
      image_url?: { url: string };
    }
    let userContent: UserContentItem[];
    let systemPrompt: string;

    if (isPDF) {
      systemPrompt = `You are an expert document analyzer specialized in extracting and organizing content from educational PDFs and documents.
            
Your task:
1. Extract ALL text from the document accurately
2. Preserve the structure and formatting (headings, bullet points, equations, tables)
3. For mathematical formulas, use standard notation (e.g., F = ma, E = mc²)
4. Identify the subject matter and any chapter/topic information
5. Rate your confidence in the extraction (0-100)
6. Extract key concepts and learning objectives

Respond in this exact JSON format:
{
  "extracted_text": "The full extracted text with formatting preserved",
  "subject": "Detected subject (e.g., Physics, Math, Chemistry)",
  "chapter": "Detected chapter/topic if visible",
  "confidence": 85,
  "key_concepts": ["concept1", "concept2", "concept3"]
}`;

      const sanitizedFileName = (fileName || 'document.pdf').substring(0, 100);
      userContent = [
        { 
          type: "text", 
          text: `Please extract all text and content from this PDF document named "${sanitizedFileName}". Be thorough and preserve structure.` 
        },
        { 
          type: "image_url", 
          image_url: { 
            url: pdfBase64!.startsWith('data:') ? pdfBase64! : `data:application/pdf;base64,${pdfBase64}` 
          } 
        }
      ];
    } else {
      systemPrompt = `You are an expert OCR system specialized in extracting text from classroom blackboards and handwritten notes. 
            
Your task:
1. Extract ALL text visible in the image accurately
2. Preserve the structure and formatting (headings, bullet points, equations)
3. For mathematical formulas, use standard notation (e.g., F = ma, E = mc²)
4. Identify the subject matter and any chapter/topic information
5. Rate your confidence in the extraction (0-100)

Respond in this exact JSON format:
{
  "extracted_text": "The full extracted text with formatting preserved",
  "subject": "Detected subject (e.g., Physics, Math, Chemistry)",
  "chapter": "Detected chapter/topic if visible",
  "confidence": 85,
  "key_concepts": ["concept1", "concept2", "concept3"]
}`;

      userContent = [
        { type: "text", text: "Please extract all text from this classroom blackboard image. Be thorough and accurate." },
        { type: "image_url", image_url: { url: imageBase64!.startsWith('data:') ? imageBase64! : `data:image/jpeg;base64,${imageBase64}` } }
      ];
    }

    // Use OpenAI with vision capabilities
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o", // GPT-4o supports vision for images and PDFs
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent }
        ],
        max_tokens: 8192,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content;
    
    console.log("AI Response received");

    // Parse the JSON response
    let ocrData;
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      ocrData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.log("Failed to parse JSON, using raw content");
      ocrData = {
        extracted_text: content,
        subject: subject || "General",
        chapter: chapter || "Unknown",
        confidence: 75,
        key_concepts: []
      };
    }

    // Sanitize the extracted text
    const sanitizedExtractedText = sanitizeText(ocrData.extracted_text);
    const sanitizedSubject = (ocrData.subject || subject || 'General').substring(0, 200);
    const sanitizedChapter = (ocrData.chapter || chapter || 'Lesson').substring(0, 200);

    // If skipIndexing, just return the OCR result without creating chunks
    if (skipIndexing) {
      // Update session with pending status
      await supabase
        .from('classroom_sessions')
        .update({
          raw_extracted_text: sanitizedExtractedText,
          subject: sanitizedSubject,
          chapter: sanitizedChapter,
          ocr_confidence: ocrData.confidence || 85,
          status: 'pending'
        })
        .eq('id', sessionId);

      return new Response(JSON.stringify({
        success: true,
        sessionId,
        extractedText: sanitizedExtractedText,
        subject: sanitizedSubject,
        chapter: sanitizedChapter,
        confidence: ocrData.confidence || 85,
        chunksCreated: 0,
        keyConcepts: (ocrData.key_concepts || []).slice(0, 20)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Full indexing flow (legacy support)
    const chunks = createChunks(sanitizedExtractedText);
    
    await supabase
      .from('classroom_sessions')
      .update({
        raw_extracted_text: sanitizedExtractedText,
        subject: sanitizedSubject,
        chapter: sanitizedChapter,
        ocr_confidence: ocrData.confidence || 85,
        status: 'completed'
      })
      .eq('id', sessionId);

    const chunkRecords = chunks.map((chunk, index) => ({
      session_id: sessionId,
      chunk_text: chunk.text,
      chunk_type: chunk.type,
      subject: sanitizedSubject,
      chapter: sanitizedChapter,
      difficulty: chunk.difficulty,
      ocr_confidence: ocrData.confidence || 85,
      chunk_order: index
    }));

    if (chunkRecords.length > 0) {
      await supabase.from('knowledge_chunks').insert(chunkRecords);
    }

    console.log(`Successfully processed OCR: ${chunks.length} chunks created`);

    return new Response(JSON.stringify({
      success: true,
      sessionId,
      extractedText: sanitizedExtractedText,
      subject: sanitizedSubject,
      chapter: sanitizedChapter,
      confidence: ocrData.confidence || 85,
      chunksCreated: chunks.length,
      keyConcepts: (ocrData.key_concepts || []).slice(0, 20)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("OCR processing error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function createChunks(text: string): Array<{text: string, type: string, difficulty: string}> {
  const chunks: Array<{text: string, type: string, difficulty: string}> = [];
  if (!text) return chunks;
  
  // Enhanced sentence splitting
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 10);
  
  // Semantic chunking with better grouping
  let currentChunk: string[] = [];
  let currentLength = 0;
  const targetChunkSize = 150;
  const maxChunkSize = 300;
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const wordCount = sentence.split(/\s+/).length;
    
    if (currentLength + wordCount > maxChunkSize && currentChunk.length > 0) {
      const chunkText = currentChunk.join(' ').trim();
      if (chunkText.length > 20) {
        const difficulty = assessDifficulty(chunkText);
        chunks.push({ text: chunkText, type: 'concept', difficulty });
      }
      currentChunk = [sentence];
      currentLength = wordCount;
    } else {
      currentChunk.push(sentence);
      currentLength += wordCount;
      
      if (currentLength >= targetChunkSize && i < sentences.length - 1) {
        const nextSentence = sentences[i + 1];
        if (isNewTopic(sentence, nextSentence)) {
          const chunkText = currentChunk.join(' ').trim();
          if (chunkText.length > 20) {
            const difficulty = assessDifficulty(chunkText);
            chunks.push({ text: chunkText, type: 'concept', difficulty });
          }
          currentChunk = [];
          currentLength = 0;
        }
      }
    }
  }
  
  if (currentChunk.length > 0) {
    const chunkText = currentChunk.join(' ').trim();
    if (chunkText.length > 20) {
      const difficulty = assessDifficulty(chunkText);
      chunks.push({ text: chunkText, type: 'concept', difficulty });
    }
  }
  
  if (text.length > 200 && chunks.length > 2) {
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
    if (paragraphs.length > 0) {
      const summaryText = paragraphs.slice(0, Math.min(3, paragraphs.length))
        .join(' ')
        .substring(0, 500)
        .trim();
      if (summaryText.length > 50) {
        chunks.push({ 
          text: `Summary: ${summaryText}`, 
          type: 'summary', 
          difficulty: 'medium' 
        });
      }
    }
  }
  
  return chunks;
}

function assessDifficulty(text: string): string {
  const textLower = text.toLowerCase();
  
  const easyPatterns = [
    /example|simple|basic|introduction|overview|summary/i,
    /first|begin|start|learn|understand|know/i,
    /easy|simple|straightforward|clear/i
  ];
  const easyScore = easyPatterns.reduce((score, pattern) => 
    score + (pattern.test(text) ? 1 : 0), 0
  );
  
  const hardPatterns = [
    /theorem|proof|derivative|integral|calculus|advanced|complex/i,
    /assume|suppose|therefore|thus|hence|consequently/i,
    /mathematical|theoretical|abstract|sophisticated/i,
    /formula|equation|algorithm|methodology/i
  ];
  const hardScore = hardPatterns.reduce((score, pattern) => 
    score + (pattern.test(text) ? 1 : 0), 0
  );
  
  const avgWordLength = text.split(/\s+/).reduce((sum, word) => sum + word.length, 0) / text.split(/\s+/).length;
  const hasLongWords = avgWordLength > 6;
  const hasNumbers = /\d+/.test(text);
  const hasFormulas = /[=+\-*/^()]/.test(text);
  
  if (hardScore >= 2 || (hasLongWords && hasFormulas)) return 'hard';
  if (easyScore >= 2 && hardScore === 0) return 'easy';
  if (hasNumbers && hasFormulas) return 'hard';
  
  return 'medium';
}

function isNewTopic(currentSentence: string, nextSentence: string): boolean {
  const topicIndicators = [
    /^(now|next|furthermore|additionally|moreover|however|therefore|thus|hence)/i,
    /^(in|for|when|where|what|how|why)/i,
    /^[A-Z][a-z]+ (is|are|was|were|has|have|does|do)/i
  ];
  
  return topicIndicators.some(pattern => pattern.test(nextSentence.trim()));
}