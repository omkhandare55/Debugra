import { Brain, Wand2, Eye, FlaskConical, AlertCircle, Loader2, Sparkles } from 'lucide-react';

export default function AIResponsePanel({ aiResponse, isLoading, aiAction }) {
  if (isLoading) {
    const msgs = {
      'explain-error': 'Analyzing your error...',
      'fix-code': 'Fixing your code...',
      'explain-logic': 'Breaking down the logic...',
      'visualize': 'Creating visualization...',
      'generate-tests': 'Generating test cases...',
    };
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 p-6">
        <div className="relative">
          <Loader2 size={32} className="animate-spin" style={{ color: '#8b5cf6' }} />
          <Sparkles size={14} className="absolute -top-1 -right-1" style={{ color: '#f59e0b' }} />
        </div>
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{msgs[aiAction] || 'AI is thinking...'}</p>
        <div className="w-32 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
          <div className="h-full rounded-full animate-loading-bar" style={{ background: 'linear-gradient(90deg, #8b5cf6, #ec4899)' }} />
        </div>
      </div>
    );
  }

  if (!aiResponse) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 p-6">
        <Brain size={36} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
        <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
          Use the toolbar buttons to get AI assistance
        </p>
        <div className="flex flex-wrap gap-2 justify-center mt-2">
          {['Explain', 'Fix', 'Visualize', 'Tests'].map(a => (
            <span key={a} className="text-xs px-2 py-1 rounded-md" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{a}</span>
          ))}
        </div>
      </div>
    );
  }

  // Render AI response based on type
  const renderContent = () => {
    if (typeof aiResponse === 'string') {
      return <pre className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-primary)' }}>{aiResponse}</pre>;
    }

    return (
      <div className="space-y-4">
        {/* Error Explanation */}
        {aiResponse.issue && (
          <div className="p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={14} style={{ color: '#ef4444' }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#ef4444' }}>Issue</span>
            </div>
            <p className="text-sm" style={{ color: '#fca5a5' }}>{aiResponse.issue}</p>
          </div>
        )}

        {/* Explanation */}
        {aiResponse.explanation && (
          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Brain size={14} style={{ color: '#8b5cf6' }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8b5cf6' }}>Explanation</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{aiResponse.explanation}</p>
          </div>
        )}

        {/* Fix */}
        {aiResponse.fix && (
          <div className="p-3 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Wand2 size={14} style={{ color: '#10b981' }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#10b981' }}>Fix Applied</span>
            </div>
            <p className="text-sm" style={{ color: '#6ee7b7' }}>{aiResponse.fix}</p>
          </div>
        )}

        {/* Fixed Code */}
        {aiResponse.fixedCode && (
          <div>
            <div className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Fixed Code</div>
            <pre className="text-sm p-3 rounded-lg overflow-x-auto font-mono"
              style={{ background: 'var(--bg-tertiary)', color: '#e2e8f0', border: '1px solid var(--border)' }}>
              {aiResponse.fixedCode}
            </pre>
          </div>
        )}

        {/* Steps */}
        {aiResponse.steps && Array.isArray(aiResponse.steps) && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Eye size={14} style={{ color: '#3b82f6' }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#3b82f6' }}>Execution Steps</span>
            </div>
            <div className="space-y-2">
              {aiResponse.steps.map((step, i) => (
                <div key={i} className="flex gap-3 p-2 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                  <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    {step.line && <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Line {step.line}</div>}
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{step.description || step.action || JSON.stringify(step)}</p>
                    {step.variables && (
                      <code className="text-xs mt-1 inline-block px-2 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', color: '#a78bfa' }}>
                        {typeof step.variables === 'string' ? step.variables : JSON.stringify(step.variables)}
                      </code>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Cases */}
        {aiResponse.testCases && Array.isArray(aiResponse.testCases) && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FlaskConical size={14} style={{ color: '#10b981' }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#10b981' }}>Test Cases</span>
            </div>
            <div className="space-y-2">
              {aiResponse.testCases.map((tc, i) => (
                <div key={i} className="p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Test {i + 1}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: tc.type === 'edge' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)',
                        color: tc.type === 'edge' ? '#f59e0b' : '#60a5fa', fontSize: '0.65rem' }}>
                      {tc.type || 'normal'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs"><span style={{ color: 'var(--text-muted)' }}>Input:</span> <code style={{ color: '#e2e8f0' }}>{tc.input}</code></div>
                    <div className="text-xs"><span style={{ color: 'var(--text-muted)' }}>Expected:</span> <code style={{ color: '#10b981' }}>{tc.expected}</code></div>
                    {tc.description && <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{tc.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Complexity */}
        {aiResponse.complexity && (
          <div className="flex gap-3">
            <div className="flex-1 p-3 rounded-lg text-center" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Time</div>
              <div className="text-sm font-mono font-bold" style={{ color: '#a78bfa' }}>{aiResponse.complexity.time || 'N/A'}</div>
            </div>
            <div className="flex-1 p-3 rounded-lg text-center" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Space</div>
              <div className="text-sm font-mono font-bold" style={{ color: '#60a5fa' }}>{aiResponse.complexity.space || 'N/A'}</div>
            </div>
          </div>
        )}

        {/* Generic fallback */}
        {!aiResponse.issue && !aiResponse.explanation && !aiResponse.steps && !aiResponse.testCases && !aiResponse.fixedCode && !aiResponse.complexity && (
          <pre className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {JSON.stringify(aiResponse, null, 2)}
          </pre>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-auto p-4">
      {renderContent()}
    </div>
  );
}
