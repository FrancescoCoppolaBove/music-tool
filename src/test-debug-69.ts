// test-debug-69.ts
import { parseChordSymbol } from './features/chord-voicings/services/chordParser';
import { generateVoicings } from './features/chord-voicings/services/voicingGenerator';

const parsed = parseChordSymbol('C6/9');
console.log('Parsed C6/9:', JSON.stringify(parsed, null, 2));

if (parsed) {
  const voicings = generateVoicings(parsed);
  console.log('fullChord:', voicings[0].fullChord);
}
