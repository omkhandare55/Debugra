import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, googleProvider } from '../../services/firebase';
import toast from 'react-hot-toast';

export default function LandingPage() {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Welcome!');
      navigate('/editor');
    } catch (err) { toast.error(err.message); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name) await updateProfile(cred.user, { displayName: name });
        toast.success('Account created!');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Welcome back!');
      }
      navigate('/editor');
    } catch (err) { toast.error(err.message); }
    setLoading(false);
  };

  const features = [
    { color: '#e2e8f0', title: 'Error Explainer', desc: 'Get instant explanations for every error with the exact fix.' },
    { color: '#e2e8f0', title: 'One-Click Fix', desc: 'Replaces buggy code with a working, optimized version instantly.' },
    { color: '#e2e8f0', title: 'Logic Breakdown', desc: 'Step-by-step logic analysis with time and space complexity.' },
    { color: '#e2e8f0', title: 'Execution Visualizer', desc: 'Watch variables change line-by-line as your code runs.' },
    { color: '#e2e8f0', title: 'Test Case Generator', desc: 'Auto-generate edge cases to validate your solution.' },
    { color: '#e2e8f0', title: 'Real-Time Collab', desc: 'Code together with live sync, rooms, and team chat.' },
    { color: '#e2e8f0', title: 'Save & Download', desc: 'Sign in to save code to cloud and download files anytime.' },
    { color: '#e2e8f0', title: '18+ Languages', desc: 'Python, JS, C++, Java, Go, Rust, Ruby, Swift and more.' },
    { color: '#e2e8f0', title: 'VS Code Experience', desc: 'Monaco Editor with syntax highlighting, autocomplete, and themes.' },
  ];

  const languages = ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Perl', 'Lua', 'Scala', 'Haskell', 'SQL', 'Bash'];

  return (
    <div className="landing-root">

      {/* ===== NAVBAR ===== */}
      <nav className="landing-nav">
        <div className="landing-nav-left">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#f97316"/></svg>
          <span className="landing-logo">Debugra</span>
        </div>

        {/* Desktop nav */}
        <div className="landing-nav-right desktop-only">
          <a href="#features" className="landing-nav-link">Features</a>
          <a href="#languages" className="landing-nav-link">Languages</a>
          <button onClick={() => setShowLogin(true)} className="landing-btn-outline">Log In</button>
          <button onClick={() => { setIsSignUp(true); setShowLogin(true); }} className="landing-btn-primary">Sign Up Free</button>
        </div>

        {/* Mobile hamburger */}
        <button className="mobile-menu-btn mobile-only" onClick={() => setMobileMenu(!mobileMenu)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round">
            {mobileMenu
              ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
              : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
            }
          </svg>
        </button>
      </nav>

      {/* Mobile dropdown */}
      {mobileMenu && (
        <div className="mobile-dropdown">
          <a href="#features" className="mobile-dropdown-link" onClick={() => setMobileMenu(false)}>Features</a>
          <a href="#languages" className="mobile-dropdown-link" onClick={() => setMobileMenu(false)}>Languages</a>
          <button onClick={() => { setShowLogin(true); setMobileMenu(false); }} className="mobile-dropdown-link">Log In</button>
          <button onClick={() => { setIsSignUp(true); setShowLogin(true); setMobileMenu(false); }} className="landing-btn-primary" style={{ width: '100%', marginTop: '8px' }}>Sign Up Free</button>
        </div>
      )}

      <section className="landing-hero">
        <div className="hero-badge">Free Online Code Editor</div>
        <h1 className="hero-title">
          Write. Run. Debug.<br />
          <span style={{ color: '#e2e8f0' }}>All in One Place.</span>
        </h1>
        <p className="hero-subtitle">
          A VS Code-like editor in your browser. Run 18+ languages, get error
          explanations, and collaborate in real-time — no setup required.
        </p>
        <div className="hero-cta">
          <button onClick={() => navigate('/editor')} className="landing-btn-primary landing-btn-lg">
            Open Editor
          </button>
          <button onClick={() => setShowLogin(true)} className="landing-btn-outline landing-btn-lg">
            Sign In
          </button>
        </div>
        <p className="hero-note">Sign in to save your code, download files, and collaborate with friends</p>
      </section>

      {/* ===== EDITOR PREVIEW ===== */}
      <section className="landing-section" style={{ maxWidth: '960px' }}>
        <div className="editor-preview">
          <div className="preview-chrome">
            <div className="preview-dot" style={{ background: '#ff5f57' }} />
            <div className="preview-dot" style={{ background: '#febc2e' }} />
            <div className="preview-dot" style={{ background: '#28c840' }} />
            <span style={{ marginLeft: '12px', fontSize: '0.72rem', color: '#6a6a6a' }}>debugra — main.py — Python 3</span>
          </div>
          <div className="preview-toolbar">
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className="preview-tag">Python 3</span>
              <span style={{ fontSize: '0.65rem', color: '#6a6a6a' }}>14px</span>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span className="preview-tag">Tests</span>
              <span className="preview-tag">Explain</span>
              <span className="preview-tag" style={{ color: '#dcdcaa', borderColor: 'rgba(220,220,170,0.3)' }}>Fix</span>
              <span className="preview-run-tag">Run</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row' }} className="preview-body">
            <div className="preview-code">
              <code>
                <span style={{ color: '#6a6a6a' }}>1  </span><span style={{ color: '#569cd6' }}>def</span> <span style={{ color: '#dcdcaa' }}>two_sum</span><span style={{ color: '#d4d4d4' }}>(nums, target):</span>{'\n'}
                <span style={{ color: '#6a6a6a' }}>2  </span><span style={{ color: '#d4d4d4' }}>    seen = {'{}'}</span>{'\n'}
                <span style={{ color: '#6a6a6a' }}>3  </span><span style={{ color: '#569cd6' }}>    for</span> <span style={{ color: '#d4d4d4' }}>i, num</span> <span style={{ color: '#569cd6' }}>in</span> <span style={{ color: '#dcdcaa' }}>enumerate</span><span style={{ color: '#d4d4d4' }}>(nums):</span>{'\n'}
                <span style={{ color: '#6a6a6a' }}>4  </span><span style={{ color: '#d4d4d4' }}>        diff = target - num</span>{'\n'}
                <span style={{ color: '#6a6a6a' }}>5  </span><span style={{ color: '#569cd6' }}>        if</span> <span style={{ color: '#d4d4d4' }}>diff</span> <span style={{ color: '#569cd6' }}>in</span> <span style={{ color: '#d4d4d4' }}>seen:</span>{'\n'}
                <span style={{ color: '#6a6a6a' }}>6  </span><span style={{ color: '#d4d4d4' }}>            </span><span style={{ color: '#569cd6' }}>return</span> <span style={{ color: '#d4d4d4' }}>[seen[diff], i]</span>{'\n'}
                <span style={{ color: '#6a6a6a' }}>7  </span><span style={{ color: '#d4d4d4' }}>        seen[num] = i</span>{'\n'}
              </code>
            </div>
            <div className="preview-divider" />
            <div className="preview-output">
              <div style={{ display: 'flex', gap: '2px', marginBottom: '12px' }}>
                <span className="preview-output-tab active">Output</span>
                <span className="preview-output-tab">Errors</span>
                <span className="preview-output-tab">AI</span>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#4ec9b0', lineHeight: 1.8 }}>
                <div className="preview-success-badge">SUCCESS</div>
                <div style={{ color: '#d4d4d4' }}>[0, 1]</div>
                <div style={{ color: '#6a6a6a', fontSize: '0.68rem', marginTop: '8px' }}>Time: 0.03s</div>
              </div>
            </div>
          </div>
          <div className="preview-statusbar">
            <div style={{ display: 'flex', gap: '12px' }}>
              <span>Python</span><span>UTF-8</span><span>Ln 7, Col 1</span>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span>Wandbox API</span><span>Debugra Editor</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="landing-section" style={{ maxWidth: '1000px' }}>
        <h2 className="section-title">Everything You Need</h2>
        <p className="section-subtitle">Professional tools for serious coding — completely free</p>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-dot" style={{ background: f.color, boxShadow: `0 0 10px ${f.color}50` }} />
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== LANGUAGES ===== */}
      <section id="languages" className="landing-section" style={{ maxWidth: '800px', textAlign: 'center' }}>
        <h2 className="section-title">18+ Languages Supported</h2>
        <p className="section-subtitle">All powered by the Wandbox compiler — free, no API key needed</p>
        <div className="lang-tags">
          {languages.map(lang => (
            <span key={lang} className="lang-tag">{lang}</span>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="landing-section" style={{ maxWidth: '600px', textAlign: 'center', padding: '80px 24px' }}>
        <h2 className="section-title">Ready to Code?</h2>
        <p className="section-subtitle">No setup. No install. Just open and code.</p>
        <button onClick={() => navigate('/editor')} className="landing-btn-primary landing-btn-lg" style={{ boxShadow: '0 8px 32px rgba(139,92,246,0.4)' }}>
          Launch Editor
        </button>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="landing-footer">
        Built for Hackathon 2026 — Debugra Team
      </footer>

      {/* ===== LOGIN MODAL ===== */}
      {showLogin && (
        <div className="modal-backdrop" onClick={() => setShowLogin(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
            <p className="modal-subtitle">{isSignUp ? 'Sign up to save code & collaborate' : 'Sign in to access saved code'}</p>

            <button onClick={handleGoogle} className="google-btn">
              <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>

            <div className="modal-divider">
              <div className="modal-divider-line" />
              <span>or use email</span>
              <div className="modal-divider-line" />
            </div>

            <form onSubmit={handleSubmit}>
              {isSignUp && <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="modal-input" required />}
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="modal-input" required />
              <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="modal-input" required minLength={6} />
              <button type="submit" disabled={loading} className="landing-btn-primary" style={{ width: '100%', padding: '10px', marginTop: '4px' }}>
                {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <p className="modal-toggle">
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <button onClick={() => setIsSignUp(!isSignUp)} className="modal-toggle-btn">
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
