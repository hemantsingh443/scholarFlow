import ReactMarkdown from 'react-markdown';

/**
 * ResearchReport - Editorial styled markdown report display
 */
export default function ResearchReport({ session }) {
  if (!session) return null;

  const { report, documents = [], status } = session;

  // Loading state
  if (status !== 'completed') {
    return (
      <div className="card-elevated rounded-lg p-12 text-center reveal-up">
        <div className="max-w-sm mx-auto">
          {/* Animated book icon */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <svg 
              className="w-20 h-20" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ color: 'var(--cream-400)' }}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1} 
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
              />
            </svg>
            {/* Animated progress ring */}
            <div 
              className="absolute inset-0 rounded-full border-2 border-t-amber-400 animate-spin"
              style={{ 
                borderColor: 'var(--cream-300)',
                borderTopColor: 'var(--amber-400)',
                animationDuration: '2s'
              }}
            />
          </div>

          <h3 className="font-display text-xl mb-2" style={{ color: 'var(--navy-800)' }}>
            Research in Progress
          </h3>
          <p className="font-serif text-sm" style={{ color: 'var(--text-secondary)' }}>
            {documents.length > 0 
              ? `Analyzed ${documents.length} paper${documents.length !== 1 ? 's' : ''} so far...`
              : 'Searching academic databases...'
            }
          </p>

          {/* Progress bar */}
          <div 
            className="mt-6 h-1 rounded-full overflow-hidden"
            style={{ background: 'var(--cream-200)' }}
          >
            <div className="h-full progress-flow" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (!report) {
    return (
      <div className="card-elevated rounded-lg p-12 text-center">
        <svg 
          className="w-16 h-16 mx-auto mb-4"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          style={{ color: 'var(--status-error)' }}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
          />
        </svg>
        <h3 className="font-display text-xl mb-2" style={{ color: 'var(--navy-800)' }}>
          Unable to Generate Report
        </h3>
        <p className="font-serif text-sm" style={{ color: 'var(--text-secondary)' }}>
          {session.error || 'An unexpected error occurred during research.'}
        </p>
      </div>
    );
  }

  return (
    <div className="card-elevated rounded-lg reveal-up">
      {/* Header */}
      <div 
        className="px-8 py-6 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <h2 className="font-display text-2xl" style={{ color: 'var(--navy-800)' }}>
          Research Report
        </h2>
        <span 
          className="text-xs font-mono uppercase tracking-wider px-3 py-1 rounded-full"
          style={{ 
            background: 'rgba(5, 150, 105, 0.1)',
            color: 'var(--status-active)'
          }}
        >
          Complete
        </span>
      </div>

      {/* Report Content */}
      <div className="px-8 py-8">
        <article className="prose-editorial max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="font-display text-2xl font-semibold mt-10 mb-4 pb-2" 
                    style={{ 
                      color: 'var(--navy-800)',
                      borderBottom: '2px solid var(--amber-400)'
                    }}>
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="font-display text-xl font-medium mt-8 mb-3" 
                    style={{ color: 'var(--navy-700)' }}>
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="font-serif text-lg font-semibold mt-6 mb-2" 
                    style={{ color: 'var(--navy-600)' }}>
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="font-serif text-base leading-relaxed mb-4" 
                   style={{ 
                     color: 'var(--text-primary)',
                     textAlign: 'justify',
                     hyphens: 'auto' 
                   }}>
                  {children}
                </p>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1"
                  style={{ 
                    color: 'var(--amber-600)',
                    textDecoration: 'underline',
                    textDecorationThickness: '1px',
                    textUnderlineOffset: '2px'
                  }}
                >
                  {children}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ),
              ul: ({ children }) => (
                <ul className="font-serif my-4 ml-5 list-disc space-y-2" style={{ color: 'var(--text-primary)' }}>
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="font-serif my-4 ml-5 list-decimal space-y-2" style={{ color: 'var(--text-primary)' }}>
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed" style={{ markerColor: 'var(--amber-500)' }}>
                  {children}
                </li>
              ),
              blockquote: ({ children }) => (
                <blockquote 
                  className="my-6 pl-5 italic"
                  style={{ 
                    borderLeft: '3px solid var(--amber-400)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {children}
                </blockquote>
              ),
              code: ({ inline, children }) => (
                inline 
                  ? <code 
                      className="font-mono text-sm px-1.5 py-0.5 rounded"
                      style={{ 
                        background: 'var(--cream-200)',
                        color: 'var(--navy-700)'
                      }}
                    >
                      {children}
                    </code>
                  : <code className="font-mono">{children}</code>
              ),
              pre: ({ children }) => (
                <pre 
                  className="my-6 p-4 rounded-lg overflow-x-auto font-mono text-sm"
                  style={{ background: 'var(--cream-200)' }}
                >
                  {children}
                </pre>
              ),
              strong: ({ children }) => (
                <strong style={{ color: 'var(--navy-800)' }}>{children}</strong>
              ),
            }}
          >
            {report}
          </ReactMarkdown>
        </article>
      </div>

      {/* Papers Section */}
      {documents.length > 0 && (
        <div 
          className="px-8 py-6"
          style={{ 
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--cream-100)'
          }}
        >
          <h3 
            className="text-xs font-mono uppercase tracking-wider mb-4"
            style={{ color: 'var(--text-muted)' }}
          >
            Source Papers · {documents.length}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {documents.map((doc, idx) => (
              <a
                key={idx}
                href={doc.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-4 rounded-lg transition-all duration-200 group"
                style={{ 
                  background: 'white',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div 
                  className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center"
                  style={{ background: 'var(--cream-200)' }}
                >
                  <svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    style={{ color: 'var(--amber-500)' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p 
                    className="font-serif text-sm leading-snug line-clamp-2 group-hover:text-amber-600 transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {doc.title}
                  </p>
                  <p 
                    className="text-xs font-mono mt-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    arXiv:{doc.arxiv_id}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
