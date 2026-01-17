import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, BookOpen, Sparkles, AlertTriangle, ChevronDown, ChevronUp, Zap, Target, FileText, Mic, MicOff, Calendar } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useChat, RetrievalDetail } from "@/hooks/useChat";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { ExportStudyNotes } from "./ExportStudyNotes";

interface ChatInterfaceProps {
  isEnabled: boolean;
  sessionId: string | null;
  sessionIds?: string[];
  onQuestionAsked?: () => void;
  subject?: string;
  chapter?: string;
}

const RetrievalDetailsPanel = ({ details }: { details: RetrievalDetail[] }) => {
  if (!details?.length) return null;
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 space-y-2">
      <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
        <Target className="w-3 h-3" /> Retrieved Chunks ({details.length})
      </div>
      {details.map((detail, idx) => (
        <div key={idx} className="bg-background/50 border border-border/50 rounded-lg p-3 text-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${detail.type === 'concept' ? 'bg-accent/30' : 'bg-primary/30'}`}>{detail.type}</span>
            </div>
            <div className="flex items-center gap-1"><Zap className="w-3 h-3 text-accent" /><span className="font-bold text-accent">{detail.score}%</span></div>
          </div>
          <p className="text-foreground/80 leading-relaxed line-clamp-3">"{detail.text}"</p>
        </div>
      ))}
    </motion.div>
  );
};

// Markdown components for nice formatting with math support
const MarkdownContent = ({ content }: { content: string }) => (
  <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none
    [&_p]:my-2 [&_p]:leading-relaxed
    [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:mt-4 [&_h1]:mb-2
    [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-2
    [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1
    [&_ul]:my-2 [&_ul]:pl-4 [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-1
    [&_ol]:my-2 [&_ol]:pl-4 [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:space-y-1
    [&_li]:my-1
    [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono
    [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-2
    [&_strong]:font-semibold [&_strong]:text-foreground
    [&_blockquote]:border-l-2 [&_blockquote]:border-accent [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-2
    [&_.katex]:text-foreground
    [&_.katex-display]:my-4 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden">
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
    >
      {content}
    </ReactMarkdown>
  </div>
);

export const ChatInterface = ({ isEnabled, sessionId, sessionIds = [], onQuestionAsked, subject, chapter }: ChatInterfaceProps) => {
  const activeSessionIds = sessionIds.length > 0 ? sessionIds : (sessionId ? [sessionId] : []);
  const { messages, isLoading, sendMessage } = useChat(sessionId, activeSessionIds);
  const { isListening, transcript, startListening, stopListening, isSupported } = useSpeechRecognition();
  const [input, setInput] = useState("");
  const [useTodayOnly, setUseTodayOnly] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (transcript) setInput(transcript); }, [transcript]);

  const handleSend = async () => {
    if (!input.trim() || !isEnabled || isLoading) return;
    const question = input.trim();
    setInput("");
    onQuestionAsked?.();
    await sendMessage(question, 'medium', useTodayOnly ? new Date().toISOString().split('T')[0] : undefined);
  };

  const toggleExpanded = (id: string) => setExpandedMessages(prev => { 
    const next = new Set(prev); 
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return next; 
  });

  return (
    <section className="py-20 px-6">
      <div className="container mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8">
          <h2 className="font-chalk text-4xl md:text-5xl text-foreground mb-4">Ask Your Tutor</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">Ask questions about your classroom content. Get help with math, science, and explanations.</p>
        </motion.div>

        {/* Controls - simplified */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
          <button onClick={() => setUseTodayOnly(!useTodayOnly)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${useTodayOnly ? 'bg-accent/20 border-accent text-accent-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}>
            <Calendar className="w-3 h-3" /> Today's lesson only
          </button>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className={`bg-card border border-border rounded-2xl overflow-hidden ${!isEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="h-[450px] overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {!isEnabled && <div className="flex items-center justify-center h-full text-muted-foreground"><BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Upload and process an image to start</p></div>}
            {isEnabled && messages.length === 0 && <div className="flex items-center justify-center h-full text-center"><Sparkles className="w-12 h-12 mx-auto mb-4 text-accent" /><p className="text-foreground font-medium">Ready to help!</p></div>}
            <AnimatePresence>
              {messages.map((m) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "assistant" && <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0"><Bot className="w-4 h-4 text-accent" /></div>}
                  <div className={`max-w-[85%] ${m.role === "user" ? "order-first" : ""}`}>
                    <div className={`rounded-2xl px-4 py-3 ${m.role === "user" ? "bg-accent text-accent-foreground rounded-br-sm" : m.isRefusal ? "bg-destructive/20 border border-destructive/30 rounded-bl-sm" : "bg-muted rounded-bl-sm"}`}>
                      {m.isRefusal && <div className="flex items-center gap-2 mb-2 text-destructive"><AlertTriangle className="w-4 h-4" /><span className="text-xs font-medium">Outside scope</span></div>}
                      {m.role === "user" ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                      ) : (
                        <MarkdownContent content={m.content} />
                      )}
                    </div>
                    {m.sources && m.sources.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{m.sources.map((s, i) => <span key={i} className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-primary/20 rounded-full"><BookOpen className="w-3 h-3" />{s}</span>)}</div>}
                    {m.role === "assistant" && m.retrievalDetails && m.retrievalDetails.length > 0 && (
                      <div className="mt-2">
                        <button onClick={() => toggleExpanded(m.id)} className="flex items-center gap-1 text-xs text-accent hover:text-accent/80"><FileText className="w-3 h-3" />Why this answer?{expandedMessages.has(m.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}</button>
                        <AnimatePresence>{expandedMessages.has(m.id) && <RetrievalDetailsPanel details={m.retrievalDetails} />}</AnimatePresence>
                      </div>
                    )}
                  </div>
                  {m.role === "user" && <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0"><User className="w-4 h-4" /></div>}
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3"><div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center"><Bot className="w-4 h-4 text-accent" /></div><div className="bg-muted rounded-2xl px-4 py-3"><div className="flex gap-1">{[0, 150, 300].map(d => <span key={d} className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</div></div></motion.div>}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t border-border p-4">
            <div className="flex gap-3">
              {isSupported && (
                <Button onClick={isListening ? stopListening : startListening} variant={isListening ? "destructive" : "outline"} size="icon" className="shrink-0">
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
              )}
              <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === "Enter" && handleSend()} placeholder={isListening ? "Listening..." : "Ask a question..."} disabled={!isEnabled || isLoading} className="flex-1 bg-muted border-0" />
              <Button onClick={handleSend} disabled={!isEnabled || !input.trim() || isLoading} className="bg-accent text-accent-foreground hover:bg-accent/90"><Send className="w-4 h-4" /></Button>
            </div>
          </div>
        </motion.div>
        <ExportStudyNotes messages={messages} subject={subject} chapter={chapter} isVisible={messages.length > 0} />
      </div>
    </section>
  );
};