import { useState, useEffect } from "react";
import { HeroSection } from "@/components/HeroSection";
import { MultiFileUpload, UploadedFile } from "@/components/MultiFileUpload";
import { MultiFilePreview } from "@/components/MultiFilePreview";
import { ChatInterface } from "@/components/ChatInterface";
import { StudyMaterials } from "@/components/StudyMaterials";
import { Footer } from "@/components/Footer";
import { ProgressDashboard } from "@/components/ProgressDashboard";
import { SessionsSidebar } from "@/components/SessionsSidebar";
import { SetupWarning } from "@/components/SetupWarning";
import { useMultiFileOCR } from "@/hooks/useMultiFileOCR";

const Index = () => {
  const [isIndexed, setIsIndexed] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(0);
  
  const { 
    processAllFiles,
    confirmAndIndexAll,
    isProcessing, 
    processedCount,
    files,
    setFiles,
    pendingResults,
    sessions,
    loadSessions,
    reset,
    getAllSessionIds,
    getCombinedMetadata
  } = useMultiFileOCR();

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleFilesChange = (newFiles: UploadedFile[]) => {
    setFiles(newFiles);
    if (newFiles.length === 0) {
      setIsIndexed(false);
      reset();
    }
  };

  const handleProcessAll = async () => {
    await processAllFiles(files);
  };

  const handleConfirmIndexAll = async (edits: Map<string, { text: string; subject: string; chapter: string }>) => {
    const success = await confirmAndIndexAll(edits);
    if (success) setIsIndexed(true);
  };

  const handleAddMore = () => {
    document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const topicsLearned = [...new Set(sessions.map(s => s.chapter))];

  // Convert pending results to array for preview
  const previewResults = Array.from(pendingResults.entries()).map(([fileId, data]) => ({
    fileId,
    ...data,
    type: files.find(f => f.id === fileId)?.type || 'image' as const,
    fileName: files.find(f => f.id === fileId)?.file.name
  }));

  const metadata = getCombinedMetadata();

  return (
    <main className="min-h-screen bg-background">
      <SetupWarning />
      <HeroSection />
      
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar - Sessions */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <SessionsSidebar 
              sessions={sessions}
              currentSessionId={null}
              onAddMore={handleAddMore}
              onSessionDeleted={loadSessions}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <ProgressDashboard 
              sessions={sessions}
              totalQuestions={totalQuestions}
              topicsLearned={topicsLearned}
            />
          </div>
        </div>
      </div>
      
      <MultiFileUpload 
        onFilesChange={handleFilesChange}
        onProcessAll={handleProcessAll}
        isProcessing={isProcessing}
        processedCount={processedCount}
        totalCount={files.length}
      />

      {previewResults.length > 0 && !isIndexed && (
        <MultiFilePreview
          results={previewResults}
          onConfirmAll={handleConfirmIndexAll}
          isProcessing={isProcessing}
        />
      )}
      
      <ChatInterface 
        isEnabled={isIndexed || sessions.length > 0} 
        sessionId={null}
        sessionIds={getAllSessionIds()}
        onQuestionAsked={() => setTotalQuestions(prev => prev + 1)}
        subject={metadata.subject}
        chapter={metadata.chapter}
      />

      <StudyMaterials 
        sessionIds={getAllSessionIds()}
        isEnabled={isIndexed || sessions.length > 0}
      />
      
      <Footer />
    </main>
  );
};

export default Index;
