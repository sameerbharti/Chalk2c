import { useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface OCRResult {
  sessionId: string;
  extractedText: string;
  subject: string;
  chapter: string;
  confidence: number;
  chunksCreated: number;
  keyConcepts: string[];
  sessionDate: string;
}

export interface SessionInfo {
  id: string;
  subject: string;
  chapter: string;
  date: string;
  chunksCount: number;
}

export const useOCR = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Process image and get OCR result (but don't index yet)
  const processImage = async (imageFile: File, subject?: string, chapter?: string): Promise<OCRResult | null> => {
    if (!isSupabaseConfigured()) {
      setError('Supabase is not configured. Please set up environment variables.');
      toast({
        title: "Configuration Required",
        description: "Please set up your Supabase environment variables.",
        variant: "destructive",
      });
      return null;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const base64 = await fileToBase64(imageFile);
      
      // Create a pending session
      const { data: session, error: sessionError } = await supabase
        .from('classroom_sessions')
        .insert({
          subject: subject || 'General',
          chapter: chapter || 'Lesson',
          status: 'pending'
        })
        .select()
        .single();

      if (sessionError) {
        throw new Error(`Failed to create session: ${sessionError.message}`);
      }

      // Call OCR but with indexing disabled (we'll do it after teacher review)
      const { data, error: fnError } = await supabase.functions.invoke('process-ocr', {
        body: {
          imageBase64: base64,
          sessionId: session.id,
          subject,
          chapter,
          skipIndexing: true // New flag to skip auto-indexing
        }
      });

      if (fnError) throw new Error(fnError.message);
      if (data.error) throw new Error(data.error);

      // Store pending text for teacher review
      setPendingText(data.extractedText);
      setPendingSessionId(session.id);

      const result: OCRResult = {
        sessionId: session.id,
        extractedText: data.extractedText,
        subject: data.subject || subject || 'General',
        chapter: data.chapter || chapter || 'Lesson',
        confidence: data.confidence,
        chunksCreated: 0, // Not indexed yet
        keyConcepts: data.keyConcepts || [],
        sessionDate: new Date().toISOString().split('T')[0]
      };

      setOcrResult(result);
      
      toast({
        title: "OCR Complete!",
        description: "Review and edit the text, then confirm to index.",
      });

      return result;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'OCR processing failed';
      setError(message);
      toast({ title: "OCR Error", description: message, variant: "destructive" });
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirm and index the (possibly edited) text
  const confirmAndIndex = async (
    editedText: string, 
    subject: string, 
    chapter: string
  ): Promise<boolean> => {
    if (!pendingSessionId) return false;

    if (!isSupabaseConfigured()) {
      toast({
        title: "Configuration Required",
        description: "Please set up your Supabase environment variables.",
        variant: "destructive",
      });
      return false;
    }

    setIsProcessing(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('index-content', {
        body: {
          sessionId: pendingSessionId,
          text: editedText,
          subject,
          chapter
        }
      });

      if (fnError) throw new Error(fnError.message);
      if (data.error) throw new Error(data.error);

      // Update OCR result with final data
      setOcrResult(prev => prev ? {
        ...prev,
        extractedText: editedText,
        subject,
        chapter,
        chunksCreated: data.chunksCreated
      } : null);

      // Add to sessions list
      setSessions(prev => [...prev, {
        id: pendingSessionId,
        subject,
        chapter,
        date: new Date().toISOString().split('T')[0],
        chunksCount: data.chunksCreated
      }]);

      setPendingText(null);

      toast({
        title: "Content Indexed!",
        description: `Created ${data.chunksCreated} knowledge chunks.`,
      });

      return true;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Indexing failed';
      toast({ title: "Indexing Error", description: message, variant: "destructive" });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // Add another image to existing knowledge base
  const addMoreContent = async (imageFile: File, subject?: string, chapter?: string) => {
    return processImage(imageFile, subject, chapter);
  };

  // Load existing sessions
  const loadSessions = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      return; // Silently fail if not configured
    }

    try {
    const { data, error } = await supabase
      .from('classroom_sessions')
      .select('id, subject, chapter, session_date, status')
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const sessionInfos: SessionInfo[] = [];
      for (const s of data) {
        const { count } = await supabase
          .from('knowledge_chunks')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', s.id);
        
        sessionInfos.push({
          id: s.id,
          subject: s.subject || 'General',
          chapter: s.chapter || 'Lesson',
          date: s.session_date || new Date().toISOString().split('T')[0],
          chunksCount: count || 0
        });
      }
      setSessions(sessionInfos);
    } else if (error) {
      console.error('Error loading sessions:', error);
    }
    } catch (err) {
      console.error('Error loading sessions:', err);
    }
  }, []);

  const reset = () => {
    setOcrResult(null);
    setPendingText(null);
    setPendingSessionId(null);
    setError(null);
  };

  const getAllSessionIds = () => sessions.map(s => s.id);

  return {
    processImage,
    confirmAndIndex,
    addMoreContent,
    loadSessions,
    isProcessing,
    ocrResult,
    pendingText,
    sessions,
    error,
    reset,
    getAllSessionIds
  };
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
