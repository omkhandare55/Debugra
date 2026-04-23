import { useState } from 'react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../../services/firebase';
import { X, LogIn, UserPlus, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuthModal({ onClose, initialMode = 'login' }) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const saveUser = async (user) => {
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      displayName: user.displayName || name || 'Anonymous',
      email: user.email,
      photoURL: user.photoURL || null,
      createdAt: new Date(),
    }, { merge: true });
  };

  const handleGoogle = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      await saveUser(result.user);
      toast.success('Welcome, ' + (result.user.displayName || 'Developer') + '!');
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      let result;
      if (isLogin) {
        result = await signInWithEmailAndPassword(auth, email, password);
      } else {
        result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name });
      }
      await saveUser(result.user);
      toast.success('Welcome!');
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#e2e8f0', outline: 'none', fontFamily: "'Inter', sans-serif",
    display: 'block', boxSizing: 'border-box'
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
      fontFamily: "'Inter', system-ui, sans-serif"
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
        padding: '32px', width: '400px', maxWidth: '90vw', color: '#e2e8f0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-24px' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '6px', textAlign: 'center' }}>
          {!isLogin ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', marginBottom: '24px' }}>
          {!isLogin ? 'Sign up to save code & collaborate' : 'Sign in to access saved code'}
        </p>

        {/* Google */}
        <button onClick={handleGoogle} disabled={loading} style={{
          width: '100%', padding: '10px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 500,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#e2e8f0', cursor: 'pointer', marginBottom: '16px', display: 'flex',
          alignItems: 'center', justifyContent: 'center', gap: '8px', boxSizing: 'border-box'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontSize: '0.72rem', color: '#475569' }}>or use email</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name"
              style={{ ...inputStyle, marginBottom: '10px' }} required />
          )}
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required
            style={{ ...inputStyle, marginBottom: '10px' }} />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" required minLength={6}
            style={{ ...inputStyle, marginBottom: '16px' }} />
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '10px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600,
            background: '#8b5cf6', color: 'white', border: 'none', cursor: 'pointer', boxSizing: 'border-box'
          }}>
            {loading ? 'Please wait...' : !isLogin ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.78rem', color: '#64748b' }}>
          {!isLogin ? 'Already have an account? ' : "Don't have an account? "}
          <button onClick={(e) => { e.preventDefault(); setIsLogin(!isLogin); }} style={{
            background: 'none', border: 'none', color: '#8b5cf6', cursor: 'pointer',
            fontSize: '0.78rem', fontWeight: 600, textDecoration: 'underline', padding: 0
          }}>
            {!isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}
