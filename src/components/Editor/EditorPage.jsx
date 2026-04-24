import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { doc, setDoc, onSnapshot, updateDoc, serverTimestamp, collection, addDoc, getDocs, query, orderBy, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../services/firebase';
import { executeCode, explainError, fixCode, explainLogic, generateTestCases, visualizeExecution } from '../../services/api';
import { LANGUAGES } from '../../utils/languageConfig';
import Editor from '@monaco-editor/react';
import AuthModal from '../Auth/AuthModal';
import ChatPanel from '../Chat/ChatPanel';
import HistoryPanel from './HistoryPanel';
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
  const [outputWidth, setOutputWidth] = useState(420);
  const resizingRef = useRef(false);

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
  const [roomData, setRoomData] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [joinId, setJoinId] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  // Derived Access Control
  const isAuthor = roomData?.createdBy === user?.uid;
  const isAllowedEditor = roomData?.allowedEditors?.includes(user?.uid);
  const isCurrentEditor = roomData?.currentEditor === user?.uid;
  const isReadOnly = roomId ? !isCurrentEditor : false;
  const currentEditorName = activeUsers.find(u => u.uid === roomData?.currentEditor)?.displayName || 'None';

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
        setRoomData(data);
        if (data.code !== undefined && data._lastEditor !== user?.uid) setCode(data.code);
        if (data.language) setLanguage(data.language);
        if (data.stdin !== undefined && data._lastEditor !== user?.uid) setStdinValue(data.stdin);
        setActiveUsers(data.activeUsers || []);
      }
    });
    return unsub;
  }, [roomId, user]);

  useEffect(() => {
    if (!roomId || !user || !roomData) return;
    // Strictly ONLY auto-save if this user currently holds the editor lock
    if (roomData.currentEditor !== user.uid) return;
    
    const timer = setTimeout(() => {
      updateDoc(doc(db, 'rooms', roomId), {
        code, language, stdin: stdinValue, _lastEditor: user.uid, updatedAt: serverTimestamp(),
      }).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [code, language, stdinValue, roomId, user, roomData?.currentEditor]);

  // Create/Join Room
  const handleCreateRoom = async () => {
    if (!user) { setShowAuth(true); return; }
    const id = crypto.randomUUID().slice(0, 8);
    await setDoc(doc(db, 'rooms', id), {
      name: `Room ${id}`, createdBy: user.uid, code, language,
      activeUsers: [{ uid: user.uid, displayName: user.displayName }],
      allowedEditors: [user.uid],
      currentEditor: user.uid,
      editRequests: [],
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

  // Access Control Actions
  const handleRequestAccess = async () => {
    if (!user || !roomId || !roomData) return;
    if (roomData.editRequests?.some(r => r.uid === user.uid)) {
      toast.error('Access request already sent.');
      return;
    }
    const newRequests = [...(roomData.editRequests || []), { uid: user.uid, displayName: user.displayName }];
    await updateDoc(doc(db, 'rooms', roomId), { editRequests: newRequests });
    toast.success('Requested edit access from the author.');
  };

  const handleApproveAccess = async (requestUid) => {
    if (!roomId || !roomData || !isAuthor) return;
    const newAllowed = [...new Set([...(roomData.allowedEditors || []), requestUid])];
    const newRequests = (roomData.editRequests || []).filter(r => r.uid !== requestUid);
    await updateDoc(doc(db, 'rooms', roomId), { allowedEditors: newAllowed, editRequests: newRequests });
    toast.success('Access granted.');
  };

  const handleDenyAccess = async (requestUid) => {
    if (!roomId || !roomData || !isAuthor) return;
    const newRequests = (roomData.editRequests || []).filter(r => r.uid !== requestUid);
    await updateDoc(doc(db, 'rooms', roomId), { editRequests: newRequests });
    toast.info('Access denied.');
  };

  const handleTakeControl = async () => {
    if (!user || !roomId || !isAllowedEditor) return;
    await updateDoc(doc(db, 'rooms', roomId), { currentEditor: user.uid });
    toast.success('You are now editing.');
  };

  const handleReleaseControl = async () => {
    if (!user || !roomId || !isCurrentEditor) return;
    await updateDoc(doc(db, 'rooms', roomId), { currentEditor: null });
    toast.success('You released the editor lock.');
  };

  const handleRevokeAccess = async (revokeUid) => {
    if (!roomId || !roomData || !isAuthor) return;
    const newAllowed = (roomData.allowedEditors || []).filter(uid => uid !== revokeUid);
    const updates = { allowedEditors: newAllowed };
    if (roomData.currentEditor === revokeUid) updates.currentEditor = null;
    await updateDoc(doc(db, 'rooms', roomId), updates);
    toast.info('Access revoked.');
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
        // AI explain removed — user can click "Fix" or "Explain" manually to save tokens
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

  // Output pane resize handler
  const handleResizeStart = (e) => {
    e.preventDefault();
    resizingRef.current = true;
    const startX = e.clientX;
    const startW = outputWidth;
    const onMove = (ev) => {
      if (!resizingRef.current) return;
      const diff = startX - ev.clientX;
      setOutputWidth(Math.max(260, Math.min(800, startW + diff)));
    };
    const onUp = () => { resizingRef.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleLoadFromHistory = (histCode, histLang) => {
    setCode(histCode);
    if (histLang && LANGUAGES[histLang]) setLanguage(histLang);
  };

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
          <select className="lang-select" value={language} onChange={handleLanguageChange} disabled={isReadOnly}>
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
          <button className="ai-btn" onClick={handleTests} disabled={isAILoading || isReadOnly}>Tests</button>
          <button className="ai-btn" onClick={handleVisualize} disabled={isAILoading}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            Visualize
          </button>
          <button className="ai-btn" onClick={handleExplain} disabled={isAILoading}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            Explain
          </button>
          <button className="ai-btn fix" onClick={handleFix} disabled={isAILoading || isReadOnly}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            Fix
          </button>
          <button className="toolbar-icon-btn" onClick={handleDownload} title="Download code file">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
          <button className="toolbar-icon-btn" onClick={handleSave} title="Save to cloud" disabled={isReadOnly}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          </button>
          {user && (
            <button className="toolbar-icon-btn" onClick={() => setShowHistory(!showHistory)} title="Saved code history" style={showHistory ? { background: 'var(--bg-active)', color: 'var(--accent)' } : {}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </button>
          )}
          <span className="kbd-hint">Ctrl+Enter</span>
          <button className="clear-btn" onClick={handleClear} disabled={isReadOnly}>Clear</button>
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

            {/* Access Control UI */}
            {roomId && (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', overflowX: 'auto', whiteSpace: 'nowrap', maxWidth: '60vw', paddingBottom: '2px' }} className="hide-scrollbar">
                {isAuthor && roomData?.editRequests?.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', marginRight: '8px', paddingRight: '8px', borderRight: '1px solid var(--border)' }}>
                    {roomData.editRequests.map(req => (
                      <div key={req.uid} style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-3)', padding: '2px 6px', borderRadius: '4px', gap: '6px' }}>
                        <span style={{ color: 'var(--yellow)' }}>{req.displayName} requests edit</span>
                        <button onClick={() => handleApproveAccess(req.uid)} style={{ color: '#3fb950', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} title="Approve">✓</button>
                        <button onClick={() => handleDenyAccess(req.uid)} style={{ color: '#f44747', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} title="Deny">✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Show allowed editors to the Author so they can kick them */}
                {isAuthor && roomData?.allowedEditors?.length > 1 && (
                  <div style={{ display: 'flex', gap: '6px', marginRight: '8px', paddingRight: '8px', borderRight: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-2)', marginRight: '2px' }}>Allowed:</span>
                    {roomData.allowedEditors.filter(uid => uid !== user.uid).map(uid => {
                      const editorName = activeUsers.find(u => u.uid === uid)?.displayName || 'Guest';
                      return (
                        <div key={uid} style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-1)', padding: '2px 6px', borderRadius: '4px', gap: '4px' }}>
                          <span style={{ color: 'var(--text-0)' }}>{editorName}</span>
                          <button onClick={() => handleRevokeAccess(uid)} style={{ color: '#f44747', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '0.6rem' }} title="Revoke Access">✕</button>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                <span style={{ color: 'var(--text-2)' }}>Editor: <strong style={{ color: isCurrentEditor ? 'var(--green)' : 'var(--accent)' }}>{isCurrentEditor ? 'You' : currentEditorName}</strong></span>
                
                {isReadOnly && !isAllowedEditor && (
                  <button onClick={handleRequestAccess} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', flexShrink: 0 }}>
                    Request Access
                  </button>
                )}
                
                {isReadOnly && isAllowedEditor && (
                  <button onClick={handleTakeControl} style={{ background: '#2ea043', color: '#fff', border: 'none', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', flexShrink: 0 }}>
                    Take Control
                  </button>
                )}

                {isCurrentEditor && (
                  <button onClick={handleReleaseControl} style={{ background: 'var(--bg-3)', color: 'var(--text-1)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', flexShrink: 0 }}>
                    Release
                  </button>
                )}
              </div>
            )}
          </div>
          <div id="editor-container" style={{ flex: 1, minHeight: 0, opacity: isReadOnly ? 0.8 : 1 }}>
            {isReadOnly && (
              <div style={{ position: 'absolute', top: '10px', right: '20px', zIndex: 10, background: 'rgba(0,0,0,0.5)', padding: '4px 10px', borderRadius: '4px', color: '#ccc', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', pointerEvents: 'none', border: '1px solid rgba(255,255,255,0.1)' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> Read Only
              </div>
            )}
            <Editor
              height="100%"
              language={langConfig.monacoLang}
              value={code}
              onChange={(val) => { if (!isReadOnly) setCode(val || ''); }}
              onMount={handleEditorMount}
              theme="vs-dark"
              options={{
                readOnly: isReadOnly,
                fontSize, fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: { enabled: false }, padding: { top: 12 },
                scrollBeyondLastLine: false, lineNumbers: 'on',
                renderLineHighlight: isReadOnly ? 'none' : 'line', automaticLayout: true,
                tabSize: 4, wordWrap: 'on', smoothScrolling: true,
                cursorBlinking: isReadOnly ? 'solid' : 'smooth', cursorSmoothCaretAnimation: 'on',
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
        <div className="resize-handle" onMouseDown={handleResizeStart} />

        {/* HISTORY PANEL */}
        {showHistory && user && (
          <HistoryPanel user={user} onLoadCode={handleLoadFromHistory} onClose={() => setShowHistory(false)} />
        )}

        {/* OUTPUT PANE */}
        <div className="output-pane" style={{ width: outputWidth + 'px' }}>
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
                  {aiResponse.steps && Array.isArray(aiResponse.steps) && (
                    <div style={{ marginBottom: '10px' }}>
                      <div className="ai-card-label" style={{ color: 'var(--accent)', marginBottom: '8px', fontSize: '0.7rem' }}>
                        ▶ Execution Trace ({aiResponse.steps.length} steps)
                      </div>
                      {aiResponse.steps.map((step, i) => {
                        // Handle both string steps and object steps
                        const isString = typeof step === 'string';
                        const line = isString ? null : step.line;
                        const code = isString ? null : step.code;
                        const desc = isString ? step : (step.description || step.explanation || step.action || '');
                        const vars = isString ? null : step.variables;
                        return (
                          <div key={i} className="ai-card" style={{ padding: '8px 10px', marginBottom: '6px', borderLeftColor: 'var(--accent)', borderLeftWidth: '3px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                              {line && <span style={{ fontSize: '0.62rem', color: 'var(--text-2)', fontFamily: "'JetBrains Mono', monospace" }}>Line {line}</span>}
                            </div>
                            {code && (
                              <pre style={{ fontSize: '0.72rem', color: 'var(--yellow)', fontFamily: "'JetBrains Mono', monospace", margin: '4px 0', padding: '4px 8px', background: 'var(--bg-0)', borderRadius: '3px', whiteSpace: 'pre-wrap' }}>{code}</pre>
                            )}
                            {desc && <div className="ai-card-content" style={{ fontSize: '0.72rem' }}>{desc}</div>}
                            {vars && (
                              <div style={{ marginTop: '4px', padding: '4px 8px', background: 'rgba(78,201,176,0.08)', borderRadius: '3px', border: '1px solid rgba(78,201,176,0.15)' }}>
                                <span style={{ fontSize: '0.6rem', color: 'var(--green)', fontWeight: 600 }}>Variables: </span>
                                <code style={{ fontSize: '0.68rem', color: 'var(--yellow)', fontFamily: "'JetBrains Mono', monospace" }}>
                                  {typeof vars === 'string' ? vars : Object.entries(vars).map(([k,v]) => `${k} = ${JSON.stringify(v)}`).join(', ')}
                                </code>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
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
                  {(aiResponse.complexity || aiResponse.timeComplexity) && (
                    <div className="ai-card info">
                      <div className="ai-card-label">Complexity</div>
                      <div className="ai-card-content">
                        Time: <strong style={{ color: 'var(--text-0)' }}>{aiResponse.complexity?.time || aiResponse.timeComplexity || 'N/A'}</strong> | 
                        Space: <strong style={{ color: 'var(--text-0)' }}>{aiResponse.complexity?.space || aiResponse.spaceComplexity || 'N/A'}</strong>
                      </div>
                    </div>
                  )}
                  {aiResponse.summary && (
                    <div className="ai-card" style={{ borderColor: 'rgba(78,201,176,0.3)' }}>
                      <div className="ai-card-label" style={{ color: 'var(--green)' }}>Summary</div>
                      <div className="ai-card-content">{aiResponse.summary}</div>
                    </div>
                  )}
                  {aiResponse.bestPractice && (
                    <div className="ai-card" style={{ borderColor: 'rgba(220,220,170,0.3)' }}>
                      <div className="ai-card-label" style={{ color: 'var(--yellow)' }}>💡 Best Practice</div>
                      <div className="ai-card-content">{aiResponse.bestPractice}</div>
                    </div>
                  )}
                  {!aiResponse.issue && !aiResponse.explanation && !aiResponse.steps && !aiResponse.testCases && !aiResponse.fixedCode && !aiResponse.complexity && !aiResponse.timeComplexity && !aiResponse.summary && (
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
            {stderr && execStatus.type === 'error' && (
              <div className="exec-item" style={{ color: 'var(--red)', fontSize: '0.65rem' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                See Errors tab for details
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== STATUS BAR (VS Code style) ===== */}
      <div className="statusbar">
        <div className="statusbar-left">
          <span title={execStatus.text}>
            {execStatus.type === 'error' ? (
              <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f44747" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> 1</>
            ) : execStatus.type === 'success' ? (
              <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3fb950" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> 0</>
            ) : (
              <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> 0</>
            )}
          </span>
          <span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg>
            {langConfig.name}
          </span>
          <span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>
            UTF-8
          </span>
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          <span>Spaces: 4</span>
        </div>
        <div className="statusbar-right">
          {roomId && <span style={{ color: '#4ec9b0' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            {activeUsers.length} online
          </span>}
          <span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            Wandbox
          </span>
          <span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="rgba(255,255,255,0.8)"/></svg>
            Debugra
          </span>
        </div>
      </div>

      {/* Chat */}
      <ChatPanel roomId={roomId} user={user} isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} initialMode={authMode} />}
    </div>
  );
}
