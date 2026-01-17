import { useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Flashcard {
  front: string;
  back: string;
  hint?: string;
}

export interface SummaryResult {
  type: 'summary';
  content: string;
  metadata: { subjects: string[]; chapters: string[]; difficulty: string };
}

export interface QuizResult {
  type: 'quiz';
  questions: QuizQuestion[];
  metadata: { subjects: string[]; chapters: string[]; difficulty: string; count: number };
}

export interface FlashcardsResult {
  type: 'flashcards';
  flashcards: Flashcard[];
  metadata: { subjects: string[]; chapters: string[]; difficulty: string; count: number };
}

export type StudyMaterial = SummaryResult | QuizResult | FlashcardsResult;

export const useStudyMaterials = (sessionIds: string[]) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [quiz, setQuiz] = useState<QuizResult | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardsResult | null>(null);

  const generate = useCallback(async (
    type: 'summary' | 'quiz' | 'flashcards',
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    count: number = 5
  ): Promise<StudyMaterial | null> => {
    if (!isSupabaseConfigured()) {
      toast({
        title: "Configuration Required",
        description: "Please set up your Supabase environment variables. See the warning at the top of the page.",
        variant: "destructive",
      });
      return null;
    }

    if (sessionIds.length === 0) {
      toast({ title: "No content", description: "Please upload content first.", variant: "destructive" });
      return null;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-study-materials', {
        body: { sessionIds, type, difficulty, count }
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      const result = data as StudyMaterial;

      switch (type) {
        case 'summary':
          setSummary(result as SummaryResult);
          break;
        case 'quiz':
          setQuiz(result as QuizResult);
          break;
        case 'flashcards':
          setFlashcards(result as FlashcardsResult);
          break;
      }

      toast({ title: "Generated!", description: `Your ${type} is ready.` });
      return result;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate';
      toast({ title: "Generation Error", description: message, variant: "destructive" });
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [sessionIds]);

  const reset = useCallback(() => {
    setSummary(null);
    setQuiz(null);
    setFlashcards(null);
  }, []);

  return {
    isGenerating,
    summary,
    quiz,
    flashcards,
    generate,
    reset
  };
};
