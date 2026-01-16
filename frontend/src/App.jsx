import { useState, useEffect } from 'react';
import ResearchInput from './components/ResearchInput';
import AgentActivity from './components/AgentActivity';
import { useResearch } from './hooks/useResearch';
import { Moon, Sun, Github, BookOpen, Info } from 'lucide-react';

/**
 * ScholarFlow - Single Panel Research Interface
 * 
 * Clean, focused design with prominent agent activity display.
 */
function App() {
  const [darkMode, setDarkMode] = useState(() => {
    // Check local storage or system preference
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const { session, isLoading, error, activities, startResearch, clearSession } = useResearch();

  // Apply dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  return (
    <div className="min-h-screen paper-texture transition-colors duration-300">
      {/* Header - Compact & Clean */}
      <header 
        className="sticky top-0 z-40 backdrop-blur-md transition-colors duration-300"
        style={{ 
          background: 'var(--cream-50)',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(253, 251, 247, 0.8)'
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.location.reload()}>
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
              style={{ 
                background: 'var(--navy-700)',
                color: 'var(--cream-50)'
              }}
            >
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 
                className="font-display text-lg font-medium tracking-tight leading-none"
                style={{ color: 'var(--navy-800)' }}
              >
                ScholarFlow
              </h1>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Status Indicator (only when researching) */}
            {isLoading && (
              <span 
                className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium font-mono uppercase tracking-wider"
                style={{ 
                  background: 'rgba(5, 150, 105, 0.1)',
                  color: 'var(--status-active)'
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: 'var(--status-active)' }} />
                Active
              </span>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* GitHub Link */}
            <a
              href="https://github.com/hemantsingh443/scholarFlow"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        
        {/* Welcome / Hero State */}
        {!session && !isLoading && (
          <div className="text-center mb-12 reveal-up max-w-2xl mx-auto pt-10">
            <h2 
              className="font-display text-4xl sm:text-5xl font-medium mb-6 leading-tight"
              style={{ color: 'var(--navy-800)' }}
            >
              Deep Research, <br/>
              <span className="italic" style={{ color: 'var(--amber-500)' }}>Simplified.</span>
            </h2>
            <div className="flex flex-col items-center gap-2">
              <p 
                className="font-serif text-lg sm:text-xl leading-relaxed mb-4"
                style={{ color: 'var(--text-secondary)' }}
              >
                Autonomous agents that search, read, and synthesize academic papers into comprehensive reports.
              </p>
              
              {/* Models Info Badge */}
              <div 
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-serif border"
                style={{ 
                  borderColor: 'var(--border-medium)',
                  color: 'var(--text-muted)'
                }}
              >
                <Info className="w-3 h-3" />
                <span>Powered by <strong>MiMo-V2</strong> & <strong>Mistral Devstral</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Search Input Area */}
        <div className={`transition-all duration-500 ${!session && !isLoading ? 'max-w-2xl mx-auto mt-8' : 'mb-8'}`}>
          <ResearchInput onSubmit={startResearch} isLoading={isLoading} />
        </div>

        {/* Error Display */}
        {error && (
          <div 
            className="mt-6 p-4 rounded-lg text-center max-w-2xl mx-auto reveal-up"
            style={{ 
              background: 'rgba(220, 38, 38, 0.08)',
              border: '1px solid rgba(220, 38, 38, 0.2)',
              color: 'var(--status-error)'
            }}
          >
            <p className="font-serif flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5" /> 
              {error}
            </p>
          </div>
        )}

        {/* Agent Activity & Results */}
        {(session || isLoading) && (
          <div className="mt-8 transition-opacity duration-500">
            <AgentActivity 
              session={session} 
              activities={activities}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* New Research Button (Bottom) */}
        {session?.status === 'completed' && (
          <div className="mt-12 text-center pb-12 reveal-up">
            <button
              onClick={clearSession}
              className="px-8 py-3 rounded-full font-medium transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg flex items-center gap-2 mx-auto"
              style={{ 
                background: 'var(--navy-700)',
                color: 'var(--cream-50)'
              }}
            >
              <BookOpen className="w-4 h-4" />
              Start New Research
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer 
        className="mt-auto py-8 text-center"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <p 
          className="font-serif text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          ScholarFlow — Powered by LangGraph & OpenRouter
        </p>
        <p 
          className="font-serif text-xs mt-2 opacity-70"
          style={{ color: 'var(--text-muted)' }}
        >
          Models: Xiaomi MiMo V2 Flash · Mistral Devstral 2512
        </p>
      </footer>
    </div>
  );
}

export default App;
