import { useState } from 'react';
import { Code2, LogIn, Users, Plus, Link, Copy, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Header({ user, onShowAuth, roomId, onCreateRoom, onJoinRoom, activeUsers }) {
  const [showJoin, setShowJoin] = useState(false);
  const [joinId, setJoinId] = useState('');
  const navigate = useNavigate();

  const handleJoin = () => {
    if (joinId.trim()) { onJoinRoom(joinId.trim()); setShowJoin(false); setJoinId(''); }
  };

  const handleCopyRoom = () => {
    if (roomId) { navigator.clipboard.writeText(roomId); toast.success('Room ID copied!'); }
  };

  return (
    <header className="flex items-center justify-between px-4 py-0 flex-shrink-0"
      style={{ height: '48px', background: 'var(--bg-header)', borderBottom: '1px solid var(--border)' }}>
      
      {/* Logo */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="flex items-center gap-2.5 cursor-pointer bg-transparent border-none">
          <div className="flex items-center justify-center rounded-lg"
            style={{ width: '30px', height: '30px', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
            <Code2 size={16} color="white" />
          </div>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Debugra</span>
        </button>
        <span style={{ fontSize: '0.6rem', padding: '2px 6px', borderRadius: '6px', fontWeight: 600,
          background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>AI</span>
      </div>

      {/* Center - Room Controls */}
      <div className="flex items-center gap-2">
        {roomId ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#10b981' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Room: {roomId}</span>
            <button onClick={handleCopyRoom} className="btn-ghost p-1" title="Copy Room ID"><Copy size={12} /></button>
            {activeUsers.length > 0 && (
              <div className="flex items-center gap-1 ml-1">
                <Users size={12} style={{ color: 'var(--text-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{activeUsers.length}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button onClick={onCreateRoom} className="btn-secondary text-xs py-1.5 px-3 hidden sm:flex">
              <Plus size={12} /> New Room
            </button>
            {showJoin ? (
              <div className="flex items-center gap-1.5">
                <input value={joinId} onChange={(e) => setJoinId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  placeholder="Room ID" className="input-sm w-24" autoFocus />
                <button onClick={handleJoin} className="btn-primary text-xs py-1.5 px-3">Join</button>
                <button onClick={() => setShowJoin(false)} className="btn-ghost text-xs p-1.5">✕</button>
              </div>
            ) : (
              <button onClick={() => setShowJoin(true)} className="btn-secondary text-xs py-1.5 px-3 hidden sm:flex">
                <Link size={12} /> Join Room
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right - Auth */}
      <div className="flex items-center gap-2">
        {user ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-full text-xs font-bold"
              style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', color: 'white' }}>
              {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
            </div>
            <span className="text-xs font-medium hidden md:block" style={{ color: 'var(--text-secondary)' }}>
              {user.displayName || user.email?.split('@')[0]}
            </span>
            <button onClick={() => signOut(auth)} className="btn-ghost p-1.5" title="Sign Out">
              <LogOut size={14} style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>
        ) : (
          <button onClick={onShowAuth} className="btn-primary text-xs py-1.5 px-4">
            <LogIn size={12} /> Sign In
          </button>
        )}
      </div>
    </header>
  );
}
