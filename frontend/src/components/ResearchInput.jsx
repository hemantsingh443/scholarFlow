import { useState } from 'react';
import { Search, Loader2, ArrowRight } from 'lucide-react';

/**
 * Research input with editorial styling.
 * Clean, minimal aesthetic with warm tones.
 */
export default function ResearchInput({ onSubmit, isLoading }) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const exampleQueries = [
    "Compare RLHF and DPO for LLM alignment",
    "Transformer architecture innovations 2024",
    "Retrieval augmented generation techniques",
    "Mixture of Experts scaling laws",
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSubmit(query.trim());
    }
  };

  const isDisabled = !query.trim() || isLoading;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Main Input */}
      <form onSubmit={handleSubmit}>
        <div 
          className={`
            card-elevated rounded-lg transition-all duration-300
            ${isFocused ? 'ring-2 ring-amber-400/50 shadow-lg' : ''}
          `}
          style={{
            background: 'var(--cream-50)', // Explicit background matching theme
          }}
        >
          <div className="flex items-center p-2">
            {/* Search Icon */}
            <div className="pl-4 pr-3 text-gray-400">
              <Search 
                className={`w-5 h-5 transition-colors ${isFocused ? 'text-amber-500' : ''}`}
                style={{ color: isFocused ? 'var(--amber-500)' : 'var(--text-muted)' }}
              />
            </div>

            {/* Input */}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Enter your research question..."
              className="
                flex-1 py-4 bg-transparent border-none outline-none
                font-serif text-lg placeholder-gray-400
              "
              style={{ color: 'var(--text-primary)' }}
              disabled={isLoading}
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isDisabled}
              className={`
                px-6 py-3 rounded-md font-serif font-medium
                transition-all duration-200 flex items-center gap-2
                ${isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:opacity-90'}
              `}
              style={{
                // Active: Navy background, Cream text
                // Disabled: Cream-300 background, Text-muted
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
                  <span>Begin Research</span>
                  {!isDisabled && <ArrowRight className="w-4 h-4" />}
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Example Queries */}
      {!isLoading && (
        <div className="mt-6 text-center reveal-up">
          <p className="text-sm mb-3 font-serif italic" style={{ color: 'var(--text-secondary)' }}>
            — or explore a topic —
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {exampleQueries.map((example, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(example)}
                className="
                  px-3 py-1.5 rounded-full text-sm font-serif
                  border transition-all duration-200
                  hover:border-amber-400 hover:bg-black/5 dark:hover:bg-white/5
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
