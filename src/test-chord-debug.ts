import { parseChordSymbol } from './features/chord-voicings/services/chordParser';
import { generateVoicings } from './features/chord-voicings/services/voicingGenerator';

// Test Cmaj7
const parsed = parseChordSymbol('Cmaj7');
console.log('=== CMAJ7 PARSING ===');
console.log('Parsed:', parsed);

if (parsed) {
  const voicings = generateVoicings(parsed, { style: 'basic' });
  console.log('\n=== VOICINGS ===');
  voicings.forEach((v) => {
    console.log(`\n${v.label}:`);
    console.log('Left Hand:', v.leftHand.notes, v.leftHand.octaves);
    console.log('Right Hand:', v.rightHand.notes, v.rightHand.octaves);
    console.log('Specific Notes:', v.specificNotes);
  });
}
