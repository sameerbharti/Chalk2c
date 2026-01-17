import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Brain, Lightbulb, FileText, ChevronRight, RotateCcw, Check, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useStudyMaterials, QuizQuestion, Flashcard } from '@/hooks/useStudyMaterials';

interface StudyMaterialsProps {
  sessionIds: string[];
  isEnabled: boolean;
}

export const StudyMaterials = ({ sessionIds, isEnabled }: StudyMaterialsProps) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [count, setCount] = useState(5);
  
  const { isGenerating, summary, quiz, flashcards, generate } = useStudyMaterials(sessionIds);

  const handleGenerate = () => {
    generate(activeTab as 'summary' | 'quiz' | 'flashcards', difficulty, count);
  };

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl font-bold text-foreground mb-3">Study Materials</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Generate summaries, quizzes, and flashcards from your uploaded content
          </p>
        </motion.div>

        <Card className="max-w-4xl mx-auto border-primary/20">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Generate Study Tools
              </CardTitle>
              
              <div className="flex items-center gap-3">
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as 'easy' | 'medium' | 'hard')}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>

                {activeTab !== 'summary' && (
                  <Select value={count.toString()} onValueChange={(v) => setCount(parseInt(v))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[3, 5, 7, 10].map(n => (
                        <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="summary" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Summary
                </TabsTrigger>
                <TabsTrigger value="quiz" className="gap-2">
                  <Brain className="h-4 w-4" />
                  Quiz
                </TabsTrigger>
                <TabsTrigger value="flashcards" className="gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Flashcards
                </TabsTrigger>
              </TabsList>

              <div className="mb-6">
                <Button 
                  onClick={handleGenerate} 
                  disabled={!isEnabled || isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <motion.div 
                        animate={{ rotate: 360 }} 
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="mr-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </motion.div>
                      Generating...
                    </>
                  ) : (
                    <>
                      Generate {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
                {!isEnabled && (
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Upload and process content first to generate study materials
                  </p>
                )}
              </div>

              <TabsContent value="summary">
                <SummaryView content={summary?.content} />
              </TabsContent>

              <TabsContent value="quiz">
                <QuizView questions={quiz?.questions} />
              </TabsContent>

              <TabsContent value="flashcards">
                <FlashcardsView flashcards={flashcards?.flashcards} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

const SummaryView = ({ content }: { content?: string }) => {
  if (!content) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Generate a summary to see it here</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="prose prose-sm max-w-none dark:prose-invert
        [&_.katex]:text-foreground
        [&_.katex-display]:my-4 [&_.katex-display]:overflow-x-auto"
    >
      <div className="bg-background border rounded-lg p-6">
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {content}
        </ReactMarkdown>
      </div>
    </motion.div>
  );
};

const QuizView = ({ questions }: { questions?: QuizQuestion[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  if (!questions?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Generate a quiz to test your knowledge</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isAnswered = selectedAnswers[currentIndex] !== undefined;
  const isCorrect = selectedAnswers[currentIndex] === currentQuestion.correctIndex;

  const handleSelect = (optionIndex: number) => {
    if (!isAnswered) {
      setSelectedAnswers(prev => ({ ...prev, [currentIndex]: optionIndex }));
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
  };

  if (showResults) {
    const correctCount = Object.entries(selectedAnswers).filter(
      ([idx, ans]) => questions[parseInt(idx)].correctIndex === ans
    ).length;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <div className="text-6xl font-bold text-primary mb-4">
          {correctCount}/{questions.length}
        </div>
        <p className="text-lg text-muted-foreground mb-6">
          {correctCount === questions.length ? "Perfect score! 🎉" : 
           correctCount >= questions.length / 2 ? "Good job! Keep practicing! 💪" : 
           "Keep studying, you'll get better! 📚"}
        </p>
        <Button onClick={handleReset} variant="outline">
          <RotateCcw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      key={currentIndex}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <Badge variant="outline">Question {currentIndex + 1} of {questions.length}</Badge>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div 
              key={i} 
              className={`w-2 h-2 rounded-full ${
                i === currentIndex ? 'bg-primary' : 
                selectedAnswers[i] !== undefined ? 'bg-primary/50' : 'bg-muted'
              }`} 
            />
          ))}
        </div>
      </div>

      <div className="prose prose-sm max-w-none dark:prose-invert
        [&_.katex]:text-foreground
        [&_.katex-display]:my-2">
        <h3 className="text-lg font-medium">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              p: ({ children }) => <span>{children}</span>,
            }}
          >
            {currentQuestion.question}
          </ReactMarkdown>
        </h3>
      </div>

      <div className="space-y-3">
        {currentQuestion.options.map((option, i) => {
          const isSelected = selectedAnswers[currentIndex] === i;
          const isCorrectOption = i === currentQuestion.correctIndex;
          
          return (
            <motion.button
              key={i}
              whileHover={!isAnswered ? { scale: 1.01 } : {}}
              whileTap={!isAnswered ? { scale: 0.99 } : {}}
              onClick={() => handleSelect(i)}
              disabled={isAnswered}
              className={`w-full p-4 rounded-lg border text-left transition-all flex items-center gap-3 ${
                isAnswered 
                  ? isCorrectOption 
                    ? 'border-green-500 bg-green-500/10' 
                    : isSelected 
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-muted opacity-50'
                  : 'border-border hover:border-primary hover:bg-primary/5'
              }`}
            >
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-medium shrink-0 ${
                isAnswered && isCorrectOption ? 'border-green-500 text-green-500' :
                isAnswered && isSelected ? 'border-red-500 text-red-500' :
                'border-muted-foreground'
              }`}>
                {isAnswered && isCorrectOption ? <Check className="h-4 w-4" /> :
                 isAnswered && isSelected ? <X className="h-4 w-4" /> :
                 String.fromCharCode(65 + i)}
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert flex-1
                [&_.katex]:text-foreground
                [&_.katex-display]:my-1">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    p: ({ children }) => <span>{children}</span>,
                  }}
                >
                  {option}
                </ReactMarkdown>
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-500/10' : 'bg-amber-500/10'}`}>
              <p className="font-medium mb-1">{isCorrect ? '✓ Correct!' : '✗ Not quite'}</p>
              <div className="prose prose-sm max-w-none dark:prose-invert text-sm text-muted-foreground
                [&_.katex]:text-muted-foreground
                [&_.katex-display]:my-2">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {currentQuestion.explanation}
                </ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isAnswered && (
        <Button onClick={handleNext} className="w-full">
          {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      )}
    </motion.div>
  );
};

const FlashcardsView = ({ flashcards }: { flashcards?: Flashcard[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);

  if (!flashcards?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Generate flashcards to study with</p>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  const handlePrev = () => {
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : flashcards.length - 1));
  };

  const handleNext = () => {
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex(prev => (prev < flashcards.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Badge variant="outline">Card {currentIndex + 1} of {flashcards.length}</Badge>
        {currentCard.hint && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowHint(!showHint)}
          >
            <Lightbulb className="h-4 w-4 mr-1" />
            {showHint ? 'Hide' : 'Show'} Hint
          </Button>
        )}
      </div>

      <motion.div
        className="relative h-64 cursor-pointer perspective-1000"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
          className="absolute inset-0 w-full h-full"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front */}
          <div 
            className="absolute inset-0 w-full h-full rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-6 flex flex-col items-center justify-center backface-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-sm text-muted-foreground mb-2">Question</p>
            <div className="prose prose-sm max-w-none dark:prose-invert text-center
              [&_.katex]:text-foreground
              [&_.katex-display]:my-2">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  p: ({ children }) => <p className="text-lg font-medium">{children}</p>,
                }}
              >
                {currentCard.front}
              </ReactMarkdown>
            </div>
            <p className="text-xs text-muted-foreground mt-4">Click to flip</p>
          </div>

          {/* Back */}
          <div 
            className="absolute inset-0 w-full h-full rounded-xl border-2 border-green-500/30 bg-gradient-to-br from-green-500/5 to-green-500/10 p-6 flex flex-col items-center justify-center"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-sm text-muted-foreground mb-2">Answer</p>
            <div className="prose prose-sm max-w-none dark:prose-invert text-center
              [&_.katex]:text-foreground
              [&_.katex-display]:my-2">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  p: ({ children }) => <p className="text-lg font-medium">{children}</p>,
                }}
              >
                {currentCard.back}
              </ReactMarkdown>
            </div>
            <p className="text-xs text-muted-foreground mt-4">Click to flip back</p>
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showHint && currentCard.hint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-center p-3 bg-amber-500/10 rounded-lg text-sm"
          >
            💡 Hint: {currentCard.hint}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" onClick={handlePrev}>
          ← Previous
        </Button>
        <Button variant="outline" onClick={handleNext}>
          Next →
        </Button>
      </div>
    </div>
  );
};
