import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { doc, setDoc, onSnapshot, updateDoc, serverTimestamp, collection, addDoc, getDocs, query, orderBy, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../services/firebase';
import { executeCode, explainError, fixCode, explainLogic, generateTestCases, visualizeExecution } from '../../services/api';
import { LANGUAGES } from '../../utils/languageConfig';
import Editor from '@monaco-editor/react';
import AuthModal from '../Auth/AuthModal';
import ChatPanel from '../Chat/ChatPanel';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Patterns that indicate code needs user input
const INPUT_PATTERNS = {
  python: /\binput\s*\(/,
  javascript: /\breadline\b|\bprompt\s*\(|process\.stdin/,
  typescript: /\breadline\b|\bprompt\s*\(|process\.stdin/,
  java: /\bScanner\b|\bBufferedReader\b|\bSystem\.in\b/,
  cpp: /\bcin\b|\bgetline\b|\bscanf\b/,
  c: /\bscanf\b|\bgets\b|\bfgets\b|\bgetchar\b/,
  csharp: /\bConsole\.Read/,
  go: /\bfmt\.Scan|\bbufio\.NewReader|\bos\.Stdin/,
  rust: /\bstdin\b|\bread_line\b/,
  ruby: /\bgets\b|\bSTDIN/,
  php: /\bfgets\s*\(\s*STDIN|\breadline\b|\bfscanf\s*\(\s*STDIN/,
  swift: /\breadLine\b/,
  perl: /\b<STDIN>|\bchomp/,
  lua: /\bio\.read/,
  scala: /\bscala\.io\.StdIn|\breadLine\b/,
  haskell: /\bgetLine\b|\bgetChar\b|\binteract\b/,
  bash: /\bread\b/,
};

// Language dot color map
const DOT_CLASS = {
  python: 'dot-py', javascript: 'dot-js', typescript: 'dot-ts',
  java: 'dot-java', cpp: 'dot-cpp', c: 'dot-c', csharp: 'dot-cs',
  go: 'dot-go', rust: 'dot-rust', ruby: 'dot-ruby', php: 'dot-php',
  swift: 'dot-swift',
};

const FILE_NAMES = {
  python: 'main.py', javascript: 'main.js', typescript: 'main.ts',
  java: 'Main.java', cpp: 'main.cpp', c: 'main.c', csharp: 'Main.cs',
  go: 'main.go', rust: 'main.rs', ruby: 'main.rb', php: 'main.php',
  swift: 'main.swift', perl: 'main.pl', lua: 'main.lua', scala: 'Main.scala',
  haskell: 'Main.hs', sql: 'query.sql', bash: 'script.sh',
};

export default function EditorPage({ user }) {
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'

  // Editor state
  const [code, setCode] = useState(LANGUAGES.python.template);
  const [language, setLanguage] = useState('python');
  const [fontSize, setFontSize] = useState(14);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  // Output state
  const [activeOutputTab, setActiveOutputTab] = useState('stdout');
  const [stdout, setStdout] = useState('');
  const [stderr, setStderr] = useState('');
  const [stdinValue, setStdinValue] = useState('');
  const [execStatus, setExecStatus] = useState({ type: 'idle', text: 'Idle' });
  const [execTime, setExecTime] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [stdinOpen, setStdinOpen] = useState(false);

  // Detect if code uses input functions
  const needsInput = useMemo(() => {
    const pattern = INPUT_PATTERNS[language];
    return pattern ? pattern.test(code) : false;
  }, [code, language]);

  // Auto-open stdin panel when input functions detected
  useEffect(() => {
    if (needsInput && !stdinOpen) setStdinOpen(true);
  }, [needsInput]);

  // AI state
  const [aiResponse, setAiResponse] = useState(null);
  const [isAILoading, setIsAILoading] = useState(false);

  // Room state
  const [roomId, setRoomId] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [joinId, setJoinId] = useState('');

  // Language change
  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    setCode(LANGUAGES[lang].template);
  };

  // Editor mount
  const handleEditorMount = (editor) => {
    editorRef.current = editor;
    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({ line: e.position.lineNumber, col: e.position.column });
    });
    editor.addCommand(2048 | 3, () => handleRun()); // Ctrl+Enter
  };

  // Room sync
  useEffect(() => {
    if (!roomId) return;
    const unsub = onSnapshot(doc(db, 'rooms', roomId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.code !== undefined && data._lastEditor !== user?.uid) setCode(data.code);
        if (data.language) setLanguage(data.language);
        setActiveUsers(data.activeUsers || []);
      }
    });
    return unsub;
  }, [roomId, user]);

  useEffect(() => {
    if (!roomId || !user) return;
    const timer = setTimeout(() => {
      updateDoc(doc(db, 'rooms', roomId), {
        code, language, _lastEditor: user.uid, updatedAt: serverTimestamp(),
      }).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [code, language, roomId, user]);

  // Create/Join Room
  const handleCreateRoom = async () => {
    if (!user) { setShowAuth(true); return; }
    const id = crypto.randomUUID().slice(0, 8);
    await setDoc(doc(db, 'rooms', id), {
      name: `Room ${id}`, createdBy: user.uid, code, language,
      activeUsers: [{ uid: user.uid, displayName: user.displayName }],
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
    setRoomId(id);
    toast.success(`Room created! ID: ${id}`);
    navigator.clipboard.writeText(id);
  };

  const handleJoinRoom = () => {
    if (!user) { setShowAuth(true); return; }
    if (joinId.trim()) { setRoomId(joinId.trim()); toast.success(`Joined room: ${joinId.trim()}`); setShowJoin(false); setJoinId(''); }
  };

  // Run code
  const handleRun = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setActiveOutputTab('stdout');
    setExecStatus({ type: 'running', text: 'Running' });
    setStdout(''); setStderr(''); setExecTime(null);

    const startTime = performance.now();
    try {
      const langConfig = LANGUAGES[language];
      const result = await executeCode(code, langConfig.id, stdinValue);
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
      setExecTime(elapsed + 's');
      setStdout(result.stdout || '(No output)');
      setStderr(result.stderr || '');

      if (result.status?.id === 3) {
        setExecStatus({ type: 'success', text: 'Success' });
      } else {
        setExecStatus({ type: 'error', text: result.status?.description || 'Error' });
        if (result.stderr) setActiveOutputTab('stderr');
        // Auto-explain errors
        setIsAILoading(true);
        try {
          const explanation = await explainError(code, result.stderr || result.compile_output || '', langConfig.name);
          setAiResponse(explanation);
          setActiveOutputTab('ai');
        } catch {} finally { setIsAILoading(false); }
      }
    } catch (err) {
      setStderr(err.message);
      setExecStatus({ type: 'error', text: 'Failed' });
      setActiveOutputTab('stderr');
    }
    setIsRunning(false);
  }, [code, language, isRunning, stdinValue]);

  // AI actions
  const handleFix = useCallback(async () => {
    setIsAILoading(true); setActiveOutputTab('ai');
    try {
      const result = await fixCode(code, stderr, LANGUAGES[language].name);
      if (result.fixedCode) { setCode(result.fixedCode); toast.success('Code fixed!'); }
      setAiResponse(result);
    } catch { toast.error('Fix failed'); }
    setIsAILoading(false);
  }, [code, language, stderr]);

  const handleExplain = useCallback(async () => {
    setIsAILoading(true); setActiveOutputTab('ai');
    try {
      const sel = editorRef.current?.getSelection();
      const selectedCode = (sel && !sel.isEmpty()) ? editorRef.current.getModel().getValueInRange(sel) : code;
      const result = await explainLogic(selectedCode, LANGUAGES[language].name);
      setAiResponse(result);
    } catch { toast.error('Explain failed'); }
    setIsAILoading(false);
  }, [code, language]);

  const handleVisualize = useCallback(async () => {
    setIsAILoading(true); setActiveOutputTab('ai');
    try {
      const result = await visualizeExecution(code, LANGUAGES[language].name);
      setAiResponse(result);
    } catch { toast.error('Visualization failed'); }
    setIsAILoading(false);
  }, [code, language]);

  const handleTests = useCallback(async () => {
    setIsAILoading(true); setActiveOutputTab('ai');
    try {
      const result = await generateTestCases(code, LANGUAGES[language].name);
      setAiResponse(result);
    } catch { toast.error('Test generation failed'); }
    setIsAILoading(false);
  }, [code, language]);

  const handleClear = () => {
    setStdout(''); setStderr(''); setAiResponse(null);
    setExecStatus({ type: 'idle', text: 'Idle' }); setExecTime(null);
    setActiveOutputTab('stdout');
  };

  // Download code as file
  const handleDownload = () => {
    const filename = FILE_NAMES[language] || 'code.txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  // Save code to Firestore
  const handleSave = async () => {
    if (!user) { setShowAuth(true); toast.error('Sign in to save code'); return; }
    try {
      await addDoc(collection(db, 'users', user.uid, 'savedCode'), {
        code, language, name: FILE_NAMES[language] || 'code.txt',
        createdAt: serverTimestamp(),
      });
      toast.success('Code saved to cloud! ☁️');
    } catch (err) { toast.error('Save failed'); }
  };

  const langConfig = LANGUAGES[language];

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* ===== TOP BAR ===== */}
      <div className="topbar">
        <div className="topbar-left">
          <button onClick={() => navigate('/')} className="topbar-logo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#8b5cf6"/></svg>
            <span>Debugra</span>
          </button>
          <div className="topbar-sep" />
          <span className="topbar-title">Code Editor</span>
          {roomId && (
            <>
              <div className="topbar-sep" />
              <span className="topbar-title" style={{ color: '#4ec9b0' }}>
                🟢 Room: {roomId} ({activeUsers.length} online)
              </span>
              <button className="topbar-link" onClick={() => { navigator.clipboard.writeText(roomId); toast.success('Copied!'); }}>
                Copy ID
              </button>
            </>
          )}
        </div>
        <div className="topbar-right">
          {!roomId && (
            <div className="room-controls" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button className="topbar-link" onClick={handleCreateRoom}>+ New Room</button>
              {showJoin ? (
                <>
                  <input value={joinId} onChange={(e) => setJoinId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                    placeholder="Room ID" style={{
                      background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text-0)',
                      borderRadius: '4px', padding: '3px 8px', fontSize: '0.7rem', width: '80px', outline: 'none',
                      fontFamily: 'Inter, sans-serif',
                    }} autoFocus />
                  <button className="topbar-link" onClick={handleJoinRoom}>Join</button>
                  <button className="topbar-link" onClick={() => setShowJoin(false)}>✕</button>
                </>
              ) : (
                <button className="topbar-link" onClick={() => setShowJoin(true)}>Join Room</button>
              )}
            </div>
          )}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button className="topbar-link" onClick={() => { signOut(auth); toast.success('Logged out'); }} style={{ marginRight: '4px' }}>Log Out</button>
              <div style={{
                width: '22px', height: '22px', borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700,
                background: 'var(--accent)', color: 'white',
              }}>
                {user.displayName?.[0]?.toUpperCase() || '?'}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-1)' }}>
                {user.displayName || user.email?.split('@')[0]}
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="topbar-link" onClick={() => { setAuthMode('login'); setShowAuth(true); }}>Sign In</button>
              <button className="topbar-link" style={{ background: '#8b5cf6', color: 'white', border: 'none' }} onClick={() => { setAuthMode('signup'); setShowAuth(true); }}>Sign Up</button>
            </div>
          )}
        </div>
      </div>

      {/* ===== TOOLBAR ===== */}
      <div className="toolbar">
        <div className="toolbar-left">
          <select className="lang-select" value={language} onChange={handleLanguageChange}>
            {Object.entries(LANGUAGES).map(([key, lang]) => (
              <option key={key} value={key}>{lang.name}</option>
            ))}
          </select>
          <div className="font-size-ctrl">
            <button onClick={() => fontSize > 10 && setFontSize(f => f - 1)}>−</button>
            <span>{fontSize}px</span>
            <button onClick={() => fontSize < 28 && setFontSize(f => f + 1)}>+</button>
          </div>
        </div>
        <div className="toolbar-right">
          <button className="ai-btn" onClick={handleTests} disabled={isAILoading}>Tests</button>
          <button className="ai-btn" onClick={handleVisualize} disabled={isAILoading}>Visualize</button>
          <button className="ai-btn" onClick={handleExplain} disabled={isAILoading}>Explain</button>
          <button className="ai-btn fix" onClick={handleFix} disabled={isAILoading}>Fix</button>
          <button className="topbar-link" onClick={handleDownload} title="Download code file">Download</button>
          <button className="topbar-link" onClick={handleSave} title="Save to cloud (requires login)">Save</button>
          <span className="kbd-hint">Ctrl+Enter</span>
          <button className="clear-btn" onClick={handleClear}>Clear</button>
          <button className="run-btn" onClick={handleRun} disabled={isRunning}>
            {isRunning ? (
              <><span className="spinner" /> Running...</>
            ) : (
              <><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Run</>
            )}
          </button>
        </div>
      </div>

      {/* ===== MAIN SPLIT ===== */}
      <div className="main-split">
        {/* EDITOR PANE */}
        <div className="editor-pane">
          <div className="editor-tab-bar">
            <div className="editor-tab">
              <span className={`dot ${DOT_CLASS[language] || 'dot-default'}`} />
              <span>{FILE_NAMES[language] || 'main.txt'}</span>
            </div>
          </div>
          <div id="editor-container" style={{ flex: 1, minHeight: 0 }}>
            <Editor
              height="100%"
              language={langConfig.monacoLang}
              value={code}
              onChange={(val) => setCode(val || '')}
              onMount={handleEditorMount}
              theme="vs-dark"
              options={{
                fontSize, fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: { enabled: false }, padding: { top: 12 },
                scrollBeyondLastLine: false, lineNumbers: 'on',
                renderLineHighlight: 'line', automaticLayout: true,
                tabSize: 4, wordWrap: 'on', smoothScrolling: true,
                cursorBlinking: 'smooth', cursorSmoothCaretAnimation: 'on',
                bracketPairColorization: { enabled: true },
                guides: { bracketPairs: true },
                suggestOnTriggerCharacters: true, quickSuggestions: true,
                formatOnPaste: true,
              }}
            />
          </div>

          {/* ===== STDIN INPUT PANEL ===== */}
          <div style={{
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-1)',
            flexShrink: 0,
          }}>
            <button
              onClick={() => setStdinOpen(!stdinOpen)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer',
                color: needsInput ? '#dcdcaa' : 'var(--text-2)', fontFamily: "'Inter', sans-serif",
                fontSize: '0.72rem', fontWeight: 600, transition: 'color 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {needsInput && (
                  <span style={{
                    width: '6px', height: '6px', borderRadius: '50%', background: '#dcdcaa',
                    boxShadow: '0 0 6px rgba(220,220,170,0.6)',
                    animation: 'pulse-dot 1.5s ease-in-out infinite',
                  }} />
                )}
                <span>User Input (stdin)</span>
                {needsInput && <span style={{ fontSize: '0.62rem', color: '#ce9178', fontWeight: 400 }}>-- input detected in code</span>}
              </div>
              <span style={{ fontSize: '0.7rem', transition: 'transform 0.2s', transform: stdinOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
            </button>
            {stdinOpen && (
              <div style={{ padding: '0 12px 10px' }}>
                <textarea
                  className="stdin-input"
                  value={stdinValue}
                  onChange={(e) => setStdinValue(e.target.value)}
                  placeholder={needsInput
                    ? 'Type your input here (one value per line)...\nExample:\n5\nHello'
                    : 'Enter input for your program (if needed)...'
                  }
                  style={{
                    width: '100%', minHeight: '60px', maxHeight: '120px', resize: 'vertical',
                    background: 'var(--bg-2)', border: needsInput ? '1px solid rgba(220,220,170,0.3)' : '1px solid var(--border)',
                    borderRadius: '4px', color: 'var(--text-0)',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem',
                    padding: '8px', outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={(e) => e.target.style.borderColor = needsInput ? 'rgba(220,220,170,0.3)' : 'var(--border)'}
                />
                {needsInput && !stdinValue.trim() && (
                  <p style={{ fontSize: '0.65rem', color: '#f44747', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ⚠ Your code requires input — enter values above before running
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RESIZE HANDLE */}
        <div className="resize-handle" />

        {/* OUTPUT PANE */}
        <div className="output-pane">
          <div className="output-tabs">
            <button className={`output-tab ${activeOutputTab === 'stdout' ? 'active' : ''}`}
              onClick={() => setActiveOutputTab('stdout')}>Output</button>
            {stderr && (
              <button className={`output-tab ${activeOutputTab === 'stderr' ? 'active' : ''}`}
                onClick={() => setActiveOutputTab('stderr')}>
                <span style={{ color: activeOutputTab === 'stderr' ? '#f44747' : undefined }}>⚠ Errors</span>
              </button>
            )}
            {(aiResponse || isAILoading) && (
              <button className={`output-tab ${activeOutputTab === 'ai' ? 'active' : ''}`}
                onClick={() => setActiveOutputTab('ai')}>
                <span>AI {isAILoading && <span className="spinner" style={{ width: '8px', height: '8px', borderWidth: '1.5px', marginLeft: '4px' }} />}</span>
              </button>
            )}
          </div>

          <div className="output-content">
            {/* STDOUT */}
            <div className={`output-panel ${activeOutputTab === 'stdout' ? 'active' : ''}`} id="output-stdout">
              {stdout ? stdout : <span className="output-placeholder">Run your code to see output here.</span>}
            </div>

            {/* STDERR */}
            <div className={`output-panel ${activeOutputTab === 'stderr' ? 'active' : ''}`} id="output-stderr">
              {stderr || <span className="output-placeholder">No errors.</span>}
            </div>

            {/* AI */}
            <div className={`output-panel ${activeOutputTab === 'ai' ? 'active' : ''}`}
              style={{ display: activeOutputTab === 'ai' ? 'block' : 'none', fontFamily: "'Inter', sans-serif" }}>
              {isAILoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <span className="spinner" style={{ width: '24px', height: '24px', borderWidth: '3px' }} />
                  <p style={{ color: 'var(--text-2)', marginTop: '12px', fontSize: '0.8rem' }}>AI is analyzing...</p>
                </div>
              ) : aiResponse ? (
                <div>
                  {aiResponse.issue && (
                    <div className="ai-card error">
                      <div className="ai-card-label">Issue</div>
                      <div className="ai-card-content">{aiResponse.issue}</div>
                    </div>
                  )}
                  {aiResponse.explanation && (
                    <div className="ai-card info">
                      <div className="ai-card-label">Explanation</div>
                      <div className="ai-card-content">{aiResponse.explanation}</div>
                    </div>
                  )}
                  {aiResponse.fix && (
                    <div className="ai-card success">
                      <div className="ai-card-label">Fix</div>
                      <div className="ai-card-content">{aiResponse.fix}</div>
                    </div>
                  )}
                  {aiResponse.fixedCode && (
                    <div className="ai-card">
                      <div className="ai-card-label" style={{ color: 'var(--green)' }}>Fixed Code</div>
                      <pre style={{ fontSize: '0.75rem', color: 'var(--text-0)', whiteSpace: 'pre-wrap', fontFamily: "'JetBrains Mono', monospace" }}>
                        {aiResponse.fixedCode}
                      </pre>
                    </div>
                  )}
                  {aiResponse.steps && Array.isArray(aiResponse.steps) && aiResponse.steps.map((step, i) => (
                    <div key={i} className="ai-card">
                      <div className="ai-card-label" style={{ color: 'var(--accent)' }}>Step {i + 1}{step.line ? ` — Line ${step.line}` : ''}</div>
                      <div className="ai-card-content">{step.description || step.action || JSON.stringify(step)}</div>
                      {step.variables && (
                        <code style={{ fontSize: '0.7rem', color: 'var(--yellow)', display: 'block', marginTop: '4px' }}>
                          {typeof step.variables === 'string' ? step.variables : JSON.stringify(step.variables)}
                        </code>
                      )}
                    </div>
                  ))}
                  {aiResponse.testCases && Array.isArray(aiResponse.testCases) && aiResponse.testCases.map((tc, i) => (
                    <div key={i} className="ai-card">
                      <div className="ai-card-label" style={{ color: 'var(--green)' }}>
                        Test {i + 1} <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>({tc.type || 'normal'})</span>
                      </div>
                      <div className="ai-card-content">
                        <div>Input: <code style={{ color: 'var(--text-0)' }}>{tc.input}</code></div>
                        <div>Expected: <code style={{ color: 'var(--green)' }}>{tc.expected}</code></div>
                        {tc.description && <div style={{ marginTop: '4px', color: 'var(--text-2)' }}>{tc.description}</div>}
                      </div>
                    </div>
                  ))}
                  {aiResponse.complexity && (
                    <div className="ai-card info">
                      <div className="ai-card-label">Complexity</div>
                      <div className="ai-card-content">
                        Time: <strong style={{ color: 'var(--text-0)' }}>{aiResponse.complexity.time}</strong> | 
                        Space: <strong style={{ color: 'var(--text-0)' }}>{aiResponse.complexity.space}</strong>
                      </div>
                    </div>
                  )}
                  {!aiResponse.issue && !aiResponse.explanation && !aiResponse.steps && !aiResponse.testCases && !aiResponse.fixedCode && !aiResponse.complexity && (
                    <pre style={{ fontSize: '0.75rem', color: 'var(--text-1)', whiteSpace: 'pre-wrap' }}>{JSON.stringify(aiResponse, null, 2)}</pre>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-2)' }}>
                  <p style={{ fontSize: '0.85rem' }}>AI Assistant</p>
                  <p style={{ fontSize: '0.72rem', marginTop: '8px' }}>Use toolbar buttons: Tests, Visualize, Explain, Fix</p>
                </div>
              )}
            </div>
          </div>

          {/* Execution info */}
          <div className="exec-info">
            <div className="exec-item">
              Status: <span className={`status-badge status-${execStatus.type}`}>{execStatus.text}</span>
            </div>
            {execTime && (
              <div className="exec-item">Time: <strong>{execTime}</strong></div>
            )}
          </div>
        </div>
      </div>

      {/* ===== STATUS BAR ===== */}
      <div className="statusbar">
        <div className="statusbar-left">
          <span>{langConfig.name}</span>
          <span>UTF-8</span>
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
        </div>
        <div className="statusbar-right">
          <span>Wandbox API</span>
          <span>Debugra Editor</span>
        </div>
      </div>

      {/* Chat */}
      <ChatPanel roomId={roomId} user={user} isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} initialMode={authMode} />}
    </div>
  );
}
