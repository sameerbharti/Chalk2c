import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, CheckCircle, Lightbulb, BookOpen, GraduationCap, Edit3, Save, X } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";

interface OCRPreviewProps {
  extractedText: string;
  confidence: number;
  isVisible: boolean;
  subject?: string;
  chapter?: string;
  keyConcepts?: string[];
  isEditable?: boolean;
  onConfirmIndex?: (text: string, subject: string, chapter: string) => void;
  isProcessing?: boolean;
}

export const OCRPreview = ({ 
  extractedText, 
  confidence, 
  isVisible,
  subject = "General",
  chapter = "Lesson",
  keyConcepts = [],
  isEditable = false,
  onConfirmIndex,
  isProcessing = false
}: OCRPreviewProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(extractedText);
  const [editedSubject, setEditedSubject] = useState(subject);
  const [editedChapter, setEditedChapter] = useState(chapter);

  useEffect(() => {
    setEditedText(extractedText);
    setEditedSubject(subject);
    setEditedChapter(chapter);
  }, [extractedText, subject, chapter]);

  if (!isVisible) return null;

  const getConfidenceColor = (conf: number) => {
    if (conf >= 80) return "text-green-400";
    if (conf >= 60) return "text-yellow-400";
    return "text-orange-400";
  };

  const getConfidenceLabel = (conf: number) => {
    if (conf >= 80) return "High Confidence";
    if (conf >= 60) return "Medium Confidence";
    return "Low Confidence";
  };

  const handleConfirm = () => {
    onConfirmIndex?.(editedText, editedSubject, editedChapter);
    setIsEditing(false);
  };

  return (
    <AnimatePresence>
      <motion.section
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.5 }}
        className="py-12 px-6"
      >
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary/20 px-6 py-4 border-b border-border">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/20 rounded-lg">
                    <FileText className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-foreground">
                      {isEditable ? "Review & Edit Content" : "Extracted Content"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isEditable ? "Correct any OCR mistakes before indexing" : "AI-powered text extraction complete"}
                    </p>
                  </div>
                </div>
                
                {/* Confidence Meter */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${getConfidenceColor(confidence)}`}>
                      {confidence}%
                    </p>
                    <p className="text-xs text-muted-foreground">{getConfidenceLabel(confidence)}</p>
                  </div>
                  <div className="w-16 h-16 relative">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${confidence * 0.88} 88`} className={getConfidenceColor(confidence)} />
                    </svg>
                    <CheckCircle className={`absolute inset-0 m-auto w-6 h-6 ${getConfidenceColor(confidence)}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Editable Metadata */}
            {isEditable && (
              <div className="px-6 py-4 bg-muted/30 border-b border-border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" /> Subject
                    </label>
                    <Input
                      value={editedSubject}
                      onChange={(e) => setEditedSubject(e.target.value)}
                      className="bg-background"
                      placeholder="e.g., Physics, Math, Chemistry"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" /> Chapter/Topic
                    </label>
                    <Input
                      value={editedChapter}
                      onChange={(e) => setEditedChapter(e.target.value)}
                      className="bg-background"
                      placeholder="e.g., Newton's Laws, Quadratic Equations"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Non-editable Metadata */}
            {!isEditable && (subject || chapter) && (
              <div className="px-6 py-3 bg-muted/30 border-b border-border flex flex-wrap gap-4">
                {subject && (
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="w-4 h-4 text-accent" />
                    <span className="text-muted-foreground">Subject:</span>
                    <span className="font-medium text-foreground">{subject}</span>
                  </div>
                )}
                {chapter && (
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="w-4 h-4 text-accent" />
                    <span className="text-muted-foreground">Topic:</span>
                    <span className="font-medium text-foreground">{chapter}</span>
                  </div>
                )}
              </div>
            )}

            {/* Key Concepts */}
            {keyConcepts && keyConcepts.length > 0 && (
              <div className="px-6 py-3 bg-accent/5 border-b border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium text-foreground">Key Concepts Detected:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {keyConcepts.map((concept, i) => (
                    <span key={i} className="px-3 py-1 bg-accent/20 text-accent-foreground text-xs rounded-full">
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Extracted/Editable Text */}
            <div className="p-6">
              {isEditable ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Edit3 className="w-4 h-4" /> Edit extracted text below
                    </span>
                  </div>
                  <Textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="min-h-[250px] font-mono text-sm bg-background"
                    placeholder="Edit the OCR extracted text..."
                  />
                </div>
              ) : (
                <pre className="font-mono text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto custom-scrollbar">
                  {extractedText}
                </pre>
              )}
            </div>

            {/* Action Footer */}
            <div className="px-6 py-4 bg-muted/30 border-t border-border">
              {isEditable ? (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Review the text carefully. Click "Confirm & Index" to add to knowledge base.
                  </p>
                  <Button
                    onClick={handleConfirm}
                    disabled={isProcessing || !editedText.trim()}
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    {isProcessing ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Confirm & Index
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center">
                  ✅ Content indexed and ready for Q&A • Ask questions about this material below
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </motion.section>
    </AnimatePresence>
  );
};
