import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Image, X, Loader2, CheckCircle } from "lucide-react";
import { Button } from "./ui/button";

interface ImageUploadProps {
  onImageSelect: (file: File, preview: string) => void;
  onOCRRun: () => void;
  onClearImage?: () => void;
  isProcessing: boolean;
  ocrComplete: boolean;
}

export const ImageUpload = ({ 
  onImageSelect, 
  onOCRRun, 
  onClearImage,
  isProcessing, 
  ocrComplete 
}: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreview(result);
        onImageSelect(file, result);
      };
      reader.readAsDataURL(file);
    }
  }, [onImageSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const clearImage = () => {
    setPreview(null);
    onClearImage?.();
  };

  return (
    <section id="upload-section" className="py-20 px-6">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-chalk text-4xl md:text-5xl text-foreground mb-4">
            Upload Your Blackboard
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Take a photo of your classroom blackboard or handwritten notes. Our AI will extract and index the content.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <AnimatePresence mode="wait">
            {!preview ? (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
                  relative border-2 border-dashed rounded-2xl p-12 md:p-20 text-center
                  transition-all duration-300 cursor-pointer group
                  ${isDragging 
                    ? "border-accent bg-accent/10 scale-[1.02]" 
                    : "border-border hover:border-accent/50 bg-card/50"
                  }
                `}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleInputChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                <div className="flex flex-col items-center gap-4">
                  <div className={`
                    p-4 rounded-full transition-all duration-300
                    ${isDragging ? "bg-accent text-accent-foreground" : "bg-muted text-foreground"}
                  `}>
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-foreground mb-1">
                      Drop your image here
                    </p>
                    <p className="text-sm text-muted-foreground">
                      or click to browse • JPG, PNG supported
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="relative"
              >
                <div className="relative rounded-2xl overflow-hidden bg-card border border-border">
                  <img 
                    src={preview} 
                    alt="Blackboard preview"
                    className="w-full h-auto max-h-[500px] object-contain"
                  />
                  
                  {/* OCR Status Overlay */}
                  <AnimatePresence>
                    {isProcessing && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-10 h-10 text-accent animate-spin" />
                          <p className="text-foreground font-medium">Processing with AI Vision...</p>
                          <p className="text-sm text-muted-foreground">Extracting text and creating knowledge chunks</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Remove Button */}
                  {!isProcessing && (
                    <button
                      onClick={clearImage}
                      className="absolute top-4 right-4 p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/80 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-4 mt-6">
                  <Button
                    onClick={onOCRRun}
                    disabled={isProcessing || ocrComplete}
                    className="px-8 py-3 bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : ocrComplete ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        OCR Complete
                      </>
                    ) : (
                      <>
                        <Image className="w-4 h-4 mr-2" />
                        Run OCR & Index
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};
