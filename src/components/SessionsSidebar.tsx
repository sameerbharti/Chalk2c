import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Image, Calendar, BookOpen, Trash2, X, AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";
import { SessionInfo } from "@/hooks/useOCR";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface SessionsSidebarProps {
  sessions: SessionInfo[];
  currentSessionId: string | null;
  onAddMore: () => void;
  onSelectSession?: (sessionId: string) => void;
  onSessionDeleted?: () => void;
}

export const SessionsSidebar = ({ 
  sessions, 
  currentSessionId,
  onAddMore,
  onSelectSession,
  onSessionDeleted
}: SessionsSidebarProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(sessionId);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    
    setDeletingId(confirmDeleteId);
    try {
      const { data, error } = await supabase.functions.invoke('delete-session', {
        body: { sessionId: confirmDeleteId }
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Session deleted",
        description: `"${data.deleted?.chapter || 'Session'}" has been removed.`,
      });

      onSessionDeleted?.();
    } catch (err) {
      console.error("Delete error:", err);
      toast({
        title: "Failed to delete",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  if (sessions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-card border border-border rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-accent" />
          Knowledge Base
        </h4>
        <Button
          size="sm"
          variant="ghost"
          onClick={onAddMore}
          className="h-8 w-8 p-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmDeleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-6 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-destructive/10 rounded-full">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Delete Session?</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                This will permanently delete this session and all associated chat history, 
                flashcards, and study materials. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setConfirmDeleteId(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={confirmDelete}
                  disabled={deletingId === confirmDeleteId}
                >
                  {deletingId === confirmDeleteId ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`relative group w-full text-left p-3 rounded-lg transition-colors ${
              session.id === currentSessionId 
                ? 'bg-accent/20 border border-accent/30' 
                : 'bg-muted/30 hover:bg-muted/50'
            }`}
          >
            <button
              onClick={() => onSelectSession?.(session.id)}
              className="w-full text-left"
            >
              <div className="flex items-start gap-2">
                <Image className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex-1 min-w-0 pr-6">
                  <p className="text-sm font-medium text-foreground truncate">
                    {session.chapter}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session.subject}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {session.date}
                    </span>
                    <span className="text-[10px] text-accent">
                      {session.chunksCount} chunks
                    </span>
                  </div>
                </div>
              </div>
            </button>
            
            {/* Delete button */}
            <button
              onClick={(e) => handleDelete(session.id, e)}
              className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/10 hover:bg-destructive/20 text-destructive"
              title="Delete session"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          {sessions.length} session{sessions.length !== 1 ? 's' : ''} • {' '}
          {sessions.reduce((sum, s) => sum + s.chunksCount, 0)} total chunks
        </p>
      </div>
    </motion.div>
  );
};
