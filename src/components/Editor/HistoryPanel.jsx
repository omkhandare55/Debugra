import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import toast from 'react-hot-toast';

export default function HistoryPanel({ user, onLoadCode, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'users', user.uid, 'savedCode'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      toast.error('Failed to load history');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'savedCode', id));
      setHistory(prev => prev.filter(h => h.id !== id));
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  };

  const formatDate = (ts) => {
    if (!ts?.toDate) return 'Just now';
    const d = ts.toDate();
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const LANG_ICONS = {
    python: '🐍', javascript: '📜', typescript: '🔷', java: '☕',
    cpp: '⚡', c: '🔧', csharp: '🎯', go: '🐹', rust: '🦀',
    ruby: '💎', php: '🐘', swift: '🕊️', bash: '🖥️',
  };

  return (
    <div className="history-panel">
      <div className="history-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-0)' }}>Saved Code</span>
          <span className="history-count">{history.length}</span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={loadHistory} className="history-action-btn" title="Refresh">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
            </svg>
          </button>
          <button onClick={onClose} className="history-action-btn" title="Close">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="history-list">
        {loading ? (
          <div className="history-empty">
            <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-2)', marginTop: '8px' }}>Loading...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="history-empty">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="1.5" style={{ opacity: 0.4 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-2)', marginTop: '8px' }}>No saved code yet</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-2)', opacity: 0.6 }}>Use Save button to store code</span>
          </div>
        ) : (
          history.map((item) => (
            <div key={item.id} className="history-item">
              <div className="history-item-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '0.85rem' }}>{LANG_ICONS[item.language] || '📄'}</span>
                  <span className="history-item-name">{item.name || 'untitled'}</span>
                </div>
                <span className="history-item-time">{formatDate(item.createdAt)}</span>
              </div>
              <pre className="history-item-preview">{(item.code || '').slice(0, 120)}{item.code?.length > 120 ? '...' : ''}</pre>
              <div className="history-item-actions">
                <button onClick={() => { onLoadCode(item.code, item.language); toast.success('Code loaded!'); }} className="history-load-btn">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Load
                </button>
                <button onClick={() => handleDelete(item.id)} className="history-delete-btn">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
