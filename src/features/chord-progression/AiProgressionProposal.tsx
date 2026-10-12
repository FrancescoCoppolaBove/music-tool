import { useState } from 'react';
import { parseAiCompositionProposal, type AiCompositionProposal } from '../harmony-composition-lab/aiCompositionProposal';
const MODES = [
  ['major', 'Ionian'], ['dorian', 'Dorian'], ['phrygian', 'Phrygian'], ['lydian', 'Lydian'],
  ['mixolydian', 'Mixolydian'], ['minor', 'Aeolian'], ['locrian', 'Locrian'],
  ['harmonic minor', 'Harmonic minor'], ['melodic minor', 'Jazz melodic minor'],
  ['lydian dominant', 'Lydian dominant'], ['altered', 'Altered'],
  ['major pentatonic', 'Major pentatonic'], ['minor pentatonic', 'Minor pentatonic'], ['minor blues', 'Minor blues'],
  ['hirajoshi', 'Hirajoshi · equal-tempered model'], ['in-sen', 'In-sen · equal-tempered model'],
  ['iwato', 'Iwato · equal-tempered model'], ['pelog', 'Pelog · equal-tempered model'],
  ['balinese', 'Balinese · equal-tempered model'], ['persian', 'Persian · equal-tempered model'],
  ['hungarian minor', 'Hungarian minor'], ['double harmonic major', 'Double harmonic major'],
] as const;
const KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const styles: React.CSSProperties = {
  background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 18,
};
const buttonStyle: React.CSSProperties = {
  background: '#21262d', color: '#e6edf3', border: '1px solid #30363d', borderRadius: 8,
  padding: '8px 12px', cursor: 'pointer', font: 'inherit',
};

export default function AiProgressionProposal({ tonic, mode, chords, bpm, meter, onAccept }: { tonic: string; mode: string; chords: string[]; bpm: number; meter: string; onAccept: (proposal: AiCompositionProposal) => void }) {
  const [assistantPrompt, setAssistantPrompt] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError] = useState('');
  const [assistantProposal, setAssistantProposal] = useState<AiCompositionProposal | null>(null);
  const [accepted, setAccepted] = useState(false);
  async function requestAssistantProposal() {
    if (!assistantPrompt.trim() || assistantLoading) return;
    setAssistantLoading(true); setAssistantError(''); setAssistantProposal(null); setAccepted(false);
    const request = [
      `Musician request: ${assistantPrompt.trim()}`,
      `Current composition context: key ${tonic}, mode ${mode}, tempo ${bpm} BPM, meter ${meter}.`,
      `Current progression: ${chords.length ? chords.join(' | ') : '(none yet)'}.`,
      'Return one proposal in the required JSON schema. Use one chord per bar and keep every chord symbol valid.',
    ].join('\n');
    try {
      const response = await fetch('/.netlify/functions/buddy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: request, context: 'HARMONY_LAB_PROPOSAL' }),
      });
      const payload = await response.json() as { reply?: string; error?: string };
      if (!response.ok || !payload.reply) throw new Error(payload.error || 'The assistant is unavailable. Check the AI service configuration and try again.');
      const proposal = parseAiCompositionProposal(payload.reply, KEYS, MODES.map(([id]) => id), ['4/4', '3/4', '5/4', '6/8', '7/8']);
      setAssistantProposal(proposal);
    } catch (error) {
      setAssistantError(error instanceof Error ? error.message : 'Could not create a proposal. Try again.');
    } finally {
      setAssistantLoading(false);
    }
  }

  return (
      <section style={{ ...styles, display: 'grid', gap: 12 }}>
        <div><h2 style={{ margin: '0 0 4px', fontSize: 18 }}>AI composition assistant</h2><p style={{ margin: 0, color: '#8b949e', fontSize: 12 }}>Ask for a musical direction or an alternative. Suggestions are checked by the local theory engine before they can be loaded.</p></div>
        <label htmlFor="lab-ai-request" style={{ display: 'grid', gap: 6, color: '#8b949e', fontSize: 12 }}>What would you like to explore?
          <textarea id="lab-ai-request" rows={3} maxLength={500} value={assistantPrompt} onChange={event => setAssistantPrompt(event.target.value)} placeholder="Make this Dorian vamp more gospel, while keeping the key and tempo…" style={{ ...buttonStyle, resize: 'vertical', boxSizing: 'border-box' }} />
        </label>
        <button type="button" style={{ ...buttonStyle, justifySelf: 'start', borderColor: '#7c3aed' }} disabled={assistantLoading || !assistantPrompt.trim()} onClick={() => void requestAssistantProposal()}>{assistantLoading ? 'Generating proposal…' : 'Generate proposal'}</button>
        {assistantError && <div role="alert" style={{ color: '#fca5a5', fontSize: 12 }}>{assistantError}</div>}
        {assistantProposal && <article style={{ display: 'grid', gap: 9, padding: 13, background: '#0d1117', border: '1px solid #5b3a8a', borderRadius: 9 }}>
          <div><strong style={{ fontSize: 15 }}>{assistantProposal.title}</strong><div style={{ color: '#8b949e', fontSize: 11, marginTop: 3 }}>{assistantProposal.tonic} {assistantProposal.mode} · {assistantProposal.bpm} BPM · {assistantProposal.meter}</div></div>
          <div style={{ fontFamily: 'monospace', color: '#c4b5fd' }}>{assistantProposal.chords.join(' → ')}</div>
          <p style={{ margin: 0, color: '#c9d1d9', fontSize: 12, lineHeight: 1.5 }}>{assistantProposal.explanation}</p>
          <div style={{ color: '#8b949e', fontSize: 11 }}>Check the voicing and musical context by listening. The proposal has been checked for chord-symbol and setting validity.</div>
          <button type="button" style={{ ...buttonStyle, justifySelf: 'start' }} disabled={accepted} onClick={() => { if (assistantProposal) { onAccept(assistantProposal); setAccepted(true); } }}>{accepted ? 'Saved to My compositions' : 'Save proposal to My compositions'}</button>
        </article>}
      </section>

);
}
