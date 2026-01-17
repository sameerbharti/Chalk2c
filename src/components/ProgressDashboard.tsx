import { motion } from "framer-motion";
import { BookOpen, MessageSquare, Brain, Calendar, TrendingUp, Award } from "lucide-react";
import { SessionInfo } from "@/hooks/useOCR";

interface ProgressDashboardProps {
  sessions: SessionInfo[];
  totalQuestions: number;
  topicsLearned: string[];
}

export const ProgressDashboard = ({ 
  sessions, 
  totalQuestions, 
  topicsLearned 
}: ProgressDashboardProps) => {
  const totalChunks = sessions.reduce((sum, s) => sum + s.chunksCount, 0);
  const subjects = [...new Set(sessions.map(s => s.subject))];

  if (sessions.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-8 px-6"
    >
      <div className="container mx-auto max-w-4xl">
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-accent/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground">Learning Progress</h3>
              <p className="text-sm text-muted-foreground">Your classroom knowledge at a glance</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={<BookOpen className="w-5 h-5" />}
              label="Sessions"
              value={sessions.length}
              color="text-blue-400"
            />
            <StatCard
              icon={<Brain className="w-5 h-5" />}
              label="Knowledge Chunks"
              value={totalChunks}
              color="text-purple-400"
            />
            <StatCard
              icon={<MessageSquare className="w-5 h-5" />}
              label="Questions Asked"
              value={totalQuestions}
              color="text-green-400"
            />
            <StatCard
              icon={<Award className="w-5 h-5" />}
              label="Subjects"
              value={subjects.length}
              color="text-orange-400"
            />
          </div>

          {/* Recent Sessions */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" />
              Recent Sessions
            </h4>
            <div className="space-y-2">
              {sessions.slice(0, 5).map((session, i) => (
                <div 
                  key={session.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs text-accent font-medium">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{session.subject}: {session.chapter}</p>
                      <p className="text-xs text-muted-foreground">{session.date}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {session.chunksCount} chunks
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Topics Learned */}
          {topicsLearned.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-foreground mb-3">Topics Covered</h4>
              <div className="flex flex-wrap gap-2">
                {topicsLearned.map((topic, i) => (
                  <span 
                    key={i}
                    className="px-3 py-1 bg-primary/20 text-foreground text-xs rounded-full"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
};

const StatCard = ({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number; 
  color: string;
}) => (
  <div className="bg-muted/30 rounded-xl p-4 text-center">
    <div className={`${color} flex justify-center mb-2`}>{icon}</div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);
