import { useMemo } from 'react';
import { 
  Search, 
  FileText, 
  Download, 
  BookOpen, 
  Edit3, 
  Database, 
  CheckCircle, 
  Play, 
  AlertCircle,
  Loader2 
} from 'lucide-react';

/**
 * Action icons for different activity types.
 */
const ActionIcons = {
  searching: <Search className="w-4 h-4" />,
  found_papers: <FileText className="w-4 h-4" />,
  downloading: <Download className="w-4 h-4" />,
  reading: <BookOpen className="w-4 h-4" />,
  summarizing: <Edit3 className="w-4 h-4" />,
  storing: <Database className="w-4 h-4" />,
  paper_done: <CheckCircle className="w-4 h-4" />,
  question_start: <Play className="w-4 h-4" />,
  started: <Play className="w-4 h-4" />,
  error: <AlertCircle className="w-4 h-4" />,
};

/**
 * ThoughtProcess - Editorial styled research progress sidebar
 */
export default function ThoughtProcess({ session, activities = [] }) {
  if (!session) return null;

  const { plan = [], current_task_index = 0, status, documents = [] } = session;
  const currentIndex = session.current_data?.current_task_index ?? current_task_index;

  // Status display
  const statusDisplay = useMemo(() => {
    const statuses = {
      planning: { label: 'Planning Research', color: 'var(--amber-500)', icon: <Loader2 className="w-4 h-4 animate-spin"/> },
      researching: { label: 'Investigating', color: 'var(--status-active)', icon: <Search className="w-4 h-4"/> },
      reading: { label: 'Reading Papers', color: 'var(--status-active)', icon: <BookOpen className="w-4 h-4"/> },
      writing: { label: 'Writing Report', color: 'var(--amber-500)', icon: <Edit3 className="w-4 h-4"/> },
      completed: { label: 'Complete', color: 'var(--status-active)', icon: <CheckCircle className="w-4 h-4"/> },
      error: { label: 'Error', color: 'var(--status-error)', icon: <AlertCircle className="w-4 h-4"/> },
    };
    return statuses[status] || statuses.planning;
  }, [status]);

  return (
    <div className="card-paper rounded-lg p-6 reveal-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-medium" style={{ color: 'var(--navy-800)' }}>
          Research Plan
        </h2>
        <div 
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-serif transition-colors"
          style={{ 
            background: `${statusDisplay.color}15`, // Low opacity background
            color: statusDisplay.color 
          }}
        >
          {status === 'completed' || status === 'error' ? (
             statusDisplay.icon
          ) : (
            <span 
              className="w-2 h-2 rounded-full pulse-dot"
              style={{ background: statusDisplay.color }}
            />
          )}
          {statusDisplay.label}
        </div>
      </div>

      {/* Decorative line */}
      <div className="ornament-line mb-6" />

      {/* Plan Items */}
      <div className="space-y-0 relative mb-8">
        {/* Connector Line */}
        <div 
          className="absolute left-[1.65rem] top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-[var(--border-medium)] to-transparent"
        />

        {plan.length === 0 ? (
          <div className="flex items-center gap-3 p-4 rounded-lg" style={{ background: 'var(--cream-200)' }}>
            <div className="reading-dots flex gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: 'var(--amber-400)' }} />
              <span className="w-2 h-2 rounded-full" style={{ background: 'var(--amber-400)' }} />
              <span className="w-2 h-2 rounded-full" style={{ background: 'var(--amber-400)' }} />
            </div>
            <span className="font-serif text-sm" style={{ color: 'var(--text-secondary)' }}>
              Generating research plan...
            </span>
          </div>
        ) : (
          plan.map((item, idx) => {
            const isComplete = idx < currentIndex;
            const isCurrent = idx === currentIndex && status !== 'completed';
            
            return (
              <div
                key={idx}
                className={`
                  relative flex items-start gap-4 p-3 rounded-lg transition-all duration-300
                  reveal-up group
                `}
                style={{ 
                  animationDelay: `${idx * 100}ms`,
                  background: isCurrent ? 'var(--cream-200)' : 'transparent',
                }}
              >
                {/* Number indicator */}
                <div 
                  className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono border-2 transition-colors"
                  style={{
                    background: isComplete || isCurrent ? 'var(--cream-50)' : 'var(--cream-100)',
                    borderColor: isComplete 
                      ? 'var(--status-active)' 
                      : isCurrent 
                      ? 'var(--amber-400)' 
                      : 'var(--border-medium)',
                    color: isComplete 
                      ? 'var(--status-active)' 
                      : isCurrent 
                      ? 'var(--amber-400)' 
                      : 'var(--text-muted)'
                  }}
                >
                  {isComplete ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                </div>

                {/* Question text */}
                <p 
                  className="flex-1 font-serif text-sm leading-relaxed pt-1"
                  style={{ 
                    color: isComplete ? 'var(--text-muted)' : isCurrent ? 'var(--navy-800)' : 'var(--text-secondary)',
                    fontWeight: isCurrent ? 600 : 400
                  }}
                >
                  {item}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Live Activity Feed */}
      {activities.length > 0 && (
        <div className="pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <h3 
            className="text-xs font-mono uppercase tracking-wider mb-3 flex items-center gap-2"
            style={{ color: 'var(--text-muted)' }}
          >
            <Loader2 className="w-3 h-3 animate-spin"/>
            Live Activity
          </h3>
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {activities.slice(-8).reverse().map((activity, idx) => (
              <div 
                key={`${activity.timestamp}-${idx}`}
                className="flex items-start gap-3 reveal-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <span 
                  className="mt-0.5 p-1 rounded-md"
                  style={{ 
                    color: 'var(--amber-500)',
                    background: 'var(--cream-200)' 
                  }}
                >
                  {ActionIcons[activity.action] || ActionIcons.started}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-serif font-medium" style={{ color: 'var(--text-primary)' }}>
                    {activity.message}
                  </p>
                  {activity.detail && (
                    <p 
                      className="text-xs font-serif truncate mt-0.5"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {activity.detail}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
