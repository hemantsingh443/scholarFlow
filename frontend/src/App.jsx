import { useState } from 'react';
import ResearchInput from './components/ResearchInput';
import AgentActivity from './components/AgentActivity';
import { useResearch } from './hooks/useResearch';

/**
 * ScholarFlow - Single Panel Research Interface
 * 
 * Clean, focused design with prominent agent activity display.
 */
function App() {
  const [selectedModel, setSelectedModel] = useState('xiaomi/mimo-v2-flash:free');
  const { session, isLoading, error, activities, startResearch, clearSession } = useResearch();

  return (
    <div className="min-h-screen paper-texture">
      {/* Header */}
      <header 
        className="sticky top-0 z-40"
        style={{ 
          background: 'var(--cream-50)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center font-display text-xl"
              style={{ 
                background: 'var(--navy-700)',
                color: 'var(--cream-50)'
              }}
            >
              S
            </div>
            <div>
              <h1 
                className="font-display text-xl font-medium tracking-tight"
                style={{ color: 'var(--navy-800)' }}
              >
                ScholarFlow
              </h1>
              <p 
                className="text-xs tracking-wide"
                style={{ color: 'var(--text-muted)' }}
              >
                ACADEMIC RESEARCH ASSISTANT
              </p>
            </div>
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-4">
            {isLoading && (
              <span 
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-serif"
                style={{ 
                  background: 'rgba(5, 150, 105, 0.1)',
                  color: 'var(--status-active)'
                }}
              >
                <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: 'var(--status-active)' }} />
                Researching
              </span>
            )}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z"/>
              </svg>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        
        {/* Hero - shown when no session */}
        {!session && !isLoading && (
          <div className="text-center mb-10 reveal-up">
            <h2 
              className="font-display text-3xl md:text-4xl font-medium mb-4 leading-tight"
              style={{ color: 'var(--navy-800)' }}
            >
              Research Smarter, Not Harder
            </h2>
            <p 
              className="font-serif text-lg max-w-xl mx-auto leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              AI agents search, read, and synthesize academic papers from ArXiv.
            </p>
          </div>
        )}

        {/* Search Input */}
        <ResearchInput onSubmit={startResearch} isLoading={isLoading} />

        {/* Error Display */}
        {error && (
          <div 
            className="mt-6 p-4 rounded-lg text-center"
            style={{ 
              background: 'rgba(220, 38, 38, 0.08)',
              border: '1px solid rgba(220, 38, 38, 0.2)',
              color: 'var(--status-error)'
            }}
          >
            <p className="font-serif">{error}</p>
          </div>
        )}

        {/* Agent Activity - Single Panel */}
        {(session || isLoading) && (
          <div className="mt-8">
            <AgentActivity 
              session={session} 
              activities={activities}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* New Research Button */}
        {session?.status === 'completed' && (
          <div className="mt-8 text-center">
            <button
              onClick={clearSession}
              className="px-6 py-3 rounded-lg font-serif transition-all duration-200"
              style={{ 
                background: 'var(--navy-700)',
                color: 'var(--cream-50)'
              }}
            >
              Start New Research
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer 
        className="mt-16"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <div className="max-w-4xl mx-auto px-6 py-6">
          <p 
            className="text-center font-serif text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            ScholarFlow — Built with React, FastAPI, and LangGraph
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
