import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Action icons for different activity types.
 */
const ActionIcons = {
  connecting: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
    </svg>
  ),
  connected: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  started: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  planning: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  researching: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  paper_done: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  writing: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  completed: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
};

/**
 * AgentActivity - Single panel showing agent work in progress
 */
export default function AgentActivity({ session, activities = [], isLoading }) {
  const { plan = [], current_task_index = 0, status, documents = [], report } = session || {};
  
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
            <ReactMarkdown>{report}</ReactMarkdown>
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
                  className="block p-2 rounded text-sm font-serif hover:bg-amber-50 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  📄 {doc.title || doc.arxiv_id}
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
          background: 'linear-gradient(135deg, var(--navy-700) 0%, var(--navy-800) 100%)',
          color: 'var(--cream-50)'
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
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
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
          
          {/* Progress bar */}
          <div 
            className="h-2 rounded-full mb-4 overflow-hidden"
            style={{ background: 'var(--cream-200)' }}
          >
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
      <div className="px-6 py-4">
        <h3 
          className="text-xs font-mono uppercase tracking-wider mb-3"
          style={{ color: 'var(--text-muted)' }}
        >
          Activity
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
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
                <span style={{ color: 'var(--amber-500)', flexShrink: 0 }}>
                  {ActionIcons[activity.action] || ActionIcons.started}
                </span>
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
              </div>
            ))
          )}
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
                  background: 'white',
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
