import Editor from '@monaco-editor/react';
import { LANGUAGES } from '../../utils/languageConfig';
import { Play, Wand2, Brain, Eye, FlaskConical, ChevronDown, Loader2, Search } from 'lucide-react';
import { useState, useRef } from 'react';

export default function CodeEditor({
  code, setCode, language, setLanguage,
  onRun, onFix, onExplain, onVisualize, onGenerateTests,
  isRunning, isAILoading, readOnly = false
}) {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  const editorRef = useRef(null);

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
    editor.addCommand(2048 | 3, () => onRun()); // Ctrl+Enter
  };

  const getSelectedCode = () => {
    if (!editorRef.current) return code;
    const selection = editorRef.current.getSelection();
    if (selection && !selection.isEmpty()) {
      return editorRef.current.getModel().getValueInRange(selection);
    }
    return code;
  };

  const langConfig = LANGUAGES[language];
  const filteredLangs = Object.entries(LANGUAGES).filter(([, lang]) =>
    lang.name.toLowerCase().includes(langSearch.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg-secondary)', position: 'relative' }}>
      {/* ReadOnly Overlay Indicator (optional) */}
      {readOnly && (
        <div className="absolute top-12 right-6 z-10 bg-black/50 text-white/80 px-3 py-1 rounded-md text-xs backdrop-blur-sm border border-white/10 pointer-events-none flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          Read Only
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between px-2 py-1.5 gap-2 flex-wrap"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        
        {/* Language Selector */}
        <div className="relative">
          <button onClick={() => { if (!readOnly) { setShowLangMenu(!showLangMenu); setLangSearch(''); } }}
            disabled={readOnly}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${readOnly ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110'}`}
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            <span className="text-sm">{langConfig.icon}</span>
            <span>{langConfig.name}</span>
            <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
          </button>
          {showLangMenu && !readOnly && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
              <div className="absolute top-full left-0 mt-1 py-1 rounded-xl z-50 min-w-[200px] animate-fade-in"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', maxHeight: '320px', display: 'flex', flexDirection: 'column' }}>
                {/* Search */}
                <div className="px-2 py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                    <Search size={12} style={{ color: 'var(--text-muted)' }} />
                    <input value={langSearch} onChange={(e) => setLangSearch(e.target.value)}
                      placeholder="Search language..." autoFocus
                      className="bg-transparent outline-none text-xs flex-1"
                      style={{ color: 'var(--text-primary)' }} />
                  </div>
                </div>
                <div className="overflow-y-auto flex-1">
                  {filteredLangs.map(([key, lang]) => (
                    <button key={key}
                      onClick={() => { setLanguage(key); setShowLangMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-xs transition-colors hover:bg-white/5"
                      style={{ color: language === key ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: language === key ? 600 : 400 }}>
                      <span className="text-sm w-5 text-center">{lang.icon}</span>
                      <span>{lang.name}</span>
                      {language === key && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons — responsive wrapping */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={onGenerateTests} disabled={isAILoading}
            className="btn-secondary text-xs py-1.5 px-2.5 hidden sm:flex" title="Generate Test Cases">
            <FlaskConical size={12} /> <span className="hidden md:inline">Tests</span>
          </button>
          <button onClick={onVisualize} disabled={isAILoading}
            className="btn-secondary text-xs py-1.5 px-2.5 hidden sm:flex" title="Visualize Execution">
            <Eye size={12} /> <span className="hidden md:inline">Visualize</span>
          </button>
          <button onClick={() => onExplain(getSelectedCode())} disabled={isAILoading}
            className="btn-secondary text-xs py-1.5 px-2.5" title="Explain Logic">
            <Brain size={12} /> <span className="hidden lg:inline">Explain</span>
          </button>
          <button onClick={onFix} disabled={isAILoading || readOnly}
            className={`text-xs py-1.5 px-2.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white/10'}`}
            title="Fix My Code"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: 'var(--warning)' }}>
            <Wand2 size={12} /> <span className="hidden lg:inline">Fix</span>
          </button>
          <button onClick={onRun} disabled={isRunning}
            className="btn-success text-xs py-1.5 px-4" title="Run Code (Ctrl+Enter)">
            {isRunning ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
            {isRunning ? 'Running...' : 'Run'}
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0" style={{ opacity: readOnly ? 0.85 : 1 }}>
        <Editor
          height="100%"
          language={langConfig.monacoLang}
          value={code}
          onChange={(val) => {
            if (!readOnly) setCode(val || '');
          }}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            readOnly: readOnly,
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            minimap: { enabled: false },
            padding: { top: 16, bottom: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: readOnly ? 'solid' : 'smooth',
            cursorSmoothCaretAnimation: 'on',
            renderLineHighlight: readOnly ? 'none' : 'all',
            lineNumbers: 'on',
            roundedSelection: true,
            automaticLayout: true,
            tabSize: 4,
            wordWrap: 'on',
            bracketPairColorization: { enabled: true },
            guides: { bracketPairs: true },
            suggestOnTriggerCharacters: !readOnly,
            quickSuggestions: !readOnly,
            formatOnPaste: !readOnly,
          }}
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1"
        style={{ background: '#007acc', fontSize: '0.65rem', color: 'rgba(255,255,255,0.85)' }}>
        <div className="flex items-center gap-3">
          <span>{langConfig.name}</span>
          <span>UTF-8</span>
          <span>Spaces: 4</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Wandbox API</span>
          <span>Debugra Editor</span>
        </div>
      </div>
    </div>
  );
}
