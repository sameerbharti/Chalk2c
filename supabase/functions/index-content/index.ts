import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const IndexContentSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID format"),
  text: z.string().min(1, "Text is required").max(100000, "Text too long (max 100,000 characters)"),
  subject: z.string().max(200, "Subject too long").optional().default("General"),
  chapter: z.string().max(200, "Chapter too long").optional().default("Lesson")
});

// Sanitize text content
function sanitizeText(text: string): string {
  if (!text) return '';
  // Remove control characters (excluding common whitespace)
  return text
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Remove control characters
    .trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    const rawBody = await req.json();
    const validationResult = IndexContentSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      return new Response(JSON.stringify({ 
        error: "Validation failed", 
        details: validationResult.error.errors.map(e => e.message).join(", ")
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { sessionId, text, subject, chapter } = validationResult.data;
    
    // Sanitize inputs
    const sanitizedText = sanitizeText(text);
    const sanitizedSubject = subject.substring(0, 200);
    const sanitizedChapter = chapter.substring(0, 200);

    console.log("Indexing content for session:", sessionId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration is missing. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create chunks from the (possibly edited) text
    const chunks = createChunks(sanitizedText);

    // Delete any existing chunks for this session (in case of re-indexing)
    await supabase
      .from('knowledge_chunks')
      .delete()
      .eq('session_id', sessionId);

    // Insert new chunks
    const chunkRecords = chunks.map((chunk, index) => ({
      session_id: sessionId,
      chunk_text: chunk.text,
      chunk_type: chunk.type,
      subject: sanitizedSubject,
      chapter: sanitizedChapter,
      difficulty: chunk.difficulty,
      ocr_confidence: 100, // Teacher-reviewed
      chunk_order: index
    }));

    if (chunkRecords.length > 0) {
      const { error: chunkError } = await supabase
        .from('knowledge_chunks')
        .insert(chunkRecords);

      if (chunkError) {
        console.error("Error inserting chunks:", chunkError);
        throw chunkError;
      }
    }

    // Update session status
    await supabase
      .from('classroom_sessions')
      .update({
        raw_extracted_text: sanitizedText,
        subject: sanitizedSubject,
        chapter: sanitizedChapter,
        status: 'completed',
        ocr_confidence: 100
      })
      .eq('id', sessionId);

    console.log(`Successfully indexed: ${chunks.length} chunks`);

    return new Response(JSON.stringify({
      success: true,
      sessionId,
      chunksCreated: chunks.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Indexing error:", error);
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
  
  // Enhanced sentence splitting that preserves context
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 10); // Filter out very short fragments
  
  // Semantic chunking: group related sentences together
  let currentChunk: string[] = [];
  let currentLength = 0;
  const targetChunkSize = 150; // Target ~150 words per chunk
  const maxChunkSize = 300; // Max ~300 words
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const wordCount = sentence.split(/\s+/).length;
    
    // Check if adding this sentence would exceed max size
    if (currentLength + wordCount > maxChunkSize && currentChunk.length > 0) {
      // Finalize current chunk
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
      
      // If we've reached target size and next sentence starts a new topic, finalize chunk
      if (currentLength >= targetChunkSize && i < sentences.length - 1) {
        const nextSentence = sentences[i + 1];
        // Check if next sentence seems like a new topic (starts with capital, has topic indicators)
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
  
  // Add remaining sentences as final chunk
  if (currentChunk.length > 0) {
    const chunkText = currentChunk.join(' ').trim();
    if (chunkText.length > 20) {
      const difficulty = assessDifficulty(chunkText);
      chunks.push({ text: chunkText, type: 'concept', difficulty });
    }
  }
  
  // Create summary chunk if content is substantial
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
  
  // Easy indicators
  const easyPatterns = [
    /example|simple|basic|introduction|overview|summary/i,
    /first|begin|start|learn|understand|know/i,
    /easy|simple|straightforward|clear/i
  ];
  const easyScore = easyPatterns.reduce((score, pattern) => 
    score + (pattern.test(text) ? 1 : 0), 0
  );
  
  // Hard indicators
  const hardPatterns = [
    /theorem|proof|derivative|integral|calculus|advanced|complex/i,
    /assume|suppose|therefore|thus|hence|consequently/i,
    /mathematical|theoretical|abstract|sophisticated/i,
    /formula|equation|algorithm|methodology/i
  ];
  const hardScore = hardPatterns.reduce((score, pattern) => 
    score + (pattern.test(text) ? 1 : 0), 0
  );
  
  // Length and complexity indicators
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
  // Check if next sentence seems like a new topic
  const topicIndicators = [
    /^(now|next|furthermore|additionally|moreover|however|therefore|thus|hence)/i,
    /^(in|for|when|where|what|how|why)/i,
    /^[A-Z][a-z]+ (is|are|was|were|has|have|does|do)/i
  ];
  
  return topicIndicators.some(pattern => pattern.test(nextSentence.trim()));
}