import { useMemo } from 'react';

/**
 * Action icons for different activity types.
 */
const ActionIcons = {
  searching: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  found_papers: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  downloading: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  reading: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  summarizing: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  storing: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  ),
  paper_done: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  question_start: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  started: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
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
      planning: { label: 'Planning Research', color: 'var(--amber-500)' },
      researching: { label: 'Investigating', color: 'var(--status-active)' },
      reading: { label: 'Reading Papers', color: 'var(--status-active)' },
      writing: { label: 'Writing Report', color: 'var(--amber-500)' },
      completed: { label: 'Complete', color: 'var(--status-active)' },
      error: { label: 'Error', color: 'var(--status-error)' },
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
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-serif"
          style={{ 
            background: `${statusDisplay.color}15`,
            color: statusDisplay.color 
          }}
        >
          <span 
            className="w-2 h-2 rounded-full pulse-dot"
            style={{ background: statusDisplay.color }}
          />
          {statusDisplay.label}
        </div>
      </div>

      {/* Decorative line */}
      <div className="ornament-line mb-6" />

      {/* Plan Items */}
      <div className="space-y-3 mb-6">
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
                  flex items-start gap-3 p-4 rounded-lg transition-all duration-300
                  reveal-up
                `}
                style={{ 
                  animationDelay: `${idx * 100}ms`,
                  background: isComplete 
                    ? 'rgba(5, 150, 105, 0.08)' 
                    : isCurrent 
                    ? 'var(--cream-200)' 
                    : 'transparent',
                  borderLeft: isCurrent 
                    ? '3px solid var(--amber-400)' 
                    : isComplete 
                    ? '3px solid var(--status-active)'
                    : '3px solid transparent'
                }}
              >
                {/* Number indicator */}
                <div 
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-mono"
                  style={{
                    background: isComplete 
                      ? 'var(--status-active)' 
                      : isCurrent 
                      ? 'var(--amber-400)' 
                      : 'var(--cream-300)',
                    color: isComplete || isCurrent ? 'white' : 'var(--text-muted)'
                  }}
                >
                  {isComplete ? '✓' : idx + 1}
                </div>

                {/* Question text */}
                <p 
                  className="flex-1 font-serif text-sm leading-relaxed"
                  style={{ 
                    color: isComplete ? 'var(--status-active)' : isCurrent ? 'var(--text-primary)' : 'var(--text-muted)'
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
            className="text-xs font-mono uppercase tracking-wider mb-3"
            style={{ color: 'var(--text-muted)' }}
          >
            Live Activity
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {activities.slice(-8).map((activity, idx) => (
              <div 
                key={`${activity.timestamp}-${idx}`}
                className="flex items-start gap-2 reveal-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <span style={{ color: 'var(--amber-500)' }}>
                  {ActionIcons[activity.action] || ActionIcons.started}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-serif" style={{ color: 'var(--text-secondary)' }}>
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

      {/* Documents found */}
      {documents.length > 0 && (
        <div className="pt-4 mt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <h3 
            className="text-xs font-mono uppercase tracking-wider mb-3"
            style={{ color: 'var(--text-muted)' }}
          >
            Papers Analyzed · {documents.length}
          </h3>
          <div className="space-y-2">
            {documents.slice(-5).map((doc, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-2 p-2 rounded"
                style={{ background: 'var(--cream-200)' }}
              >
                <span 
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: 'var(--status-active)' }}
                />
                <span className="text-xs font-serif truncate" style={{ color: 'var(--text-secondary)' }}>
                  {doc.title?.substring(0, 50) || 'Processing...'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
