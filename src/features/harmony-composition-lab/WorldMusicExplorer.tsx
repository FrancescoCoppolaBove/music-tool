import { useMemo, useState } from 'react';
import { WORLD_MUSIC_ENTRIES } from './worldMusic';

const panel: React.CSSProperties = { background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 18 };
const button: React.CSSProperties = { background: '#21262d', color: '#e6edf3', border: '1px solid #30363d', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', font: 'inherit' };

export function WorldMusicExplorer() {
  const [selectedId, setSelectedId] = useState(WORLD_MUSIC_ENTRIES[0].id);
  const [query, setQuery] = useState('');
  const selected = WORLD_MUSIC_ENTRIES.find(entry => entry.id === selectedId) ?? WORLD_MUSIC_ENTRIES[0];
  const traditions = useMemo(() => [...new Set(WORLD_MUSIC_ENTRIES.map(entry => entry.tradition))], []);
  const filtered = WORLD_MUSIC_ENTRIES.filter(entry => `${entry.name} ${entry.tradition} ${entry.region}`.toLowerCase().includes(query.toLowerCase()));

  return <section style={{ ...panel, display: 'grid', gap: 14 }}>
    <div><h2 style={{ margin: '0 0 4px', fontSize: 18 }}>World Music Explorer</h2>
      <p style={{ margin: 0, color: '#8b949e', fontSize: 12 }}>Tradition-specific orientation and listening references. These musical systems are not interchangeable with Western scale labels.</p></div>
    <label style={{ display: 'grid', gap: 6, color: '#8b949e', fontSize: 12 }}>Find a tradition or entry
      <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Maqam, raga, Japan…" style={{ ...button, width: '100%', boxSizing: 'border-box' }} />
    </label>
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 0.7fr) minmax(280px, 1.5fr)', gap: 14 }}>
      <nav aria-label="World music entries" style={{ display: 'grid', alignContent: 'start', gap: 6, maxHeight: 400, overflowY: 'auto' }}>
        {traditions.map(tradition => {
          const entries = filtered.filter(entry => entry.tradition === tradition);
          return entries.length ? <div key={tradition}>
            <div style={{ color: '#8b949e', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', margin: '10px 4px 5px' }}>{tradition}</div>
            {entries.map(entry => <button key={entry.id} type="button" aria-pressed={entry.id === selected.id} onClick={() => setSelectedId(entry.id)} style={{ ...button, width: '100%', textAlign: 'left', borderColor: entry.id === selected.id ? '#8b5cf6' : '#30363d', background: entry.id === selected.id ? '#2b2142' : '#0d1117', marginBottom: 5 }}>{entry.name}</button>)}
          </div> : null;
        })}
        {!filtered.length && <div style={{ color: '#8b949e', fontSize: 12 }}>No matching entries.</div>}
      </nav>
      <article aria-live="polite" style={{ display: 'grid', alignContent: 'start', gap: 11, padding: 14, background: '#0d1117', borderRadius: 9, minWidth: 0 }}>
        <div><div style={{ color: '#a78bfa', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{selected.tradition} · {selected.region}</div><h3 style={{ margin: '5px 0 0', fontSize: 20 }}>{selected.name}</h3></div>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55 }}>{selected.overview}</p>
        <p style={{ margin: 0, color: '#c9d1d9', fontSize: 12, lineHeight: 1.55 }}><strong>Listening and study: </strong>{selected.practice}</p>
        <p style={{ margin: 0, color: '#f0c674', fontSize: 12, lineHeight: 1.55 }}><strong>Intonation and limits: </strong>{selected.tuning}</p>
        <div><div style={{ color: '#8b949e', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', marginBottom: 5 }}>REFERENCES</div>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 5, fontSize: 12 }}>{selected.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer" style={{ color: '#a78bfa' }}>{source.label} ↗</a></li>)}</ul>
        </div>
      </article>
    </div>
  </section>;
}
