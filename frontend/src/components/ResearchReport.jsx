import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BookOpen, AlertCircle, CheckCircle, FileText, ExternalLink, Loader2 } from 'lucide-react';

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
          <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <BookOpen 
              className="w-16 h-16" 
              style={{ color: 'var(--cream-400)' }}
            />
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
        <AlertCircle 
          className="w-16 h-16 mx-auto mb-4"
          style={{ color: 'var(--status-error)' }}
        />
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
          className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider px-3 py-1 rounded-full"
          style={{ 
            background: 'rgba(5, 150, 105, 0.1)',
            color: 'var(--status-active)'
          }}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Complete
        </span>
      </div>

      {/* Report Content */}
      <div className="px-8 py-8">
        <article className="prose-editorial max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
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
                  <ExternalLink className="w-3 h-3" />
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
              // Table components for GFM
              table: ({ children }) => (
                <div className="overflow-x-auto my-6">
                  <table className="w-full text-left border-collapse font-serif text-sm">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead style={{ background: 'var(--cream-200)', color: 'var(--navy-800)' }}>
                  {children}
                </thead>
              ),
              tbody: ({ children }) => (
                <tbody>{children}</tbody>
              ),
              tr: ({ children }) => (
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {children}
                </tr>
              ),
              th: ({ children }) => (
                <th className="px-4 py-3 font-semibold">{children}</th>
              ),
              td: ({ children }) => (
                <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{children}</td>
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
                  background: 'var(--navy-700)', // Using card background for dark mode awareness if needed, but keeping simple
                  // Actually let's use a variable or generic bg
                  backgroundColor: 'var(--cream-50)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div 
                  className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center"
                  style={{ background: 'var(--cream-200)' }}
                >
                  <FileText 
                    className="w-5 h-5" 
                    style={{ color: 'var(--amber-500)' }}
                  />
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
