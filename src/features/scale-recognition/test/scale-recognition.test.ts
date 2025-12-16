/**
 * TEST CASES - Scale Recognition Engine
 *
 * Test completi per normalizzazione, matching e scoring
 */

import { recognizeScales, normalizeToPitchClass, normalizeNotes } from './scale-recognition';

// ============================================================================
// TEST 1: Normalizzazione note e enharmonics
// ============================================================================

console.log('='.repeat(80));
console.log('TEST 1: NORMALIZZAZIONE NOTE E ENHARMONICS');
console.log('='.repeat(80));

const enharmonicTests = [
  { input: 'C', expected: 0 },
  { input: 'B#', expected: 0 },
  { input: 'C#', expected: 1 },
  { input: 'Db', expected: 1 },
  { input: 'C#/Db', expected: 1 },
  { input: 'E', expected: 4 },
  { input: 'Fb', expected: 4 },
  { input: 'F', expected: 5 },
  { input: 'E#', expected: 5 },
  { input: 'B', expected: 11 },
  { input: 'Cb', expected: 11 },
  { input: 'C♯', expected: 1 },
  { input: 'D♭', expected: 1 },
];

let passedTests = 0;
enharmonicTests.forEach((test) => {
  const result = normalizeToPitchClass(test.input);
  const passed = result === test.expected;
  console.log(`${passed ? '✅' : '❌'} "${test.input}" → ${result} (expected: ${test.expected})`);
  if (passed) passedTests++;
});

console.log(`\nRisultato: ${passedTests}/${enharmonicTests.length} test passati\n`);

// ============================================================================
// TEST 2: C Ionian (Major) - Perfect Match
// ============================================================================

console.log('='.repeat(80));
console.log('TEST 2: C MAJOR (IONIAN) - PERFECT MATCH');
console.log('='.repeat(80));

const test2Input = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const result2 = recognizeScales(test2Input, 5);

console.log('\n📥 Input:', test2Input.join(', '));
console.log('📊 Normalized:', result2.input_notes_normalized.join(', '));
console.log('🎹 Pitch Classes:', result2.input_pitch_classes.join(', '));
console.log('\n🏆 Top 5 Candidates:\n');

result2.candidates.forEach((candidate, index) => {
  console.log(`${index + 1}. ${candidate.scale_name} (${candidate.root})`);
  console.log(`   Score: ${candidate.score_0_100} | Probability: ${candidate.probability_percent}%`);
  console.log(`   Coverage: ${(candidate.coverage_ratio * 100).toFixed(1)}% | Purity: ${(candidate.purity_ratio * 100).toFixed(1)}%`);
  console.log(`   Extra: [${candidate.extra_notes.join(', ')}] | Missing: [${candidate.missing_scale_notes.join(', ')}]`);
  console.log(`   Explanation: ${candidate.explanation}`);
  console.log('');
});

// ============================================================================
// TEST 3: D Dorian vs C Ionian (stesse note, root diversa)
// ============================================================================

console.log('='.repeat(80));
console.log('TEST 3: D DORIAN vs C IONIAN (stesse note, root diversa)');
console.log('='.repeat(80));

const test3Input = ['D', 'E', 'F', 'G', 'A', 'B', 'C'];
const result3 = recognizeScales(test3Input, 5);

console.log('\n📥 Input:', test3Input.join(', '));
console.log('📊 Normalized:', result3.input_notes_normalized.join(', '));
console.log('\n🏆 Top 5 Candidates:\n');

result3.candidates.forEach((candidate, index) => {
  console.log(
    `${index + 1}. ${candidate.scale_name} (${candidate.root}) - ${candidate.score_0_100}% | Prob: ${candidate.probability_percent}%`
  );
  console.log(`   ${candidate.explanation}`);
  console.log('');
});

// ============================================================================
// TEST 4: C Blues - con blue note
// ============================================================================

console.log('='.repeat(80));
console.log('TEST 4: C BLUES (con blue note ♭5)');
console.log('='.repeat(80));

const test4Input = ['C', 'Eb', 'F', 'Gb', 'G', 'Bb'];
const result4 = recognizeScales(test4Input, 5);

console.log('\n📥 Input:', test4Input.join(', '));
console.log('📊 Normalized:', result4.input_notes_normalized.join(', '));
console.log('\n🏆 Top 5 Candidates:\n');

result4.candidates.forEach((candidate, index) => {
  console.log(`${index + 1}. ${candidate.scale_name} (${candidate.root})`);
  console.log(`   Score: ${candidate.score_0_100} | Prob: ${candidate.probability_percent}%`);
  console.log(`   Matched: [${candidate.matched_notes.join(', ')}]`);
  console.log(`   Extra: [${candidate.extra_notes.join(', ')}]`);
  console.log('');
});

// ============================================================================
// TEST 5: F# Ionian (con diesis)
// ============================================================================

console.log('='.repeat(80));
console.log('TEST 5: F# MAJOR (IONIAN) - gestione diesis');
console.log('='.repeat(80));

const test5Input = ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E'];
const result5 = recognizeScales(test5Input, 5);

console.log('\n📥 Input:', test5Input.join(', '));
console.log('📊 Normalized:', result5.input_notes_normalized.join(', '));
console.log('\n🏆 Top 5 Candidates:\n');

result5.candidates.forEach((candidate, index) => {
  console.log(
    `${index + 1}. ${candidate.scale_name} (${candidate.root}) - ${candidate.score_0_100}% | Prob: ${candidate.probability_percent}%`
  );
});

// ============================================================================
// TEST 6: Octatonic Half-Whole (simmetrica)
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('TEST 6: OCTATONIC HALF-WHOLE (C) - scala simmetrica');
console.log('='.repeat(80));

const test6Input = ['C', 'Db', 'Eb', 'E', 'Gb', 'G', 'A', 'Bb'];
const result6 = recognizeScales(test6Input, 5);

console.log('\n📥 Input:', test6Input.join(', '));
console.log('📊 Normalized:', result6.input_notes_normalized.join(', '));
console.log('\n🏆 Top 5 Candidates:\n');

result6.candidates.forEach((candidate, index) => {
  console.log(`${index + 1}. ${candidate.scale_name} (${candidate.root})`);
  console.log(`   Score: ${candidate.score_0_100} | Prob: ${candidate.probability_percent}%`);
  console.log(`   ${candidate.explanation}`);
  console.log('');
});

// ============================================================================
// TEST 7: Input incompleto (5 note) - pentatonica vs diatonico
// ============================================================================

console.log('='.repeat(80));
console.log('TEST 7: INPUT INCOMPLETO (5 note) - ambiguità');
console.log('='.repeat(80));

const test7Input = ['C', 'D', 'E', 'G', 'A'];
const result7 = recognizeScales(test7Input, 8);

console.log('\n📥 Input:', test7Input.join(', '));
console.log('📊 Normalized:', result7.input_notes_normalized.join(', '));
console.log('\n🏆 Top 8 Candidates:\n');

result7.candidates.forEach((candidate, index) => {
  console.log(`${index + 1}. ${candidate.scale_name} (${candidate.root})`);
  console.log(`   Score: ${candidate.score_0_100} | Prob: ${candidate.probability_percent}%`);
  console.log(`   Coverage: ${(candidate.coverage_ratio * 100).toFixed(1)}% | Missing: ${candidate.missing_scale_notes.length}`);
  console.log('');
});

// ============================================================================
// TEST 8: Note extra fuori scala (penalità)
// ============================================================================

console.log('='.repeat(80));
console.log('TEST 8: NOTE EXTRA FUORI SCALA (penalità)');
console.log('='.repeat(80));

const test8Input = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Db', 'F#'];
const result8 = recognizeScales(test8Input, 5);

console.log('\n📥 Input:', test8Input.join(', '));
console.log('📊 Normalized:', result8.input_notes_normalized.join(', '));
console.log('\n🏆 Top 5 Candidates:\n');

result8.candidates.forEach((candidate, index) => {
  console.log(`${index + 1}. ${candidate.scale_name} (${candidate.root})`);
  console.log(`   Score: ${candidate.score_0_100} | Prob: ${candidate.probability_percent}%`);
  console.log(`   Extra notes: [${candidate.extra_notes.join(', ')}]`);
  console.log(`   ${candidate.explanation}`);
  console.log('');
});

// ============================================================================
// TEST 9: Minor Pentatonic (A minor pentatonic)
// ============================================================================

console.log('='.repeat(80));
console.log('TEST 9: A MINOR PENTATONIC');
console.log('='.repeat(80));

const test9Input = ['A', 'C', 'D', 'E', 'G'];
const result9 = recognizeScales(test9Input, 5);

console.log('\n📥 Input:', test9Input.join(', '));
console.log('\n🏆 Top 5 Candidates:\n');

result9.candidates.forEach((candidate, index) => {
  console.log(`${index + 1}. ${candidate.scale_name} (${candidate.root}) - ${candidate.score_0_100}%`);
  console.log(`   Probability: ${candidate.probability_percent}%`);
  console.log(`   ${candidate.explanation}`);
  console.log('');
});

// ============================================================================
// TEST 10: Lydian con #4 caratteristico
// ============================================================================

console.log('='.repeat(80));
console.log('TEST 10: C LYDIAN (con #4 caratteristico)');
console.log('='.repeat(80));

const test10Input = ['C', 'D', 'E', 'F#', 'G', 'A', 'B'];
const result10 = recognizeScales(test10Input, 5);

console.log('\n📥 Input:', test10Input.join(', '));
console.log('\n🏆 Top 5 Candidates:\n');

result10.candidates.forEach((candidate, index) => {
  console.log(`${index + 1}. ${candidate.scale_name} (${candidate.root}) - ${candidate.score_0_100}%`);
  console.log(`   Mode: ${candidate.mode_name || 'N/A'}`);
  console.log(`   ${candidate.explanation}`);
  console.log('');
});

// ============================================================================
// SUMMARY
// ============================================================================

console.log('='.repeat(80));
console.log('PERFORMANCE SUMMARY');
console.log('='.repeat(80));

const allResults = [result2, result3, result4, result5, result6, result7, result8, result9, result10];
const avgTime = allResults.reduce((sum, r) => sum + r.analysis_metadata.execution_time_ms, 0) / allResults.length;
const avgCandidates = allResults.reduce((sum, r) => sum + r.analysis_metadata.total_candidates_analyzed, 0) / allResults.length;

console.log(`\n📊 Statistiche:`);
console.log(`   Tempo medio di esecuzione: ${avgTime.toFixed(2)}ms`);
console.log(`   Candidati analizzati in media: ${avgCandidates.toFixed(0)}`);
console.log(`   Test eseguiti: ${allResults.length + 1}`);
console.log('\n✅ Test suite completata!\n');
