import { useMemo, useState, type ChangeEvent, type CSSProperties } from 'react';
import { Note } from 'tonal';
import { aiFetch } from '../../shared/utils/aiFetch';
import PartPreview from './PartPreview';
import { concertKey, nearestDirection, writtenKey, type Direction, type KeySpec } from './engine/intervals';
import { combineParts, decodeMusicXmlFile, extractPart, listParts, readSourceInfo, type PartInfo } from './engine/musicXmlIO';
import { PART_INSTRUMENTS, partInstrument } from './engine/partInstruments';
import { displayXml, transposeParts, type PartOutput } from './engine/pipeline';
import { parseTextScore } from './engine/textScore';
import { textToMusicXml } from './engine/textToMusicXml';
import { browserCodec } from './engine/xmlDom';

const API_URL = import.meta.env.VITE_API_URL || '';
const MAJOR_TONICS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const MINOR_TONICS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
const MAX_IMAGES = 6;
const EXAMPLE = `title: Esempio
key: Eb
time: 4/4
| [Ebmaj7] Bb4:q G4:8 F4:8 Eb4:h | [Cm7] C5:h. r:q | [Fm7] [Bb7] | [Ebmaj7] Eb4:w |`;

type InputTab = 'text' | 'xml' | 'photo';
interface XmlSource { name: string; xml: string; parts: PartInfo[]; partId: string }
interface PhotoImage { name: string; base64: string; mimeType: string }

const card: CSSProperties = { background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 };
const sectionLabel: CSSProperties = { fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 };
const field: CSSProperties = { background: '#0d1117', color: '#e6edf3', border: '1px solid #30363d', borderRadius: 8, padding: '6px 10px', fontSize: 13 };
const errorText: CSSProperties = { margin: 0, fontSize: 12.5, color: '#f87171' };
const hint: CSSProperties = { margin: 0, fontSize: 12, color: '#6b7280', lineHeight: 1.6 };
const chip = (on: boolean): CSSProperties => ({
  padding: '6px 12px', borderRadius: 8, fontSize: 12.5, cursor: 'pointer', fontWeight: on ? 600 : 400,
  background: on ? '#7c3aed20' : '#0d1117', border: `1px solid ${on ? '#7c3aed' : '#30363d'}`, color: on ? '#c4b5fd' : '#8b949e',
});
const button = (primary = false): CSSProperties => ({
  padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
  background: primary ? '#7c3aed' : '#0d1117', border: `1px solid ${primary ? '#7c3aed' : '#30363d'}`, color: primary ? '#fff' : '#c4b5fd',
});

/** Spelling from the dropdown list with the same pitch (e.g. D# → Eb). */
function listTonic(tonic: string, minor: boolean): string {
  return (minor ? MINOR_TONICS : MAJOR_TONICS).find(t => Note.chroma(t) === Note.chroma(tonic)) ?? tonic;
}

function readImage(file: File): Promise<PhotoImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, base64: String(reader.result).split(',')[1], mimeType: file.type || 'image/png' });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function download(filename: string, xml: string) {
  const url = URL.createObjectURL(new Blob([xml], { type: 'application/vnd.recordare.musicxml+xml' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const slug = (s: string) => s.toLowerCase().replace(/\.[a-z]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'parte';

function rangeWarning(o: PartOutput): string {
  const counts = [o.above && `${o.above} note sopra`, o.below && `${o.below} note sotto`].filter(Boolean).join(' e ');
  if (!counts) return '';
  return `${counts} il range di ${o.instrument.name}: prova a trasporre ${o.above >= o.below ? 'giù' : 'su'}.`;
}

export default function PartTransposerFeature() {
  const [tab, setTab] = useState<InputTab>('text');
  const [text, setText] = useState(EXAMPLE);
  const [xmlSource, setXmlSource] = useState<XmlSource | null>(null);
  const [xmlError, setXmlError] = useState('');
  const [sourceId, setSourceId] = useState('keyboard');
  const [sourceWarning, setSourceWarning] = useState('');
  // Key as written on the source part; the concert key is derived from it.
  const [writtenSourceKey, setWrittenSourceKey] = useState<KeySpec>({ tonic: 'Eb', minor: false });
  const [newTonic, setNewTonic] = useState('G');
  const [direction, setDirection] = useState<Direction | null>(null);
  const [targetIds, setTargetIds] = useState<string[]>(PART_INSTRUMENTS.map(i => i.id));
  const [shownId, setShownId] = useState('keyboard');
  const [images, setImages] = useState<PhotoImage[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const source = partInstrument(sourceId);
  const originalKey = concertKey(writtenSourceKey, source);
  const shownDirection = direction ?? nearestDirection(originalKey.tonic, newTonic);
  const parsed = useMemo(() => parseTextScore(text), [text]);
  const usingXml = tab === 'xml';

  const sourceXml = useMemo(() => {
    if (usingXml) return xmlSource ? extractPart(browserCodec, xmlSource.xml, xmlSource.partId) : null;
    return parsed.score ? textToMusicXml({ ...parsed.score, key: writtenSourceKey }) : null;
  }, [usingXml, xmlSource, parsed, writtenSourceKey]);

  const result = useMemo((): { outputs: PartOutput[]; error: string } => {
    if (!sourceXml) return { outputs: [], error: '' };
    try {
      const src = partInstrument(sourceId);
      const fromKey = concertKey(writtenSourceKey, src);
      return {
        outputs: transposeParts(browserCodec, {
          sourceXml,
          source: src,
          originalKey: fromKey,
          newTonic,
          direction: direction ?? nearestDirection(fromKey.tonic, newTonic),
          targets: PART_INSTRUMENTS.filter(i => targetIds.includes(i.id)),
        }),
        error: '',
      };
    } catch (e) {
      return { outputs: [], error: e instanceof Error ? e.message : 'Trasposizione non riuscita' };
    }
  }, [sourceXml, sourceId, writtenSourceKey, newTonic, direction, targetIds]);

  const shown = result.outputs.find(o => o.instrument.id === shownId) ?? result.outputs[0];
  const shownXml = useMemo(() => (shown ? displayXml(browserCodec, shown) : ''), [shown]);
  const title = usingXml ? slug(xmlSource?.name ?? '') : slug(parsed.score?.title ?? '');
  const tonics = originalKey.minor ? MINOR_TONICS : MAJOR_TONICS;
  const modeLabel = originalKey.minor ? 'minore' : 'maggiore';

  function updateText(value: string) {
    setText(value);
    const key = parseTextScore(value).score?.key;
    if (key) setWrittenSourceKey(key);
  }

  function choosePart(src: XmlSource) {
    setXmlSource(src);
    const info = readSourceInfo(browserCodec.parse(extractPart(browserCodec, src.xml, src.partId)));
    if (info.key) setWrittenSourceKey(info.key);
    if (info.instrumentId) setSourceId(info.instrumentId);
    setSourceWarning(info.instrumentId ? '' : `Strumento non riconosciuto (trasposizione di ${info.semitones} semitoni): scegli "Scritto per" a mano.`);
  }

  async function loadXmlFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const xml = decodeMusicXmlFile(file.name, new Uint8Array(await file.arrayBuffer()));
      const parts = listParts(browserCodec.parse(xml));
      if (!parts.length) throw new Error('Nessuna parte con note nel file');
      choosePart({ name: file.name, xml, parts, partId: parts[0].id });
      setXmlError('');
    } catch (err) {
      setXmlError(err instanceof Error && err.message !== 'Invalid XML' ? err.message : 'File non leggibile: esporta di nuovo il MusicXML da MuseScore');
    }
  }

  async function addImages(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    try {
      const read = await Promise.all(files.map(readImage));
      setImages(prev => [...prev, ...read].slice(0, MAX_IMAGES));
    } catch {
      setScanError('Impossibile leggere l’immagine');
    }
  }

  async function scan() {
    setScanning(true);
    setScanError('');
    try {
      const resp = await aiFetch(`${API_URL}/api/part-scan`, { images: images.map(({ base64, mimeType }) => ({ base64, mimeType })) });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || 'Analisi non riuscita');
      if (!data.text) throw new Error('Nessuna nota riconosciuta: prova con una foto più nitida');
      updateText(data.text);
      setTab('text');
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Analisi non riuscita');
    } finally {
      setScanning(false);
    }
  }

  function toggleTarget(id: string) {
    setTargetIds(ids => (ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]));
  }

  function setConcertTonic(tonic: string) {
    setWrittenSourceKey(writtenKey({ tonic, minor: originalKey.minor }, source));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <h2 style={{ margin: '0 0 6px', fontSize: 22, color: '#e6edf3', fontFamily: "'Syne', sans-serif" }}>Part Transposer</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
          Cambia la tonalità di una parte (melodia e accordi) e scrivila per ogni strumento della band.
        </p>
      </div>

      {/* 1 · Input */}
      <section style={card} aria-labelledby="pt-input">
        <span id="pt-input" style={sectionLabel}>1 · Parte</span>
        <div role="tablist" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {([['text', 'Scrivi'], ['xml', 'MusicXML'], ['photo', 'Foto']] as const).map(([id, name]) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} style={chip(tab === id)}>{name}</button>
          ))}
        </div>

        {tab === 'text' && (
          <>
            <textarea
              aria-label="Parte in formato testo"
              value={text}
              onChange={e => updateText(e.target.value)}
              spellCheck={false}
              rows={8}
              style={{ ...field, fontFamily: 'monospace', lineHeight: 1.6, resize: 'vertical' }}
            />
            <p style={hint}>
              Note <code>Eb4:q</code> (durate <code>w h q 8 16</code>, punto <code>q.</code>), pause <code>r:h</code>, legatura <code>~</code>,
              terzine <code>(3 C5:8 D5:8 E5:8)</code>, sigle <code>[Cm7]</code> prima della nota. Battute tra <code>|</code>.
            </p>
            {parsed.errors.length > 0 && (
              <ul role="alert" style={{ margin: 0, paddingLeft: 18 }}>
                {parsed.errors.map((err, i) => <li key={i} style={errorText}>{err.message}</li>)}
              </ul>
            )}
          </>
        )}

        {tab === 'xml' && (
          <>
            <input type="file" accept=".musicxml,.xml,.mxl" onChange={loadXmlFile} aria-label="Carica MusicXML" style={{ color: '#8b949e', fontSize: 13 }} />
            <p style={hint}>Da MuseScore: File → Esporta → MusicXML, con "Concert pitch" spento.</p>
            {xmlSource && xmlSource.parts.length > 1 && (
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#e6edf3' }}>
                Parte
                <select style={field} value={xmlSource.partId} onChange={e => choosePart({ ...xmlSource, partId: e.target.value })}>
                  {xmlSource.parts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
            )}
            {xmlSource && <p style={{ margin: 0, fontSize: 12.5, color: '#06b6d4' }}>✓ {xmlSource.name}</p>}
            {xmlError && <p role="alert" style={errorText}>{xmlError}</p>}
          </>
        )}

        {tab === 'photo' && (
          <>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={addImages} aria-label="Carica foto dello spartito" style={{ color: '#8b949e', fontSize: 13 }} />
            {images.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: '#8b949e' }}>
                {images.map((img, i) => <li key={i}>{img.name}</li>)}
              </ul>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button style={button(true)} disabled={!images.length || scanning} onClick={scan}>{scanning ? 'Leggo lo spartito…' : 'Leggi con AI'}</button>
              {images.length > 0 && <button style={button()} onClick={() => setImages([])}>Svuota</button>}
            </div>
            <p style={hint}>Il risultato finisce in "Scrivi": controllalo prima di trasporre.</p>
            {scanError && <p role="alert" style={errorText}>{scanError}</p>}
          </>
        )}
      </section>

      {/* 2 · Origine · 3 · Destinazione */}
      <section style={card} aria-labelledby="pt-keys">
        <span id="pt-keys" style={sectionLabel}>2 · Origine e 3 · Destinazione</span>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', fontSize: 13, color: '#e6edf3' }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            Scritto per
            <select style={field} value={sourceId} onChange={e => setSourceId(e.target.value)}>
              {PART_INSTRUMENTS.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            Tonalità originale (concert)
            <select style={field} value={listTonic(originalKey.tonic, originalKey.minor)} onChange={e => setConcertTonic(e.target.value)}>
              {tonics.map(t => <option key={t} value={t}>{t} {modeLabel}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            Nuova tonalità
            <select style={field} value={listTonic(newTonic, originalKey.minor)} onChange={e => setNewTonic(e.target.value)}>
              {tonics.map(t => <option key={t} value={t}>{t} {modeLabel}</option>)}
            </select>
          </label>
          <div role="group" aria-label="Direzione" style={{ display: 'flex', gap: 6 }}>
            {(['up', 'down'] as const).map(d => (
              <button key={d} aria-pressed={shownDirection === d} onClick={() => setDirection(d)} style={chip(shownDirection === d)}>
                {d === 'up' ? '↑ su' : '↓ giù'}
              </button>
            ))}
          </div>
        </div>
        {sourceWarning && <p role="alert" style={errorText}>{sourceWarning}</p>}
        <div role="group" aria-label="Strumenti di destinazione" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PART_INSTRUMENTS.map(i => (
            <button key={i.id} aria-pressed={targetIds.includes(i.id)} onClick={() => toggleTarget(i.id)} style={chip(targetIds.includes(i.id))}>{i.name}</button>
          ))}
        </div>
      </section>

      {/* 4 · Risultato */}
      <section style={card} aria-labelledby="pt-result">
        <span id="pt-result" style={sectionLabel}>4 · Parti</span>
        {result.error && <p role="alert" style={errorText}>{result.error}</p>}
        {!result.outputs.length && !result.error && (
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
            {sourceXml ? 'Scegli almeno uno strumento.' : 'Inserisci una parte valida per vedere il risultato.'}
          </p>
        )}
        {shown && (
          <>
            <div role="tablist" aria-label="Parte mostrata" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {result.outputs.map(o => (
                <button key={o.instrument.id} role="tab" aria-selected={o === shown} onClick={() => setShownId(o.instrument.id)} style={chip(o === shown)}>
                  {o.instrument.name}{o.above + o.below ? ' ⚠' : ''}
                </button>
              ))}
            </div>
            {rangeWarning(shown) && <p role="status" style={{ margin: 0, fontSize: 12.5, color: '#d97706' }}>{rangeWarning(shown)}</p>}
            <PartPreview xml={shownXml} label={`Parte per ${shown.instrument.name}`} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button style={button()} onClick={() => download(`${title}-${shown.instrument.id}.musicxml`, shown.xml)}>⬇ MusicXML {shown.instrument.name}</button>
              <button style={button(true)} onClick={() => download(`${title}-parti.musicxml`, combineParts(browserCodec, result.outputs.map(o => o.xml)))}>
                ⬇ Tutte le parti ({result.outputs.length})
              </button>
            </div>
            <p style={hint}>In MuseScore apri "Tutte le parti" e usa Parti → Genera per i PDF separati.</p>
          </>
        )}
      </section>
    </div>
  );
}
