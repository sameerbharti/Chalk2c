import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Image, Check, ChevronLeft, ChevronRight, Edit3, Save } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";

interface FileResult {
  fileId: string;
  text: string;
  subject: string;
  chapter: string;
  type: 'image' | 'pdf';
  fileName?: string;
}

interface MultiFilePreviewProps {
  results: FileResult[];
  onConfirmAll: (edits: Map<string, { text: string; subject: string; chapter: string }>) => void;
  isProcessing: boolean;
}

export const MultiFilePreview = ({
  results,
  onConfirmAll,
  isProcessing
}: MultiFilePreviewProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [edits, setEdits] = useState<Map<string, { text: string; subject: string; chapter: string }>>(
    new Map(results.map(r => [r.fileId, { text: r.text, subject: r.subject, chapter: r.chapter }]))
  );
  const [isEditing, setIsEditing] = useState(false);

  if (results.length === 0) return null;

  const current = results[currentIndex];
  const currentEdit = edits.get(current.fileId) || { text: current.text, subject: current.subject, chapter: current.chapter };

  const updateEdit = (field: 'text' | 'subject' | 'chapter', value: string) => {
    setEdits(prev => {
      const newEdits = new Map(prev);
      const existing = newEdits.get(current.fileId) || { text: current.text, subject: current.subject, chapter: current.chapter };
      newEdits.set(current.fileId, { ...existing, [field]: value });
      return newEdits;
    });
  };

  const goNext = () => {
    if (currentIndex < results.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsEditing(false);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsEditing(false);
    }
  };

  return (
    <section className="py-12 px-6">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {current.type === 'pdf' ? (
                  <FileText className="w-5 h-5 text-accent" />
                ) : (
                  <Image className="w-5 h-5 text-accent" />
                )}
                <div>
                  <h3 className="font-medium text-foreground">
                    {current.fileName || `Document ${currentIndex + 1}`}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {current.type.toUpperCase()} • Review extracted content
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goPrev}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  {currentIndex + 1} / {results.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goNext}
                  disabled={currentIndex === results.length - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-xs">Subject</Label>
                {isEditing ? (
                  <Input
                    value={currentEdit.subject}
                    onChange={(e) => updateEdit('subject', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-foreground font-medium">{currentEdit.subject}</p>
                )}
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Chapter/Topic</Label>
                {isEditing ? (
                  <Input
                    value={currentEdit.chapter}
                    onChange={(e) => updateEdit('chapter', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-foreground font-medium">{currentEdit.chapter}</p>
                )}
              </div>
            </div>

            {/* Extracted Text */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-muted-foreground text-xs">Extracted Content</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? (
                    <>
                      <Save className="w-3 h-3 mr-1" />
                      Done
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-3 h-3 mr-1" />
                      Edit
                    </>
                  )}
                </Button>
              </div>
              
              {isEditing ? (
                <Textarea
                  value={currentEdit.text}
                  onChange={(e) => updateEdit('text', e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                />
              ) : (
                <div className="bg-muted/30 rounded-lg p-4 max-h-[300px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-foreground font-mono">
                    {currentEdit.text}
                  </pre>
                </div>
              )}
            </div>

            {/* Progress Dots */}
            {results.length > 1 && (
              <div className="flex justify-center gap-2 pt-2">
                {results.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setCurrentIndex(idx); setIsEditing(false); }}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === currentIndex ? 'bg-accent' : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {results.length} document{results.length !== 1 ? 's' : ''} ready to index
              </p>
              <Button
                onClick={() => onConfirmAll(edits)}
                disabled={isProcessing}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {isProcessing ? (
                  "Indexing..."
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Confirm & Index All
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
