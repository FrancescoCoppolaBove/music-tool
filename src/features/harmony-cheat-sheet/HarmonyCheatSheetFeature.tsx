import { useRef, useState } from 'react';
import type { Tab } from '@shared/types/navigation.types';
import { storageGet, storageSet } from '@shared/utils/storage';
import { ALL_REFERENCES, IDEAS, KEYS, MODES, OTHER_SCALES, WORLD, matchesReference, readFavoriteIds } from './catalog';
import { FAMILY_LABELS, displayNote, formatFormula, formulaNotes, type ModalFamily } from './theory';
import { EMOTIONS, GENRES, type Emotion, type Genre, type ScaleReference } from './types';
import type { KeyReference } from './keys';
import './harmony-cheat-sheet.css';

const FAVORITES_KEY = 'harmony_cheat_sheet_favorites_v1';
const TABS = [
  { id: 'keys', label: 'Tonalità' }, { id: 'modes', label: 'Modi' }, { id: 'scales', label: 'Altre scale' },
  { id: 'world', label: 'World Music' }, { id: 'ideas', label: 'Idee compositive' },
] as const;
type ReferenceTab = typeof TABS[number]['id'];

export default function HarmonyCheatSheetFeature({ onNavigate }: { onNavigate?: (tab: Tab) => void }) {
  const [tab, setTab] = useState<ReferenceTab>('keys');
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState<Genre | ''>('');
  const [emotion, setEmotion] = useState<Emotion | ''>('');
  const [family, setFamily] = useState<ModalFamily | ''>('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState(() => readFavoriteIds(storageGet<unknown>(FAVORITES_KEY, [])));
  const [status, setStatus] = useState('');
  const [manualCopy, setManualCopy] = useState('');
  const tabsRef = useRef<HTMLDivElement>(null);
  const filters = { query, genre, emotion, favoritesOnly, favorites };
  const keys = KEYS.filter(item => matchesReference(item, filters));
  const modes = MODES.filter(item => matchesReference(item, filters) && (!family || family === item.family));
  const scales = OTHER_SCALES.filter(item => matchesReference(item, filters));
  const world = WORLD.filter(item => matchesReference(item, filters));
  const ideas = IDEAS.filter(item => matchesReference(item, filters));
  const counts: Record<ReferenceTab, number> = { keys: keys.length, modes: modes.length, scales: scales.length, world: world.length, ideas: ideas.length };

  function toggleFavorite(id: string) {
    const next = favorites.includes(id) ? favorites.filter(item => item !== id) : [...favorites, id];
    setFavorites(next); storageSet(FAVORITES_KEY, next);
  }
  function favorite(id: string, name: string) {
    const saved = favorites.includes(id);
    return <button type="button" className={`hcs-favorite ${saved ? 'is-saved' : ''}`} aria-pressed={saved} aria-label={`${saved ? 'Rimuovi' : 'Salva'} ${name} ${saved ? 'dai' : 'nei'} preferiti`} onClick={() => toggleFavorite(id)} title={saved ? 'Rimuovi dai preferiti' : 'Salva nei preferiti'}>{saved ? '★' : '☆'}</button>;
  }
  async function copy(text: string) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text); setManualCopy(''); setStatus('Copiato negli appunti.');
    } catch { setManualCopy(text); setStatus('Seleziona il testo qui sotto e copialo manualmente.'); }
  }
  function reset() { setQuery(''); setGenre(''); setEmotion(''); setFamily(''); setFavoritesOnly(false); }
  function chooseTab(next: ReferenceTab) { setTab(next); }
  function keyTable(rows: KeyReference[], label: string) {
    if (!rows.length) return null;
    return <section className="hcs-table-section"><h3>{label} <small>{rows.length}</small></h3><div className="hcs-table-scroll"><table className="hcs-table hcs-key-table">
      <caption className="hcs-sr-only">{label}: direzioni espressive, generi, vantaggi e difficoltà</caption>
      <thead><tr><th scope="col">Tonalità</th><th scope="col">Direzione possibile</th><th scope="col">Generi da provare</th><th scope="col">Vantaggio compositivo</th><th scope="col">Per la band / approfondisci</th></tr></thead>
      <tbody>{rows.map(item => <tr key={item.id}><th scope="row" data-label="Tonalità"><div className="hcs-name">{favorite(item.id, item.name)}<strong>{displayNote(item.tonic)}{item.mode === 'minor' ? 'm' : ''}</strong></div>{item.recommended && <span className="hcs-badge">In evidenza</span>}</th>
        <td data-label="Direzione possibile">{item.direction}</td><td data-label="Generi da provare">{item.genres.join(' · ')}</td><td data-label="Vantaggio">{item.advantage}</td>
        <td data-label="Per la band"><p>{item.utility}</p><details><summary>Note, idea e strumenti</summary><p><b>{item.mode === 'minor' ? 'Minore naturale' : 'Scala maggiore'}:</b> {item.notes.map(displayNote).join(' · ')}</p>{item.mode === 'minor' && <p>Per una dominante maggiore usa la sensibile della minore armonica; la minore melodica jazz aggiunge anche la 6 naturale.</p>}<p><b>Da considerare:</b> {item.difficulty}</p><p className="hcs-formula">{displayNote(item.progression)}</p><button type="button" onClick={() => void copy(item.progression)}>Copia cadenza</button></details></td>
      </tr>)}</tbody>
    </table></div></section>;
  }
  function scaleTable(rows: ScaleReference[], label: string) {
    return <div className="hcs-table-scroll"><table className="hcs-table">
      <caption className="hcs-sr-only">{label}: formule, accordi e applicazioni</caption>
      <thead><tr><th scope="col">{tab === 'modes' ? 'Modo' : 'Scala'}</th><th scope="col">Formula / note in C</th><th scope="col">Carattere e accordi</th><th scope="col">Applicazione pratica</th><th scope="col">Pro / attenzione</th></tr></thead>
      <tbody>{rows.map(item => <tr key={item.id}><th scope="row" data-label="Riferimento"><div className="hcs-name">{favorite(item.id,item.name)}<strong>{item.name}</strong></div>{item.recommended && <span className="hcs-badge">Consigliato · funk / nu-jazz</span>}<small className="hcs-muted">{'degree' in item && item.degree !== undefined ? `${item.degree + 1}° modo · ${FAMILY_LABELS[item.family as ModalFamily]}` : item.family}</small></th>
        <td data-label="Formula"><div className="hcs-formula">{formatFormula(item.formula)}</div><details><summary>Note di riferimento</summary><p>{formulaNotes(item.formula).map(displayNote).join(' · ')}</p></details><button type="button" className="hcs-text-button" onClick={() => void copy(`${item.name}: ${formatFormula(item.formula)}\nC: ${formulaNotes(item.formula).map(displayNote).join(' ')}`)}>Copia formula</button></td>
        <td data-label="Carattere / accordi"><b>{item.sound}</b><p className="hcs-formula">{item.chords}</p><small className="hcs-muted">{item.emotions.join(' · ')}</small></td>
        <td data-label="Applicazione">{item.use}<small className="hcs-muted">{item.genres.join(' · ')}</small></td>
        <td data-label="Pro / attenzione"><p><b>Risorsa:</b> {item.benefit}</p><details><summary>Da considerare</summary><p>{item.caution}</p></details></td>
      </tr>)}</tbody>
    </table></div>;
  }

  return <div className="hcs">
    <header className="hcs-hero"><div><span className="hcs-eyebrow">ARMONIA / PRONTUARIO CREATIVO</span><h1>Harmony Cheat Sheet</h1><p>Una mappa per scegliere un colore armonico e trovare il primo nucleo di un brano.</p></div><div className="hcs-hero-facts"><span><b>24</b> tonalità</span><span><b>28</b> modi</span><span><b>15</b> canovacci</span></div></header>
    <section className="hcs-intent" aria-labelledby="hcs-intent-title">
      <div className="hcs-section-heading"><div><span className="hcs-eyebrow">01 / TROVA UNA DIREZIONE</span><h2 id="hcs-intent-title">Cosa vuoi comporre?</h2></div><p>Seleziona un genere o un’emozione: riferimenti e idee si aggiornano insieme.</p></div>
      <div className="hcs-controls">
        <label>Genere<select value={genre} onChange={e => setGenre(e.target.value as Genre | '')}><option value="">Tutti i generi</option>{GENRES.map(item => <option key={item}>{item}</option>)}</select></label>
        <label>Direzione emotiva<select value={emotion} onChange={e => setEmotion(e.target.value as Emotion | '')}><option value="">Tutte le emozioni</option>{EMOTIONS.map(item => <option key={item}>{item}</option>)}</select></label>
        <label className="hcs-search">Cerca nel prontuario<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Es. dorico, Bb, minore, Hirajōshi…" /></label>
      </div>
      {(genre || emotion) && <div className="hcs-directions"><div><small>02 / COLORI ARMONICI</small>{modes.slice(0,3).map(item => <button type="button" key={item.id} onClick={() => { setQuery(item.name); chooseTab('modes'); }}>{item.name}<span>{item.sound}</span></button>)}{!modes.length && <p>Nessun modo per questa combinazione.</p>}</div><div><small>03 / PUNTI DI PARTENZA</small>{ideas.slice(0,3).map(item => <button type="button" key={item.id} onClick={() => { setQuery(item.name); chooseTab('ideas'); }}>{item.name}<span>{displayNote(item.tonic)} · {item.mode}</span></button>)}{!ideas.length && <p>Nessun canovaccio per questa combinazione: prova un solo filtro.</p>}</div></div>}
    </section>
    <div className="hcs-toolbar"><button type="button" aria-pressed={favoritesOnly} className={favoritesOnly ? 'is-active' : ''} onClick={() => setFavoritesOnly(value => !value)}>★ Solo preferiti ({favorites.length})</button><button type="button" className="hcs-text-button" onClick={reset}>Azzera filtri</button><span className="hcs-muted">Preferiti salvati su questo dispositivo</span></div>
    <div className="hcs-tabs" role="tablist" aria-label="Sezioni del prontuario" ref={tabsRef} onKeyDown={event => {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault(); const index = TABS.findIndex(item => item.id === tab);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? TABS.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length;
      setTab(TABS[next].id); tabsRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
    }}>{TABS.map(item => <button type="button" role="tab" id={`hcs-tab-${item.id}`} aria-controls="hcs-content" aria-selected={tab === item.id} tabIndex={tab === item.id ? 0 : -1} key={item.id} onClick={() => chooseTab(item.id)}>{item.label}<span>{counts[item.id]}</span></button>)}</div>
    <div className="hcs-feedback" role="status" aria-live="polite">{status}</div>
    {manualCopy && <label className="hcs-manual-copy">Testo da copiare<textarea readOnly value={manualCopy} onFocus={e => e.currentTarget.select()} rows={3} /></label>}
    <section id="hcs-content" role="tabpanel" aria-labelledby={`hcs-tab-${tab}`} className="hcs-content" tabIndex={0}>
      <div className="hcs-section-heading"><h2>{TABS.find(item => item.id === tab)?.label}</h2><span aria-live="polite" className="hcs-result-count">{counts[tab]} risultati</span></div>
      {tab === 'keys' && <><p className="hcs-note">Le tonalità assolute non hanno emozioni intrinseche: una trasposizione conserva i rapporti intervallari. Le direzioni qui proposte dipendono da melodia, modo, registro, timbro e contesto. “In evidenza” indica le tonalità scelte per il tuo organico, non una classifica statistica.</p>{keyTable(keys.filter(item => item.mode === 'major'),'Tonalità maggiori')}{keyTable(keys.filter(item => item.mode === 'minor'),'Tonalità minori')}</>}
      {tab === 'modes' && <><div className="hcs-family"><label>Famiglia modale<select value={family} onChange={e => setFamily(e.target.value as ModalFamily | '')}><option value="">Tutte le famiglie</option>{Object.entries(FAMILY_LABELS).map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select></label><p>Formule relative alla tonica, note e accordi esemplificati su C. I nomi dei modi meno comuni possono variare fra scuole.</p></div>{modes.length > 0 && scaleTable(modes,'Atlante dei modi')}</>}
      {tab === 'scales' && <><p className="hcs-note">Gli accordi sono esempi su C. Le note cromatiche e le tensioni vanno valutate per durata, registro e risoluzione; le varianti bebop sono indicate separatamente.</p>{scales.length > 0 && scaleTable(scales,'Altre scale')}</>}
      {tab === 'world' && <><p className="hcs-note">Maqam, raga, kiñit e Ut‘jayn sono sistemi con percorsi melodici, repertori e intonazioni proprie. Le note in C, dove presenti, sono schemi occidentali esplicitamente limitati. I suggerimenti per il nu-jazz sono proposte creative, non descrizioni di esecuzioni tradizionali.</p>{world.length > 0 && <div className="hcs-table-scroll"><table className="hcs-table"><caption className="hcs-sr-only">Sistemi modali e riferimenti World Music</caption><thead><tr><th scope="col">Tradizione / sistema</th><th scope="col">Caratteristiche</th><th scope="col">Sonorità da esplorare</th><th scope="col">Uso nel nu-jazz</th><th scope="col">Note e fonti</th></tr></thead><tbody>{world.map(item => <tr key={item.id}><th scope="row" data-label="Sistema"><div className="hcs-name">{favorite(item.id,item.name)}<strong>{item.name}</strong></div><small className="hcs-muted">{item.tradition}</small></th><td data-label="Caratteristiche">{item.characteristics}</td><td data-label="Ascolto">{item.sound}</td><td data-label="Applicazione">{item.use}</td><td data-label="Note / fonti"><details><summary>Riferimento e limiti</summary>{item.sketch && <p className="hcs-formula">{formulaNotes(item.sketch).map(displayNote).join(' · ')}</p>}<p>{item.sketchLabel}</p><p>{item.caution}</p><ul>{item.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}</a></li>)}</ul></details></td></tr>)}</tbody></table></div>}</>}
      {tab === 'ideas' && <><p className="hcs-note">15 spunti originali da sviluppare. Le progressioni possono includere prestiti e accordi esterni al modo principale. Groove e organico sono annotazioni creative sintetiche.</p><div className="hcs-ideas">{ideas.map(idea => <article className="hcs-idea" key={idea.id}>
        <div className="hcs-idea-top"><span className="hcs-eyebrow">IDEA {String(idea.number).padStart(2,'0')} / {idea.genres[0]}</span>{favorite(idea.id,idea.name)}</div><h3>{idea.name}</h3><p>{idea.concept}</p><div className="hcs-pills">{idea.emotions.map(item => <span key={item}>{item}</span>)}</div><div className="hcs-idea-key"><b>{displayNote(idea.tonic)} · {idea.mode}</b><span>{idea.bpm} BPM · {idea.meter}</span></div><div className="hcs-progression">{displayNote(idea.progression)}</div><button type="button" onClick={() => void copy(idea.progression)}>Copia progressione</button>
        <details><summary>Sviluppo del brano e organico</summary><dl>{[['Groove',idea.groove],['Basso',idea.bass],['Tastiere',idea.keys],['Fiati',idea.horns],['Strofa',idea.verse],['Ritornello',idea.chorus],['Special',idea.special],['Scelta armonica',idea.note]].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p className="hcs-related">Riferimenti: {idea.referenceIds.map(id => ALL_REFERENCES.find(item => item.id === id)?.name).filter(Boolean).join(' · ')}</p></details>
      </article>)}</div></>}
      {counts[tab] === 0 && <div className="hcs-empty"><h3>Nessun risultato con questi filtri</h3><p>Prova un genere o un’emozione alla volta, oppure aggiungi elementi ai preferiti.</p><button type="button" onClick={reset}>Mostra tutti i riferimenti</button></div>}
    </section>
    <footer className="hcs-footer"><details><summary>Come leggere il prontuario e riferimenti teorici</summary><p>Formule dei modi ottenute ruotando le quattro scale madri. Le note rispettano la grafia dei gradi: ♭4 = Fb su C; ♭♭7 = Bbb. Le indicazioni emotive e stilistiche sono proposte editoriali, non dati di frequenza d’uso.</p><p>Riferimenti: <a href="https://musictheory.pugetsound.edu/mt21c/JazzScales.html" target="_blank" rel="noreferrer">Music Theory for the 21st-Century Classroom · Jazz Scales</a> · <a href="https://ianring.com/musictheory/scales/2485" target="_blank" rel="noreferrer">Ian Ring · Harmonic Major</a>. Le fonti delle tradizioni sono nelle rispettive schede.</p></details>
      {onNavigate && <div className="hcs-next"><span>Per approfondire negli strumenti dell’app:</span><button type="button" onClick={() => onNavigate('dictionary')}>Scale Dictionary →</button><button type="button" onClick={() => onNavigate('progressions')}>Chord Progressions →</button><button type="button" onClick={() => onNavigate('architect')}>Song Architect →</button></div>}
    </footer>
  </div>;
}
