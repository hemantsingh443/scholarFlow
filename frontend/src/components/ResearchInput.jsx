import { useState } from 'react';

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

  return (
    <div className="max-w-3xl mx-auto">
      {/* Main Input */}
      <form onSubmit={handleSubmit}>
        <div 
          className={`
            card-elevated rounded-lg transition-all duration-300
            ${isFocused ? 'ring-2 ring-amber-400/50 shadow-lg' : ''}
          `}
        >
          <div className="flex items-stretch">
            {/* Search Icon */}
            <div className="flex items-center pl-5 pr-3">
              <svg 
                className={`w-5 h-5 transition-colors ${isFocused ? 'text-amber-500' : 'text-gray-400'}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
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
                flex-1 py-5 bg-transparent border-none outline-none
                font-serif text-lg text-navy-800 placeholder-gray-400
              "
              style={{ color: 'var(--text-primary)' }}
              disabled={isLoading}
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className="
                m-2 px-6 py-3 rounded-md font-serif font-medium
                transition-all duration-200
                disabled:opacity-40 disabled:cursor-not-allowed
              "
              style={{
                background: !query.trim() || isLoading ? '#D4C5A9' : 'var(--navy-700)',
                color: !query.trim() || isLoading ? 'var(--text-muted)' : 'var(--cream-50)',
              }}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="reading-dots flex gap-1">
                    <span className="w-1.5 h-1.5 bg-current rounded-full"></span>
                    <span className="w-1.5 h-1.5 bg-current rounded-full"></span>
                    <span className="w-1.5 h-1.5 bg-current rounded-full"></span>
                  </span>
                  Researching
                </span>
              ) : (
                'Begin Research'
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Example Queries */}
      {!isLoading && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 mb-3 font-serif italic">
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
                  hover:border-amber-400 hover:bg-amber-50
                "
                style={{
                  borderColor: 'var(--border-medium)',
                  color: 'var(--text-secondary)',
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
