/**
 * ModelSelector - Minimal editorial dropdown
 */
export default function ModelSelector({ value, onChange }) {
  const models = [
    {
      id: 'xiaomi/mimo-v2-flash:free',
      name: 'MiMo-V2-Flash',
      desc: 'Planning & Synthesis',
    },
    {
      id: 'mistralai/devstral-2512:free',
      name: 'Devstral 2',
      desc: 'Coding & Analysis',
    },
  ];

  const selected = models.find(m => m.id === value) || models[0];

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
        style={{ 
          background: 'var(--cream-100)',
          border: '1px solid var(--border-subtle)'
        }}
      >
        <span 
          className="w-2 h-2 rounded-full"
          style={{ background: 'var(--status-active)' }}
        />
        <div className="text-left">
          <p className="text-sm font-serif" style={{ color: 'var(--text-primary)' }}>
            {selected.name}
          </p>
        </div>
        <svg 
          className="w-4 h-4 ml-1" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          style={{ color: 'var(--text-muted)' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      <div 
        className="
          absolute top-full right-0 mt-2 w-56 
          opacity-0 invisible group-hover:opacity-100 group-hover:visible 
          transition-all duration-200 z-50
        "
      >
        <div 
          className="card-elevated rounded-lg p-2 shadow-lg"
          style={{ background: 'white' }}
        >
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => onChange(model.id)}
              className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all"
              style={{
                background: value === model.id ? 'var(--cream-100)' : 'transparent',
              }}
            >
              <span 
                className="w-2 h-2 rounded-full"
                style={{ 
                  background: value === model.id ? 'var(--status-active)' : 'var(--cream-400)' 
                }}
              />
              <div>
                <p className="text-sm font-serif" style={{ color: 'var(--text-primary)' }}>
                  {model.name}
                </p>
                <p className="text-xs font-serif" style={{ color: 'var(--text-muted)' }}>
                  {model.desc}
                </p>
              </div>
            </button>
          ))}
          
          <div 
            className="mt-2 pt-2 px-3"
            style={{ borderTop: '1px solid var(--border-subtle)' }}
          >
            <p className="text-xs font-serif italic" style={{ color: 'var(--text-muted)' }}>
              Free via OpenRouter
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
