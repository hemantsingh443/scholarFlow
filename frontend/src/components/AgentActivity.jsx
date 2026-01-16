import { useMemo, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Wifi, 
  CheckCircle, 
  Play, 
  Map, 
  Search, 
  FileText, 
  Edit3, 
  AlertCircle,
  Clock,
  BookOpen
} from 'lucide-react';

/**
 * Action icons for different activity types.
 */
const ActionIcons = {
  connecting: <Wifi className="w-5 h-5" />,
  connected: <CheckCircle className="w-5 h-5" />,
  started: <Play className="w-5 h-5" />,
  planning: <Map className="w-5 h-5" />,
  researching: <Search className="w-5 h-5" />,
  paper_done: <FileText className="w-5 h-5" />,
  writing: <Edit3 className="w-5 h-5" />,
  completed: <CheckCircle className="w-5 h-5" />,
  error: <AlertCircle className="w-5 h-5" />,
};

/**
 * AgentActivity - Single panel showing agent work in progress
 */
export default function AgentActivity({ session, activities = [], isLoading }) {
  const { plan = [], current_task_index = 0, status, documents = [], report } = session || {};
  
  // Ref for auto-scrolling activity log
  const activityEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Auto-scroll to bottom of activity log when new activities arrive
  useEffect(() => {
    if (scrollContainerRef.current) {
      const { scrollHeight, clientHeight } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth'
      });
    }
  }, [activities.length]); // Depend on length to trigger on new items

  // Current agent info
  const agentInfo = useMemo(() => {
    if (status === 'completed') return { name: 'Writer Agent', action: 'Report Complete' };
    if (status === 'writing') return { name: 'Writer Agent', action: 'Synthesizing Report' };
    if (status === 'researching') return { name: 'Researcher Agent', action: `Question ${current_task_index + 1}/${plan.length}` };
    if (status === 'planning') return { name: 'Planner Agent', action: 'Creating Research Plan' };
    return { name: 'Initializing', action: 'Connecting...' };
  }, [status, current_task_index, plan.length]);

  // Show report if complete
  if (status === 'completed' && report) {
    return (
      <div className="card-elevated rounded-lg overflow-hidden reveal-up">
        {/* Header */}
        <div 
          className="px-6 py-4 flex items-center gap-3"
          style={{ 
            background: 'var(--cream-100)',
            borderBottom: '1px solid var(--border-subtle)'
          }}
        >
          <span style={{ color: 'var(--status-active)' }}>
            {ActionIcons.completed}
          </span>
          <div>
            <h2 className="font-display text-lg" style={{ color: 'var(--navy-800)' }}>
              Research Complete
            </h2>
            <p className="text-sm font-serif" style={{ color: 'var(--text-muted)' }}>
              {documents.length} papers analyzed
            </p>
          </div>
        </div>

        {/* Report */}
        <div className="px-6 py-6">
          <article className="prose-editorial max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
          </article>
        </div>

        {/* Sources */}
        {documents.length > 0 && (
          <div 
            className="px-6 py-4"
            style={{ 
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--cream-100)'
            }}
          >
            <h3 
              className="text-xs font-mono uppercase tracking-wider mb-3"
              style={{ color: 'var(--text-muted)' }}
            >
              Sources
            </h3>
            <div className="space-y-2">
              {documents.map((doc, idx) => (
                <a
                  key={idx}
                  href={doc.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2 rounded text-sm font-serif transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <span className="mr-2">📄</span> {doc.title || doc.arxiv_id}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Active research view
  return (
    <div className="card-elevated rounded-lg overflow-hidden">
      {/* Current Agent Header */}
      <div 
        className="px-6 py-5 flex items-center gap-4"
        style={{ 
          // Always dark gradient for consistency/branding, even in light mode
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
          color: '#F8FAFC' // Always light text
        }}
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center" 
             style={{ background: 'rgba(255,255,255,0.1)' }}>
          {ActionIcons[status] || ActionIcons.started}
        </div>
        <div className="flex-1">
          <h2 className="font-display text-xl">{agentInfo.name}</h2>
          <p className="text-sm opacity-80 font-serif">{agentInfo.action}</p>
        </div>
        {isLoading && (
          <div className="reading-dots flex gap-1">
            <span className="w-2 h-2 rounded-full bg-white opacity-80" />
            <span className="w-2 h-2 rounded-full bg-white opacity-80" />
            <span className="w-2 h-2 rounded-full bg-white opacity-80" />
          </div>
        )}
      </div>

      {/* Research Plan Progress */}
      {plan.length > 0 && (
        <div className="px-6 py-4" style={{ 
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--cream-50)' // Ensure bg matches theme
        }}>
          <div className="flex items-center justify-between mb-3">
            <span 
              className="text-xs font-mono uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Research Plan
            </span>
            <span 
              className="text-xs font-mono"
              style={{ color: 'var(--text-muted)' }}
            >
              {Math.min(current_task_index + 1, plan.length)}/{plan.length}
            </span>
          </div>
          
          {/* Progress bar with ingraining effect */}
          <div 
            className="h-2 rounded-full mb-4 overflow-hidden"
            style={{ background: 'var(--cream-200)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)' }}
          >
             {/* Progress Fill */}
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${((current_task_index + 1) / plan.length) * 100}%`,
                background: 'var(--status-active)'
              }}
            />
          </div>

          {/* Current question */}
          {plan[current_task_index] && (
            <div 
              className="p-3 rounded-lg"
              style={{ 
                background: 'var(--cream-100)',
                borderLeft: '3px solid var(--amber-400)'
              }}
            >
              <p className="text-sm font-serif" style={{ color: 'var(--text-primary)' }}>
                {plan[current_task_index]}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Activity Log */}
      <div className="px-6 py-4" style={{ background: 'var(--cream-50)' }}>
        <h3 
          className="text-xs font-mono uppercase tracking-wider mb-3"
          style={{ color: 'var(--text-muted)' }}
        >
          Activity
        </h3>
        {/* ingrained scroll container */}
        <div 
          ref={scrollContainerRef}
          className="space-y-2 max-h-64 overflow-y-auto pr-4 custom-scrollbar"
          style={{
             scrollBehavior: 'smooth' 
          }}
        >
          {activities.length === 0 ? (
            <p className="text-sm font-serif italic" style={{ color: 'var(--text-muted)' }}>
              Waiting for agent...
            </p>
          ) : (
            activities.map((activity, idx) => (
              <div 
                key={`${activity.timestamp}-${idx}`}
                className="flex items-start gap-3 py-2 reveal-up"
                style={{ 
                  animationDelay: `${idx * 30}ms`,
                  borderBottom: idx < activities.length - 1 ? '1px solid var(--border-subtle)' : 'none'
                }}
              >
                <div style={{ color: 'var(--amber-500)', flexShrink: 0, marginTop: '2px' }}>
                  {ActionIcons[activity.action] || ActionIcons.started}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-serif" style={{ color: 'var(--text-primary)' }}>
                    {activity.message}
                  </p>
                  {activity.detail && (
                    <p 
                      className="text-xs font-serif mt-0.5 truncate"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {activity.detail}
                    </p>
                  )}
                </div>
                <span 
                  className="text-xs font-mono flex-shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {new Date(activity.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </span>
                {/* Anchor for layout stability */}
              </div>
            ))
          )}
          {/* Invisible element to scroll to */}
          <div ref={activityEndRef} />
        </div>
      </div>

      {/* Papers Found */}
      {documents.length > 0 && (
        <div 
          className="px-6 py-4"
          style={{ 
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--cream-100)'
          }}
        >
          <h3 
            className="text-xs font-mono uppercase tracking-wider mb-2"
            style={{ color: 'var(--text-muted)' }}
          >
            Papers Found · {documents.length}
          </h3>
          <div className="flex flex-wrap gap-2">
            {documents.map((doc, idx) => (
              <span 
                key={idx}
                className="px-2 py-1 rounded text-xs font-mono"
                style={{ 
                  background: 'var(--cream-50)', 
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {doc.arxiv_id}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
