import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Music, Save, X, Tag } from 'lucide-react';
import { useAuth } from '../../shared/context/AuthContext';
import { loadSongs, addSong, updateSong, deleteSong, type Song } from '../../shared/utils/firestoreSync';

const KEYS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'A#', 'Bb', 'B'];
const STYLES = ['Jazz', 'Blues', 'Pop', 'Rock', 'Bossa Nova', 'Latin', 'Classical', 'Funk', 'Gospel', 'R&B', 'Other'];

const COMMON_TAGS = ['practice', 'performance', 'learning', 'gig', 'original', 'cover', 'standard'];

const CSS = `
  .sl-container { max-width: 800px; margin: 0 auto; }

  .sl-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }

  .sl-add-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 18px;
    background: linear-gradient(135deg, #7c3aed, #6d28d9);
    color: #fff; font-size: 13px; font-weight: 600;
    border: none; border-radius: 8px; cursor: pointer;
    transition: box-shadow 0.15s, transform 0.15s;
  }
  .sl-add-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(124,58,237,0.4); }

  .sl-form-card {
    background: #161b22; border: 1px solid #7c3aed40;
    border-radius: 12px; padding: 24px; margin-bottom: 20px;
    animation: fade-up 0.2s ease both;
  }
  @keyframes fade-up { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }

  .sl-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  @media (max-width: 600px) { .sl-form-grid { grid-template-columns: 1fr; } }

  .sl-label { display: block; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }

  .sl-input, .sl-select {
    width: 100%; padding: 10px 12px;
    background: #0d1117; border: 1px solid #30363d; border-radius: 8px;
    color: #e6edf3; font-size: 14px; font-family: 'DM Sans', sans-serif;
    box-sizing: border-box;
    transition: border-color 0.15s;
  }
  .sl-input:focus, .sl-select:focus { outline: none; border-color: #7c3aed; }
  .sl-textarea { min-height: 80px; resize: vertical; }

  .sl-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
  .sl-tag-chip {
    padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500;
    cursor: pointer; border: 1px solid #30363d; background: #1c2128; color: #8b949e;
    transition: all 0.12s;
  }
  .sl-tag-chip.active { background: #7c3aed22; border-color: #7c3aed60; color: #c4b5fd; }

  .sl-form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }

  .sl-save-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 10px 20px; background: #7c3aed; color: #fff;
    font-size: 13px; font-weight: 600; border: none; border-radius: 8px; cursor: pointer;
  }
  .sl-cancel-btn {
    padding: 10px 16px; background: none; color: #6b7280;
    font-size: 13px; border: 1px solid #30363d; border-radius: 8px; cursor: pointer;
  }

  .sl-song-card {
    background: #161b22; border: 1px solid #21262d; border-radius: 12px;
    padding: 20px; margin-bottom: 12px;
    transition: border-color 0.15s;
  }
  .sl-song-card:hover { border-color: #30363d; }

  .sl-song-top { display: flex; align-items: flex-start; gap: 14px; }
  .sl-song-icon {
    width: 44px; height: 44px; border-radius: 10px;
    background: #7c3aed18; border: 1px solid #7c3aed30;
    display: flex; align-items: center; justify-content: center;
    color: #7c3aed; flex-shrink: 0;
  }
  .sl-song-title { font-size: 16px; font-weight: 700; color: #e6edf3; margin: 0 0 4px; }
  .sl-song-meta { font-size: 12px; color: #6b7280; }

  .sl-song-actions { margin-left: auto; display: flex; gap: 6px; flex-shrink: 0; }
  .sl-icon-btn {
    width: 32px; height: 32px; border-radius: 8px; border: 1px solid #21262d;
    background: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
    color: #6b7280; transition: all 0.12s;
  }
  .sl-icon-btn:hover { border-color: #30363d; color: #e6edf3; }
  .sl-icon-btn.danger:hover { border-color: rgba(239,68,68,0.4); color: #f87171; background: rgba(239,68,68,0.08); }

  .sl-song-notes {
    margin-top: 12px; padding-top: 12px; border-top: 1px solid #21262d;
    font-size: 13px; color: #8b949e; white-space: pre-wrap; line-height: 1.6;
  }

  .sl-tag-badge {
    display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 500;
    background: #7c3aed18; color: #c4b5fd; border: 1px solid #7c3aed30;
    margin-right: 4px; margin-top: 4px;
  }

  .sl-empty {
    text-align: center; padding: 60px 20px;
    color: #4b5563;
  }
  .sl-loading { text-align: center; padding: 40px; color: #4b5563; }
`;

function SongForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Song;
  onSave: (song: Omit<Song, 'id'>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [key, setKey] = useState(initial?.key ?? 'C');
  const [style, setStyle] = useState(initial?.style ?? 'Jazz');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);

  function toggleTag(tag: string) {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), key, style, notes, tags });
  }

  return (
    <div className="sl-form-card">
      <form onSubmit={handleSubmit}>
        <div className="sl-form-grid">
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="sl-label">Song title *</label>
            <input
              className="sl-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Autumn Leaves"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="sl-label">Key</label>
            <select className="sl-select" value={key} onChange={e => setKey(e.target.value)}>
              {KEYS.map(k => <option key={k}>{k}</option>)}
            </select>
          </div>
          <div>
            <label className="sl-label">Style</label>
            <select className="sl-select" value={style} onChange={e => setStyle(e.target.value)}>
              {STYLES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="sl-label">Notes (chords, structure, tips…)</label>
            <textarea
              className="sl-input sl-textarea"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Bb instruments: play in C. A section: ii-V-I in Bb..."
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="sl-label">Tags</label>
            <div className="sl-tags">
              {COMMON_TAGS.map(t => (
                <button type="button" key={t} onClick={() => toggleTag(t)}
                  className={`sl-tag-chip${tags.includes(t) ? ' active' : ''}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="sl-form-actions">
          <button type="button" className="sl-cancel-btn" onClick={onCancel}>Cancel</button>
          <button type="submit" className="sl-save-btn">
            <Save size={14} /> Save song
          </button>
        </div>
      </form>
    </div>
  );
}

export default function SongLibraryFeature() {
  const { user } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadSongs(user.uid).then(s => {
      setSongs(s.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)));
      setLoading(false);
    });
  }, [user]);

  async function handleAdd(song: Omit<Song, 'id'>) {
    if (!user) return;
    const saved = await addSong(user.uid, song);
    setSongs(prev => [saved, ...prev]);
    setShowAddForm(false);
  }

  async function handleUpdate(songId: string, updates: Omit<Song, 'id'>) {
    if (!user) return;
    await updateSong(user.uid, songId, updates);
    setSongs(prev => prev.map(s => s.id === songId ? { ...s, ...updates } : s));
    setEditingId(null);
  }

  async function handleDelete(songId: string) {
    if (!user) return;
    setDeletingId(songId);
    await deleteSong(user.uid, songId);
    setSongs(prev => prev.filter(s => s.id !== songId));
    setDeletingId(null);
  }

  return (
    <div className="sl-container">
      <style>{CSS}</style>

      <div className="sl-header">
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#e6edf3', margin: 0 }}>Song Library</h2>
          <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
            {songs.length} {songs.length === 1 ? 'song' : 'songs'} in your collection
          </p>
        </div>
        {!showAddForm && (
          <button className="sl-add-btn" onClick={() => setShowAddForm(true)}>
            <Plus size={16} /> Add song
          </button>
        )}
      </div>

      {showAddForm && (
        <SongForm onSave={handleAdd} onCancel={() => setShowAddForm(false)} />
      )}

      {loading ? (
        <div className="sl-loading">Loading your library…</div>
      ) : songs.length === 0 && !showAddForm ? (
        <div className="sl-empty">
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎵</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#8b949e', marginBottom: 8 }}>No songs yet</div>
          <div style={{ fontSize: 14, color: '#4b5563', marginBottom: 24 }}>
            Add your first song to start building your personal repertoire
          </div>
          <button className="sl-add-btn" onClick={() => setShowAddForm(true)}>
            <Plus size={16} /> Add your first song
          </button>
        </div>
      ) : (
        songs.map(song => (
          <div key={song.id} className="sl-song-card">
            {editingId === song.id ? (
              <SongForm
                initial={song}
                onSave={updates => handleUpdate(song.id!, updates)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <>
                <div className="sl-song-top">
                  <div className="sl-song-icon"><Music size={20} /></div>
                  <div style={{ flex: 1 }}>
                    <div className="sl-song-title">{song.title}</div>
                    <div className="sl-song-meta">
                      <span style={{ marginRight: 12 }}>Key: <strong style={{ color: '#c4b5fd' }}>{song.key}</strong></span>
                      <span>Style: <strong style={{ color: '#e6edf3' }}>{song.style}</strong></span>
                    </div>
                    {song.tags.length > 0 && (
                      <div style={{ marginTop: 6 }}>
                        {song.tags.map(t => <span key={t} className="sl-tag-badge">{t}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="sl-song-actions">
                    <button className="sl-icon-btn" onClick={() => setEditingId(song.id!)} title="Edit">
                      <Edit3 size={14} />
                    </button>
                    <button
                      className="sl-icon-btn danger"
                      onClick={() => handleDelete(song.id!)}
                      disabled={deletingId === song.id}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {song.notes && (
                  <div className="sl-song-notes">{song.notes}</div>
                )}
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}
