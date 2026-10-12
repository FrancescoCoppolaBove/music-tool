import assert from 'node:assert/strict';
import test from 'node:test';
import { parseAiCompositionProposal } from './aiCompositionProposal';

const keys = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const modes = ['major', 'dorian', 'minor', 'lydian', 'mixolydian'];
const meters = ['4/4', '3/4', '6/8'];
const valid = JSON.stringify({ title: 'Blue window', explanation: 'A compact Dorian vamp with a brighter upper chord.', tonic: 'C', mode: 'dorian', bpm: 102, meter: '4/4', chords: ['Cm9', 'F13'] });

test('proposal parser accepts a fenced structured answer and preserves its musical data', () => {
  const proposal = parseAiCompositionProposal(`\`\`\`json\n${valid}\n\`\`\``, keys, modes, meters);
  assert.equal(proposal.title, 'Blue window');
  assert.deepEqual(proposal.chords, ['Cm9', 'F13']);
});

test('proposal parser rejects invalid settings and chord symbols before application', () => {
  const invalidChord = valid.replace('F13', 'Cmadeup');
  assert.throws(() => parseAiCompositionProposal(invalidChord, keys, modes, meters), /chord symbols/);
  const invalidBpm = valid.replace('102', '500');
  assert.throws(() => parseAiCompositionProposal(invalidBpm, keys, modes, meters), /tempo or meter/);
});
