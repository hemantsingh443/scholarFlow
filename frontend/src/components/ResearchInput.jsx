import { useState, useRef, useEffect } from 'react';
import { Search, Loader2, ArrowRight } from 'lucide-react';

/**
 * Research input with dynamic modern styling.
 * Auto-expanding textarea, pill-shaped aesthetics, floating feel.
 */
export default function ResearchInput({ onSubmit, isLoading }) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  const exampleQueries = [
    "Compare RLHF and DPO for LLM alignment",
    "Transformer architecture innovations 2024",
    "Retrieval augmented generation techniques",
    "Mixture of Experts scaling laws",
  ];

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
      
      // Only show scrollbar if content exceeds max-height (12rem = 192px)
      if (scrollHeight > 192) {
        textareaRef.current.style.overflowY = 'auto';
      } else {
        textareaRef.current.style.overflowY = 'hidden';
      }
    }
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSubmit(query.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isDisabled = !query.trim() || isLoading;

  return (
    <div className="max-w-3xl mx-auto w-full">
      {/* Main Input Container - Soft, Modern, Floating */}
      <form onSubmit={handleSubmit} className="relative group">
        <div 
          className={`
            relative flex flex-col transition-all duration-300 ease-out
            rounded-3xl border overflow-hidden
            ${isFocused ? 'shadow-xl ring-1 ring-amber-400/30' : 'shadow-md hover:shadow-lg'}
          `}
          style={{
            background: 'var(--cream-50)', // Base theme background
            borderColor: isFocused ? 'var(--amber-400)' : 'var(--border-subtle)',
          }}
        >
          {/* Top Section: Icon + Textarea */}
          <div className="flex items-start p-4">
            {/* Search Icon */}
            <div className="pt-2 pl-2 pr-4 text-gray-400 flex-shrink-0">
              <Search 
                className={`w-5 h-5 transition-colors duration-300 ${isFocused ? 'text-amber-500' : ''}`}
                style={{ color: isFocused ? 'var(--amber-500)' : 'var(--text-muted)' }}
              />
            </div>

            {/* Auto-expanding Textarea */}
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="What do you want to research today?"
              rows={1}
              className="
                w-full py-2 bg-transparent border-none outline-none resize-none overflow-hidden
                font-serif text-lg leading-relaxed
                placeholder-gray-400/70 custom-scrollbar
              "
              style={{ 
                color: 'var(--text-primary)',
                minHeight: '2rem',
                maxHeight: '12rem',
              }}
              disabled={isLoading}
            />
          </div>

          {/* Bottom Section: Action Bar (Visible when has content or focused) */}
          <div 
            className={`
              flex justify-between items-center px-4 pb-3 transition-opacity duration-300
              ${(query.trim() || isFocused) ? 'opacity-100' : 'opacity-80'}
            `}
          >
            {/* Helper text */}
            <span className="text-xs font-serif italic pl-11 opacity-60" style={{ color: 'var(--text-secondary)' }}>
              Press Enter to start • Shift+Enter for new line
            </span>

            {/* Submit Button - Soft Pill */}
            <button
              type="submit"
              disabled={isDisabled}
              className={`
                px-5 py-2 rounded-full font-serif font-medium text-sm
                transition-all duration-300 flex items-center gap-2 transform
                ${isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:scale-105 active:scale-95 shadow-sm'}
              `}
              style={{
                // Logic: High contrast active state, muted disabled state
                background: isDisabled ? 'var(--cream-200)' : 'var(--navy-700)',
                color: isDisabled ? 'var(--text-muted)' : 'var(--cream-50)',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Researching</span>
                </>
              ) : (
                <>
                  <span>Begin</span>
                  {!isDisabled && <ArrowRight className="w-3 h-3" />}
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Example Queries - Minimal Chips */}
      {!isLoading && (
        <div className={`mt-8 text-center transition-all duration-500 delay-100 ${query ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
          <div className="flex flex-wrap justify-center gap-2">
            {exampleQueries.map((example, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(example)}
                className="
                  px-3 py-1.5 rounded-full text-xs font-serif
                  border transition-all duration-200
                  hover:border-amber-400 hover:bg-black/5 dark:hover:bg-white/5
                  hover:-translate-y-0.5
                "
                style={{
                  borderColor: 'var(--border-medium)',
                  color: 'var(--text-secondary)',
                  background: 'transparent'
                }}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
