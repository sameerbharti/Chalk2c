import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Image, FileText, X, Loader2, CheckCircle, Plus } from "lucide-react";
import { Button } from "./ui/button";

export interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'pdf';
  status: 'pending' | 'processing' | 'complete' | 'error';
  error?: string;
}

interface MultiFileUploadProps {
  onFilesChange: (files: UploadedFile[]) => void;
  onProcessAll: () => void;
  isProcessing: boolean;
  processedCount: number;
  totalCount: number;
}

export const MultiFileUpload = ({ 
  onFilesChange, 
  onProcessAll,
  isProcessing, 
  processedCount,
  totalCount
}: MultiFileUploadProps) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const validFiles: UploadedFile[] = [];
    
    Array.from(newFiles).forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const isPDF = file.type === "application/pdf";
      
      if (isImage || isPDF) {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        if (isImage) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const uploadedFile: UploadedFile = {
              id,
              file,
              preview: e.target?.result as string,
              type: 'image',
              status: 'pending'
            };
            setFiles(prev => {
              const updated = [...prev, uploadedFile];
              onFilesChange(updated);
              return updated;
            });
          };
          reader.readAsDataURL(file);
        } else {
          // PDF - use a placeholder preview
          const uploadedFile: UploadedFile = {
            id,
            file,
            preview: '',
            type: 'pdf',
            status: 'pending'
          };
          validFiles.push(uploadedFile);
        }
      }
    });

    if (validFiles.length > 0) {
      setFiles(prev => {
        const updated = [...prev, ...validFiles];
        onFilesChange(updated);
        return updated;
      });
    }
  }, [onFilesChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
  }, [handleFiles]);

  const removeFile = (id: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== id);
      onFilesChange(updated);
      return updated;
    });
  };

  const clearAll = () => {
    setFiles([]);
    onFilesChange([]);
  };

  const allComplete = files.length > 0 && files.every(f => f.status === 'complete');
  const hasFiles = files.length > 0;

  return (
    <section id="upload-section" className="py-20 px-6">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-chalk text-4xl md:text-5xl text-foreground mb-4">
            Upload Your Content
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Upload blackboard photos, handwritten notes, or PDF documents. Our AI will extract and index all content.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Dropzone */}
          <motion.div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              relative border-2 border-dashed rounded-2xl p-8 md:p-12 text-center
              transition-all duration-300 cursor-pointer group mb-6
              ${isDragging 
                ? "border-accent bg-accent/10 scale-[1.02]" 
                : "border-border hover:border-accent/50 bg-card/50"
              }
            `}
          >
            <input
              type="file"
              accept="image/*,.pdf,application/pdf"
              multiple
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
                  Drop your files here
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse • Images (JPG, PNG) and PDFs supported
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  You can upload multiple files at once
                </p>
              </div>
            </div>
          </motion.div>

          {/* File Grid */}
          <AnimatePresence>
            {hasFiles && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {files.length} file{files.length !== 1 ? 's' : ''} selected
                  </p>
                  {!isProcessing && (
                    <Button variant="ghost" size="sm" onClick={clearAll}>
                      Clear All
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {files.map((uploadedFile) => (
                    <motion.div
                      key={uploadedFile.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative group rounded-xl overflow-hidden bg-card border border-border aspect-square"
                    >
                      {uploadedFile.type === 'image' ? (
                        <img 
                          src={uploadedFile.preview}
                          alt="Upload preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-muted/50 p-4">
                          <FileText className="w-12 h-12 text-accent mb-2" />
                          <p className="text-xs text-muted-foreground text-center truncate w-full">
                            {uploadedFile.file.name}
                          </p>
                        </div>
                      )}

                      {/* Status Overlay */}
                      {uploadedFile.status === 'processing' && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-accent animate-spin" />
                        </div>
                      )}

                      {uploadedFile.status === 'complete' && (
                        <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                          <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                      )}

                      {uploadedFile.status === 'error' && (
                        <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
                          <p className="text-xs text-destructive px-2 text-center">
                            {uploadedFile.error || 'Error'}
                          </p>
                        </div>
                      )}

                      {/* Remove Button */}
                      {!isProcessing && uploadedFile.status !== 'processing' && (
                        <button
                          onClick={() => removeFile(uploadedFile.id)}
                          className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}

                      {/* Type Badge */}
                      <div className="absolute bottom-2 left-2">
                        <span className={`
                          px-2 py-0.5 text-[10px] font-medium rounded-full
                          ${uploadedFile.type === 'pdf' 
                            ? 'bg-accent text-accent-foreground' 
                            : 'bg-muted text-muted-foreground'
                          }
                        `}>
                          {uploadedFile.type.toUpperCase()}
                        </span>
                      </div>
                    </motion.div>
                  ))}

                  {/* Add More Button */}
                  {!isProcessing && (
                    <motion.label
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="relative rounded-xl border-2 border-dashed border-border hover:border-accent/50 aspect-square flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <input
                        type="file"
                        accept="image/*,.pdf,application/pdf"
                        multiple
                        onChange={handleInputChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Plus className="w-8 h-8 text-muted-foreground" />
                    </motion.label>
                  )}
                </div>

                {/* Process Button */}
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={onProcessAll}
                    disabled={isProcessing || allComplete || files.length === 0}
                    size="lg"
                    className="px-8 py-3 bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing {processedCount}/{totalCount}...
                      </>
                    ) : allComplete ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        All Processed
                      </>
                    ) : (
                      <>
                        <Image className="w-4 h-4 mr-2" />
                        Process {files.length} File{files.length !== 1 ? 's' : ''}
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
