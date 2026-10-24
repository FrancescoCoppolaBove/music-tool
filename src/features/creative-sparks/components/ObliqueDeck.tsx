import { useState } from 'react';
import { storageGet, storageSet } from '@shared/utils/storage';
import { AREA_LABELS, CARDS, type CardArea, type ObliqueCard } from '../cards';
import { drawCard } from '../logic';

const FAVORITES_KEY = 'creative_sparks_cards_v1';
const RECENT_LIMIT = 24;
const AREAS = Object.keys(AREA_LABELS) as CardArea[];

const byId = new Map(CARDS.map(c => [c.id, c]));

export default function ObliqueDeck() {
  const [area, setArea] = useState<CardArea | 'all'>('all');
  const [card, setCard] = useState<ObliqueCard | null>(null);
  const [showHow, setShowHow] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = storageGet<unknown>(FAVORITES_KEY, []);
    return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string' && byId.has(id)) : [];
  });

  const pool = area === 'all' ? CARDS : CARDS.filter(c => c.area === area);

  function draw() {
    const next = drawCard(pool, recent, Math.random);
    if (!next) return;
    setCard(next);
    setShowHow(false);
    setRecent(r => [next.id, ...r.filter(id => id !== next.id)].slice(0, RECENT_LIMIT));
  }

  function toggleFavorite(id: string) {
    const next = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(next);
    storageSet(FAVORITES_KEY, next);
  }

  const history = recent.slice(1, 7).map(id => byId.get(id)!);
  const saved = card ? favorites.includes(card.id) : false;

  return (
    <div className="csp-deck">
      <div className="csp-deck-main">
        <fieldset className="csp-chips">
          <legend>Pesca da</legend>
          <button type="button" aria-pressed={area === 'all'} onClick={() => setArea('all')}>Tutto il mazzo <span>{CARDS.length}</span></button>
          {AREAS.map(a => (
            <button type="button" key={a} aria-pressed={area === a} onClick={() => setArea(a)}>{AREA_LABELS[a]}</button>
          ))}
        </fieldset>

        <div className="csp-card-stage" aria-live="polite">
          {card ? (
            <article key={card.id} className="csp-card">
              <span className="csp-card-area">{AREA_LABELS[card.area]}</span>
              <p className="csp-card-text">{card.text}</p>
              {showHow
                ? <p className="csp-card-how"><b>In pratica · </b>{card.how}</p>
                : <button type="button" className="csp-card-reveal" onClick={() => setShowHow(true)}>Come applicarla</button>}
              <button
                type="button"
                className={`csp-fav ${saved ? 'is-saved' : ''}`}
                aria-pressed={saved}
                aria-label={saved ? 'Rimuovi la carta dai preferiti' : 'Salva la carta nei preferiti'}
                title={saved ? 'Rimuovi dai preferiti' : 'Salva nei preferiti'}
                onClick={() => toggleFavorite(card.id)}
              >{saved ? '★' : '☆'}</button>
            </article>
          ) : (
            <div className="csp-card csp-card-back">
              <span className="csp-card-area">Carte oblique</span>
              <p className="csp-card-text">Quando sei bloccato, pesca una carta e prendila alla lettera, anche se ti sembra assurda.</p>
            </div>
          )}
        </div>

        <div className="csp-deck-actions">
          <button type="button" className="csp-primary" onClick={draw}>{card ? 'Pesca un’altra carta' : 'Pesca una carta'}</button>
          <span className="csp-muted">Non ripete le ultime {Math.min(RECENT_LIMIT, pool.length - 1)} carte pescate.</span>
        </div>
      </div>

      <aside className="csp-deck-side">
        <section>
          <h3>Come si usano</h3>
          <ol className="csp-steps">
            <li>Pesca quando ti blocchi, non prima.</li>
            <li>Leggila e applicala per dieci minuti, anche se sembra non c’entrare.</li>
            <li>Se non funziona, pesca ancora. Non scegliere la carta che preferisci.</li>
          </ol>
        </section>
        {history.length > 0 && (
          <section>
            <h3>Pescate prima</h3>
            <ul className="csp-mini-list">
              {history.map(c => <li key={c.id}><button type="button" onClick={() => { setCard(c); setShowHow(false); }}>{c.text}</button></li>)}
            </ul>
          </section>
        )}
        <section>
          <h3>Preferite <span className="csp-count">{favorites.length}</span></h3>
          {favorites.length === 0
            ? <p className="csp-muted">Salva con ☆ le carte che vuoi tenere a portata di mano. Restano su questo dispositivo.</p>
            : <ul className="csp-mini-list">
                {favorites.map(id => byId.get(id)!).map(c => <li key={c.id}><button type="button" onClick={() => { setCard(c); setShowHow(true); }}>{c.text}</button></li>)}
              </ul>}
        </section>
        <p className="csp-credit">Carte originali scritte per tonic, ispirate al metodo delle <a href="https://en.wikipedia.org/wiki/Oblique_Strategies" target="_blank" rel="noreferrer">Oblique Strategies</a> di Brian Eno e Peter Schmidt (1975).</p>
      </aside>
    </div>
  );
}
