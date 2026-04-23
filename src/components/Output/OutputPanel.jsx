import { Terminal, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

export default function OutputPanel({ output, isRunning }) {
  if (isRunning) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 p-6">
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Executing code...</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Powered by Wandbox API</p>
      </div>
    );
  }

  if (!output) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 p-6">
        <Terminal size={36} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Click "Run" to execute your code</p>
        <kbd className="text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
          Ctrl + Enter
        </kbd>
      </div>
    );
  }

  const isSuccess = output.status?.id === 3;
  const isCompileErr = output.status?.id === 6;
  const isRuntimeErr = output.status?.id === 11;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Status Badge */}
      <div className="flex items-center gap-3 px-4 py-2.5 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        {isSuccess ? (
          <div className="flex items-center gap-2">
            <CheckCircle size={14} style={{ color: '#10b981' }} />
            <span className="text-xs font-semibold" style={{ color: '#10b981' }}>Accepted</span>
          </div>
        ) : isCompileErr ? (
          <div className="flex items-center gap-2">
            <XCircle size={14} style={{ color: '#ef4444' }} />
            <span className="text-xs font-semibold" style={{ color: '#ef4444' }}>Compilation Error</span>
          </div>
        ) : isRuntimeErr ? (
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} style={{ color: '#f59e0b' }} />
            <span className="text-xs font-semibold" style={{ color: '#f59e0b' }}>Runtime Error</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Terminal size={14} style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{output.status?.description || 'Output'}</span>
          </div>
        )}
      </div>

      {/* Output Content */}
      <div className="flex-1 overflow-auto p-4">
        {output.stdout && (
          <div className="mb-4">
            <div className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Standard Output</div>
            <pre className="text-sm leading-relaxed whitespace-pre-wrap break-words font-mono p-3 rounded-lg"
              style={{ color: '#e2e8f0', background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
              {output.stdout}
            </pre>
          </div>
        )}
        {output.stderr && (
          <div className="mb-4">
            <div className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#ef4444', fontSize: '0.65rem' }}>Error Output</div>
            <pre className="text-sm leading-relaxed whitespace-pre-wrap break-words font-mono p-3 rounded-lg"
              style={{ color: '#fca5a5', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {output.stderr}
            </pre>
          </div>
        )}
        {output.compile_output && (
          <div>
            <div className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Compiler Output</div>
            <pre className="text-sm leading-relaxed whitespace-pre-wrap break-words font-mono p-3 rounded-lg"
              style={{ color: '#fdba74', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              {output.compile_output}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
