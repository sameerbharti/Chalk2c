import { useState, useCallback, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { UploadedFile } from '@/components/MultiFileUpload';
import { SessionInfo, OCRResult } from './useOCR';

// Generate a unique browser ID for this device/browser
const getBrowserId = (): string => {
  const storageKey = 'c2chat_browser_id';
  let browserId = localStorage.getItem(storageKey);
  if (!browserId) {
    browserId = `browser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(storageKey, browserId);
  }
  return browserId;
};

export const useMultiFileOCR = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [pendingResults, setPendingResults] = useState<Map<string, { text: string; subject: string; chapter: string; sessionId: string }>>(new Map());
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [browserId] = useState(getBrowserId);
  const [error, setError] = useState<string | null>(null);

  const processAllFiles = async (uploadedFiles: UploadedFile[]): Promise<void> => {
    if (!isSupabaseConfigured()) {
      toast({
        title: "Configuration Required",
        description: "Please set up your Supabase environment variables. See the warning at the top of the page.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessedCount(0);
    setError(null);

    const results = new Map<string, { text: string; subject: string; chapter: string; sessionId: string }>();

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      
      // Update file status to processing
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'processing' as const } : f
      ));

      try {
        let result;
        if (file.type === 'pdf') {
          result = await processPDF(file.file);
        } else {
          result = await processImage(file.file);
        }

        if (result) {
          results.set(file.id, result);
          setFiles(prev => prev.map(f => 
            f.id === file.id ? { ...f, status: 'complete' as const } : f
          ));
        } else {
          setFiles(prev => prev.map(f => 
            f.id === file.id ? { ...f, status: 'error' as const, error: 'Processing failed' } : f
          ));
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Processing failed';
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'error' as const, error: errorMsg } : f
        ));
      }

      setProcessedCount(i + 1);
    }

    setPendingResults(results);
    setIsProcessing(false);

    const successCount = Array.from(results.values()).length;
    if (successCount > 0) {
      toast({
        title: "Processing Complete!",
        description: `Successfully processed ${successCount} of ${uploadedFiles.length} files. Review and confirm to index.`,
      });
    }
  };

  const processImage = async (imageFile: File): Promise<{ text: string; subject: string; chapter: string; sessionId: string } | null> => {
    const base64 = await fileToBase64(imageFile);
    
    // Create a pending session
    const { data: session, error: sessionError } = await supabase
      .from('classroom_sessions')
      .insert({
        subject: 'General',
        chapter: 'Lesson',
        status: 'pending'
      })
      .select()
      .single();

    if (sessionError) {
      throw new Error(`Failed to create session: ${sessionError.message}`);
    }

    const { data, error: fnError } = await supabase.functions.invoke('process-ocr', {
      body: {
        imageBase64: base64,
        sessionId: session.id,
        skipIndexing: true
      }
    });

    if (fnError) throw new Error(fnError.message);
    if (data.error) throw new Error(data.error);

    return {
      text: data.extractedText,
      subject: data.subject || 'General',
      chapter: data.chapter || 'Lesson',
      sessionId: session.id
    };
  };

  const processPDF = async (pdfFile: File): Promise<{ text: string; subject: string; chapter: string; sessionId: string } | null> => {
    const base64 = await fileToBase64(pdfFile);
    
    // Create a pending session
    const { data: session, error: sessionError } = await supabase
      .from('classroom_sessions')
      .insert({
        subject: 'General',
        chapter: pdfFile.name.replace('.pdf', ''),
        status: 'pending'
      })
      .select()
      .single();

    if (sessionError) {
      throw new Error(`Failed to create session: ${sessionError.message}`);
    }

    const { data, error: fnError } = await supabase.functions.invoke('process-ocr', {
      body: {
        pdfBase64: base64,
        fileName: pdfFile.name,
        sessionId: session.id,
        skipIndexing: true
      }
    });

    if (fnError) throw new Error(fnError.message);
    if (data.error) throw new Error(data.error);

    return {
      text: data.extractedText,
      subject: data.subject || 'General',
      chapter: data.chapter || pdfFile.name.replace('.pdf', ''),
      sessionId: session.id
    };
  };

  const confirmAndIndexAll = async (
    edits: Map<string, { text: string; subject: string; chapter: string }>
  ): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
      toast({
        title: "Configuration Required",
        description: "Please set up your Supabase environment variables.",
        variant: "destructive",
      });
      return false;
    }

    setIsProcessing(true);
    let successCount = 0;
    const errors: string[] = [];

    for (const [fileId, pending] of pendingResults) {
      const edited = edits.get(fileId) || pending;
      
      // Validate text is not empty
      if (!edited.text || edited.text.trim().length === 0) {
        errors.push(`File ${fileId}: Text is empty`);
        continue;
      }
      
      try {
        const { data, error: fnError } = await supabase.functions.invoke('index-content', {
          body: {
            sessionId: pending.sessionId,
            text: edited.text.trim(),
            subject: edited.subject || 'General',
            chapter: edited.chapter || 'Lesson'
          }
        });

        if (fnError) {
          const errorMsg = fnError.message || 'Unknown error';
          errors.push(`File ${fileId}: ${errorMsg}`);
          console.error(`Failed to index file ${fileId}:`, fnError);
          continue;
        }
        
        if (data?.error) {
          errors.push(`File ${fileId}: ${data.error}`);
          console.error(`Failed to index file ${fileId}:`, data.error);
          continue;
        }

        if (!data?.success) {
          errors.push(`File ${fileId}: Indexing failed - no success response`);
          continue;
        }

        setSessions(prev => [...prev, {
          id: pending.sessionId,
          subject: edited.subject || 'General',
          chapter: edited.chapter || 'Lesson',
          date: new Date().toISOString().split('T')[0],
          chunksCount: data.chunksCreated || 0
        }]);

        successCount++;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`File ${fileId}: ${errorMsg}`);
        console.error(`Failed to index file ${fileId}:`, err);
      }
    }

    setPendingResults(new Map());
    setIsProcessing(false);

    if (successCount > 0) {
      if (errors.length > 0) {
        toast({
          title: "Partially Indexed",
          description: `Successfully indexed ${successCount} of ${pendingResults.size} files. Some errors occurred.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Content Indexed!",
          description: `Successfully indexed ${successCount} file${successCount !== 1 ? 's' : ''}.`,
        });
      }
      return true;
    } else {
      // All failed
      const errorMessage = errors.length > 0 
        ? errors.slice(0, 3).join('; ') + (errors.length > 3 ? ` and ${errors.length - 3} more...` : '')
        : 'Indexing failed. Please check browser console for details.';
      
      toast({
        title: "Indexing Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

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
    setFiles([]);
    setPendingResults(new Map());
    setProcessedCount(0);
    setError(null);
  };

  const getAllSessionIds = () => sessions.map(s => s.id);

  const getCombinedText = () => {
    return Array.from(pendingResults.values())
      .map(r => r.text)
      .join('\n\n---\n\n');
  };

  const getCombinedMetadata = () => {
    const values = Array.from(pendingResults.values());
    if (values.length === 0) return { subject: 'General', chapter: 'Lesson' };
    return {
      subject: values[0].subject,
      chapter: values.length > 1 ? 'Multiple Documents' : values[0].chapter
    };
  };

  return {
    processAllFiles,
    confirmAndIndexAll,
    loadSessions,
    isProcessing,
    processedCount,
    files,
    setFiles,
    pendingResults,
    sessions,
    error,
    reset,
    getAllSessionIds,
    getCombinedText,
    getCombinedMetadata
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
