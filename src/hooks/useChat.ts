import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface RetrievalDetail {
  text: string;
  type: string;
  difficulty: string;
  score: number;
  matchedKeywords: string[];
  source?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  isRefusal?: boolean;
  retrievalDetails?: RetrievalDetail[];
}

export const useChat = (sessionId: string | null, sessionIds: string[] = []) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (
    question: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    dateFilter?: string
  ): Promise<void> => {
    const activeIds = sessionIds.length > 0 ? sessionIds : (sessionId ? [sessionId] : []);
    
    if (activeIds.length === 0 || !question.trim()) {
      toast({ title: "Cannot send message", description: "Please process an image first.", variant: "destructive" });
      return;
    }

    const userMessage: Message = { id: `user-${Date.now()}`, role: 'user', content: question.trim() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const messageHistory = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));

      const { data, error: fnError } = await supabase.functions.invoke('chat', {
        body: {
          sessionId: activeIds[0],
          sessionIds: activeIds,
          question: question.trim(),
          messages: messageHistory,
          difficulty,
          dateFilter
        }
      });

      if (fnError) throw new Error(fnError.message);
      if (data.error) throw new Error(data.error);

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        sources: data.sources || [],
        isRefusal: data.isRefusal || false,
        retrievalDetails: data.retrievalDetails || []
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get response';
      setMessages(prev => [...prev, { id: `error-${Date.now()}`, role: 'assistant', content: `Error: ${message}`, isRefusal: true }]);
      toast({ title: "Chat Error", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, sessionIds, messages]);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, isLoading, sendMessage, clearMessages };
};
