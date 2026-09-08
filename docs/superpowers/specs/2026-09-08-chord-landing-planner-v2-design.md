# Chord Landing Planner v2 — Design Spec

## Obiettivo

Espandere la feature `chord-landing` in due direzioni:

1. **Arricchimento del database** con nuovi approcci tratti dai metodi Berklee (Mulholland/Hojnacki e Ted Pease).
2. **Modalità Journey** — selettore opzionale "From chord" che, quando impostato, mostra un'analisi armonica della relazione X→Y e mette in evidenza le approach più rilevanti per quel percorso specifico.

La feature esistente rimane invariata in assenza del chord sorgente: zero regressioni.

---

## File coinvolti

- `src/features/chord-landing/ChordLandingFeature.tsx` — unico file da modificare

---

## 1. Nuovi approcci Berklee

8 nuove `Approach` da aggiungere all'array `APPROACHES` esistente. Tutti i campi (`id`, `name`, `complexity`, `steps`, `moods`, `genres`, `theory`, `tip`, `worksFor`) seguono la struttura già in uso.

### 1.1 Chromatic Mediant bIII → I
- **id**: `chromatic-mediant-bIII`
- **complexity**: 2
- **steps**: `[{ interval: '3m', quality: 'maj7', role: 'bIIImaj7 (chromatic mediant)' }]`
- **source**: Mulholland ch.10 — Constant Structures
- **moods**: cinematic, modal, jazz
- **worksFor**: major, any
- **theory**: La mediante cromatica bIII (Ebmaj7 → Cmaj7) è un accordo della stessa qualità con radice una terza minore sopra. Non ha tensione di tritono — la sua forza viene dalla relazione cromatica parallela e dalla texture costante. Caratteristico delle "constant structure progressions" Berklee: stesso voicing, stesso colore, spostato cromaticamente.
- **tip**: La voice leading è quasi parallela — mantieni la stessa forma di voicing e scendila di tre semitoni. Ebmaj7 → Cmaj7 suona sorprendentemente naturale nonostante la relazione non-diatonica.

### 1.2 bVI Direct → I
- **id**: `bVI-direct`
- **complexity**: 2
- **steps**: `[{ interval: '6m', quality: '', role: 'bVI (modal interchange)' }]`
- **source**: Mulholland ch.5 — Modal Interchange
- **moods**: cinematic, gospel, r&b, modal
- **worksFor**: major, any
- **theory**: L'accordo bVI (Ab → C) prestato dal minore parallelo risolve direttamente alla tonica senza passare per V7. Diverso da "bVImaj7 → V7" che usa V7 come trampolino. Questa versione diretta ha un sapore più modale e meno teso — il bVI "galleggia" sulla tonica.
- **tip**: Funziona meglio con bVI come accordo maior (Abmaj7 → C) o come triade maggiore (Ab → C). In R&B spesso è bVI → I sul cambio di sezione. Prova anche bVI9 → Imaj9 per massimo colore.

### 1.3 Extended Dominant V7/V → I (bypassa V)
- **id**: `extended-dom-skip`
- **complexity**: 2
- **steps**: `[{ interval: '2M', quality: '7', role: 'V7/V (extended dominant)' }]`
- **source**: Mulholland ch.2 — Extended Dominants
- **moods**: jazz, bluesy, gospel
- **worksFor**: major, any
- **theory**: Il dominante secondario V7/V (D7 in C) normalmente risolve a V (G7), che poi risolve a I. Qui si salta V e si risolve direttamente su I — una "deceptive extension" del movimento di dominante. D7 → C bypassa G7. La tensione del tritono (F#-C in D7) risolve comunque soddisfacentemente su C.
- **tip**: L'effetto è di un dominante "da lontano" che arriva prima del previsto. Brevissimo — non dargli più di un beat. Se lo tieni più lungo, l'orecchio si aspetta G7 e la mancata risoluzione intermedia diventa straniante anziché fluida.

### 1.4 Modal Interchange Chain bVI → bVII → I
- **id**: `modal-interchange-chain`
- **complexity**: 2
- **steps**: [
    `{ interval: '6m', quality: '', role: 'bVI (parallel minor)' }`,
    `{ interval: '7m', quality: '', role: 'bVII (parallel minor)' }`
  ]
- **source**: Mulholland ch.5 Modal Interchange + Pease ch.2 Tonal Harmony
- **moods**: r&b, cinematic, modal, jazz
- **worksFor**: major, any
- **theory**: Due accordi prestati dal minore parallelo (bVI e bVII) che salgono per gradi interi verso I. La progressione Ab → Bb → C è la cifra stilistica di innumerevoli successi soul, R&B e pop moderno. Ogni accordo ha funzione di interscambio modale: bVI = accordo eolio/frigio, bVII = accordo dorico/misto. Insieme creano un senso di slancio ascendente verso la tonica.
- **tip**: Il tempo è cruciale: dai un beat o mezzo a bVI, poi bVII entra sul mezzo beat e C arriva sul 1. "Let It Be" dei Beatles usa Ab → Bb → C come pattern centrale. Funziona sia con triadi che con accordi estesi (Abmaj9 → Bb9 → Cmaj9).

### 1.5 Full Extended ii-V (ii/V → V/V → V → I)
- **id**: `full-extended-ii-V`
- **complexity**: 3
- **steps**: [
    `{ interval: '6M', quality: 'm7', role: 'ii/V (ii del dominante secondario)' }`,
    `{ interval: '2M', quality: '7', role: 'V7/V (dominante secondario)' }`,
    `{ interval: '5P', quality: '7', role: 'V7' }`
  ]
- **source**: Mulholland ch.2 — Extended Dominants + II V Progression
- **moods**: jazz, classical
- **worksFor**: major, any
- **theory**: La catena estesa aggiunge il ii del dominante secondario prima di V7/V → V7 → I. In C: Am7 → D7 → G7 → C. Am7 è il ii7 di D7 (V7/V), quindi in realtà stai facendo due ii-V concatenati: ii/V → V/V → V → I. Ogni anello della catena usa il tritono del successivo come leading tone.
- **tip**: Questa è la catena che senti nei turnaround di Autumn Leaves e di decine di standard. A differenza del "ragtime VI-ii-V" già in database (che usa VI7 dominante), questa versione usa Am7 — più morbida, con il sapore del ii diatonico. Perfetta per un turnaround lento di 4 battute (una per accordo).

### 1.6 SubV of V → V → I
- **id**: `subV-of-V`
- **complexity**: 3
- **steps**: [
    `{ interval: '2m', quality: '7', role: 'bII7 (SubV/V, tritone sub del V7/V)' }`,
    `{ interval: '5P', quality: '7', role: 'V7' }`
  ]
- **source**: Mulholland ch.3 — Substitute Dominants
- **moods**: jazz, chromatic, cinematic
- **worksFor**: major, any
- **theory**: Il tritono sub del V7/V. In C: Db7 (SubV di G7) → G7 → C. Db7 scende per mezzo tono a C... ma prima si ferma su G7! La doppia risoluzione crea un effetto di "doppio tritono": Db7 risolve per moto cromatico discendente a G7 (Db→G è tritono, Ab→G è mezzo tono), e G7 poi risolve normalmente a C. Bass line: Db → G → C — tritone jump then perfect 4th.
- **tip**: La bass line Db → G → C è il segreto di questo approccio. Il salto di tritono nel basso seguito dalla quarta perfetta è molto caratteristico del bebop. Miles Davis e Clifford Brown usano questa formula nel mezzo di frasi veloci. Breve sull'accordo di Db7.

### 1.7 Lydian Tritone Approach #IVmaj7 → I
- **id**: `lydian-tritone`
- **complexity**: 3
- **steps**: [
    `{ interval: '4A', quality: 'maj7', role: '#IVmaj7 (lydian tritone)' }`
  ]
- **source**: Mulholland ch.10 — Constant Structures + ch.9 Modal Harmony
- **moods**: modal, experimental, jazz, cinematic
- **worksFor**: major, any
- **theory**: F#maj7 → Cmaj7: stessa qualità, radici a distanza di tritono. A differenza del tritone sub (bII7 → I, dominante), qui entrambi gli accordi sono maggiori — nessuna tensione di tritono interna, solo la relazione cromatica esterna. Il F#maj7 suona "Lidio" rispetto a C (il #4 di C è F#). Risoluzione per moto di tritono senza funzione dominante — l'effetto è ambiguo, quasi cinematografico.
- **tip**: Lascia risuonare il F#maj7 a lungo prima di risolvere. La mancanza di tensione interna lo rende stabile di per sé — il suo potere è tutto nella sorpresa della risoluzione per tritono. Funziona meglio in contesti modali o cinematografici dove non ci si aspetta la cadenza tradizionale. Jacob Collier usa molto questo tipo di relazione.

### 1.8 Symmetric Dominant V7(b9,#9,#11,13) → I
- **id**: `symmetric-dominant`
- **complexity**: 3
- **steps**: [
    `{ interval: '5P', quality: '7', role: 'V7(b9,#9,#11,13) — symmetric dominant' }`
  ]
- **source**: Mulholland ch.1 — The Symmetric Dominant Scale
- **moods**: jazz, chromatic, gospel
- **worksFor**: major, any
- **theory**: La symmetric dominant scale (Mixolydian b9, #9, #11, 13) combina le tensioni alterate (b9, #9) con la tredicesima diatonica (T13). Questo crea un ponte uditivo tra la tredicesima e la terza della tonica (T13 di V7 = 3 di I), creando un'anticipazione melodica incorporata nell'accordo. G7(b9,#9,#11,13) → Cmaj7: il E naturale (T13 di G7) diventa direttamente la terza di Cmaj7.
- **tip**: Voicing ideale: radice in basso, poi b7 e 3 (shell), poi b9/#9 in voce intermedia, #11 e 13 in alto. Il #11 (C# su G7) è enharmonically il b5 — non la tonica di arrivo. La simmetria del half-whole pattern lo rende intercambiabile in quattro trasposizioni.

---

## 2. Stato React aggiuntivo

```typescript
const [sourceOpen, setSourceOpen] = useState(false);
const [fromRoot, setFromRoot] = useState<string>('D');
const [fromQuality, setFromQuality] = useState<string>('m7');
```

La Journey Analysis è attiva solo quando `sourceOpen && fromRoot !== null`.

---

## 3. Nuove funzioni pure

### `journeyInterval(fromRoot: string, toRoot: string): number`
Calcola i semitoni da `fromRoot` UP a `toRoot` (0–11) usando `Note.midi()` di Tonal.

```typescript
function journeyInterval(fromRoot: string, toRoot: string): number {
  const from = Note.midi(fromRoot + '4') ?? 0;
  const to = Note.midi(toRoot + '4') ?? 0;
  return (to - from + 12) % 12;
}
```

### `analyzeJourney(interval, fromQuality, targetQuality): JourneyAnalysis`
Mappa l'intervallo a: `role` (etichetta funzionale), `label` (testo descrittivo breve), `highlightIds` (lista di approach ID da mettere in evidenza).

Tabella di mapping:

| interval | role | highlightIds |
|----------|------|--------------|
| 5 | "V — dominante" | vsus4-alone, vsus4-then-V7, float-chord, perfect-cadence, altered-ii-V, vsusb9-then-V7alt |
| 10 | "ii — sopratonica" | basic-ii-V, altered-ii-V, tritone-ii-V, vsusb9-then-V7alt, ii-dim-V-minor |
| 7 | "IV — sottodominante" | pop-IV-V, backdoor-ii-V, gospel-dim, minor-plagal, secondary-subdominant |
| 2 | "bVII — backdoor" | backdoor, backdoor-ii-V, float-chord, float-chord-altered, modal-interchange-chain |
| 4 | "bVI — interscambio modale" | bVI-V7, bVI-direct, modal-interchange-chain |
| 11 | "bII — Napoletano/SubV" | tritone-sub, relative-ii-of-subv, phrygian, subV-of-V |
| 1 | "VII — sensibile" | dim-leading, half-step-chromatic |
| 3 | "VI — mediante relativa" | ragtime-VI-ii-V, full-chain-of-5ths, minor-to-major |
| 9 | "bIII — mediante cromatica" | coltrane-fragment, chromatic-mediant-bIII, chromatic-descent |
| 6 | "#IV — tritono" | tritone-oscillation, lydian-tritone, superimposed-chain |
| 8 | "III — mediante maggiore" | full-chain-of-5ths, ii-V-of-iii-surprise |
| 0 | "Stessa radice — cambio qualità" | secondary-subdominant, minor-plagal, vsus4-alone |

### `getJourneyHighlights(approaches, highlightIds): Approach[]`
Filtra `APPROACHES` per ID e li ordina secondo l'ordine di `highlightIds`, max 5.

---

## 4. Nuovi componenti UI

### `FromChordPanel` (inline, non estratto in file separato)
Pannello collassabile sotto il Target selector. Toggle ON/OFF con chevron. Quando aperto: stessi Root + Quality selector del target. Reset a `fromRoot` default quando chiuso.

### `JourneyAnalysisBanner` (inline)
Visible solo quando `sourceOpen && fromRoot`. Contiene:
- Intestazione: `[fromRoot+fromQuality]  ──→  [targetChord]`
- Label relazione: e.g. "Dm7 è il **ii7** di Gmaj7 — sei in territorio pre-dominante"
- Journey Highlights: massimo 5 `ApproachCard` con border `#f59e0b` e badge `★ Journey`

Le ApproachCard in highlight usano `expandedId` condiviso con la lista principale — aprirne una in highlights la apre anche sotto.

---

## 5. Comportamento catena con Source impostato

Quando `fromRoot` è impostato, la funzione `getChain()` viene chiamata per ogni ApproachCard con un parametro aggiuntivo `sourceChord`:

```
[fromChord] → [step1] → [step2] → ... → [targetChord]
```

Il `fromChord` appare come primo elemento della catena, con stile distinto (grigio chiaro, nessun glow) per indicare "da dove parti".

---

## 6. Ordine di rendering finale

```
Header
Target Chord selector (invariato)
From Chord panel (collapsible) [NUOVO]
  └─ Journey Analysis Banner [NUOVO, se source attivo]
       └─ Journey Highlights (≤5 ApproachCard con badge ★) [NUOVO]
Filters (invariato)
Results summary (invariato)
Complexity legend (invariato)
Tutte le ApproachCard (invariato, ora 30+ card totali)
Footer note (invariato)
```

---

## 7. Non incluso in scope

- Nessuna nuova dipendenza npm
- Nessun nuovo file (tutto in `ChordLandingFeature.tsx`)
- Nessun endpoint backend
- Nessuna modifica ad `App.tsx` o alla navigazione
- Nessuna persistenza in localStorage del From chord (è uno stato di sessione)
