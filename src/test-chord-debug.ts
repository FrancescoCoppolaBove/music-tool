import { parseChordSymbol } from './features/chord-voicings/services/chordParser';
import { generateVoicings } from './features/chord-voicings/services/voicingGenerator';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

interface TestCase {
  symbol: string;
  expectedNotes: string[];
  category: string;
}

const TEST_CASES: TestCase[] = [
  // TRIADI BASE
  { symbol: 'C', expectedNotes: ['C', 'E', 'G'], category: 'Triadi - Maggiore' },
  { symbol: 'Cm', expectedNotes: ['C', 'D#', 'G'], category: 'Triadi - Minore' },
  { symbol: 'C-', expectedNotes: ['C', 'D#', 'G'], category: 'Triadi - Minore (alt)' },
  { symbol: 'Cdim', expectedNotes: ['C', 'D#', 'F#'], category: 'Triadi - Diminuita' },
  { symbol: 'C°', expectedNotes: ['C', 'D#', 'F#'], category: 'Triadi - Diminuita (°)' },
  { symbol: 'Caug', expectedNotes: ['C', 'E', 'G#'], category: 'Triadi - Aumentata' },
  { symbol: 'C+', expectedNotes: ['C', 'E', 'G#'], category: 'Triadi - Aumentata (+)' },

  // ACCORDI DI SETTIMA
  { symbol: 'Cmaj7', expectedNotes: ['C', 'E', 'G', 'B'], category: 'Settima - Maggiore' },
  { symbol: 'CΔ7', expectedNotes: ['C', 'E', 'G', 'B'], category: 'Settima - Maggiore (Δ)' },
  { symbol: 'C7', expectedNotes: ['C', 'E', 'G', 'A#'], category: 'Settima - Dominante' },
  { symbol: 'Cm7', expectedNotes: ['C', 'D#', 'G', 'A#'], category: 'Settima - Minore' },
  { symbol: 'C-7', expectedNotes: ['C', 'D#', 'G', 'A#'], category: 'Settima - Minore (-)' },
  { symbol: 'Cdim7', expectedNotes: ['C', 'D#', 'F#', 'A'], category: 'Settima - Diminuita' },
  { symbol: 'C°7', expectedNotes: ['C', 'D#', 'F#', 'A'], category: 'Settima - Diminuita (°)' },
  { symbol: 'Cm7b5', expectedNotes: ['C', 'D#', 'F#', 'A#'], category: 'Settima - Semidiminuita' },
  { symbol: 'Cø7', expectedNotes: ['C', 'D#', 'F#', 'A#'], category: 'Settima - Semidiminuita (ø)' },
  { symbol: 'CmMaj7', expectedNotes: ['C', 'D#', 'G', 'B'], category: 'Settima - Minore-Maggiore' },

  // ACCORDI DI SESTA
  { symbol: 'C6', expectedNotes: ['C', 'E', 'G', 'A'], category: 'Sesta - Maggiore' },
  { symbol: 'Cm6', expectedNotes: ['C', 'D#', 'G', 'A'], category: 'Sesta - Minore' },
  { symbol: 'C6/9', expectedNotes: ['C', 'D', 'E', 'G', 'A'], category: 'Sesta - 6/9' },

  // ACCORDI SOSPESI
  { symbol: 'Csus2', expectedNotes: ['C', 'D', 'G'], category: 'Sospesi - Sus2' },
  { symbol: 'Csus4', expectedNotes: ['C', 'F', 'G'], category: 'Sospesi - Sus4' },
  { symbol: 'C7sus4', expectedNotes: ['C', 'F', 'G', 'A#'], category: 'Sospesi - 7sus4' },

  // ADDED TONES
  { symbol: 'Cadd9', expectedNotes: ['C', 'D', 'E', 'G'], category: 'Add - add9' },
  { symbol: 'Cmadd9', expectedNotes: ['C', 'D', 'D#', 'G'], category: 'Add - madd9' },
  { symbol: 'Cadd2', expectedNotes: ['C', 'D', 'E', 'G'], category: 'Add - add2' },
  { symbol: 'Cadd4', expectedNotes: ['C', 'E', 'F', 'G'], category: 'Add - add4' },

  // ESTENSIONI - NONA
  { symbol: 'C9', expectedNotes: ['C', 'D', 'E', 'G', 'A#'], category: 'Nona - Dominante' },
  { symbol: 'Cmaj9', expectedNotes: ['C', 'D', 'E', 'G', 'B'], category: 'Nona - Maggiore' },
  { symbol: 'Cm9', expectedNotes: ['C', 'D', 'D#', 'G', 'A#'], category: 'Nona - Minore' },

  // ESTENSIONI - UNDICESIMA
  { symbol: 'C11', expectedNotes: ['C', 'D', 'E', 'F', 'G', 'A#'], category: 'Undicesima - Dominante' },
  { symbol: 'Cmaj11', expectedNotes: ['C', 'D', 'E', 'F', 'G', 'B'], category: 'Undicesima - Maggiore' },
  { symbol: 'Cm11', expectedNotes: ['C', 'D', 'D#', 'F', 'G', 'A#'], category: 'Undicesima - Minore' },

  // ESTENSIONI - TREDICESIMA
  { symbol: 'C13', expectedNotes: ['C', 'D', 'E', 'F', 'G', 'A', 'A#'], category: 'Tredicesima - Dominante' },
  { symbol: 'Cmaj13', expectedNotes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'], category: 'Tredicesima - Maggiore' },
  { symbol: 'Cm13', expectedNotes: ['C', 'D', 'D#', 'F', 'G', 'A', 'A#'], category: 'Tredicesima - Minore' },

  // ALTERAZIONI - QUINTA
  { symbol: 'C7b5', expectedNotes: ['C', 'E', 'F#', 'A#'], category: 'Alterazioni - 7♭5' },
  { symbol: 'C7#5', expectedNotes: ['C', 'E', 'G#', 'A#'], category: 'Alterazioni - 7♯5' },
  { symbol: 'Cmaj7#5', expectedNotes: ['C', 'E', 'G#', 'B'], category: 'Alterazioni - maj7♯5' },

  // ALTERAZIONI - NONA (FIX: Root C deve essere presente)
  { symbol: 'C7b9', expectedNotes: ['C', 'C#', 'E', 'G', 'A#'], category: 'Alterazioni - 7♭9' },
  { symbol: 'C7#9', expectedNotes: ['C', 'D#', 'E', 'G', 'A#'], category: 'Alterazioni - 7♯9' },
  { symbol: 'C9b5', expectedNotes: ['C', 'D', 'E', 'F#', 'A#'], category: 'Alterazioni - 9♭5' },

  // ALTERAZIONI - UNDICESIMA
  { symbol: 'C7#11', expectedNotes: ['C', 'E', 'F#', 'G', 'A#'], category: 'Alterazioni - 7♯11' },
  { symbol: 'Cmaj7#11', expectedNotes: ['C', 'E', 'F#', 'G', 'B'], category: 'Alterazioni - maj7♯11' },
  { symbol: 'C9#11', expectedNotes: ['C', 'D', 'E', 'F#', 'G', 'A#'], category: 'Alterazioni - 9♯11' },

  // ALTERAZIONI - TREDICESIMA
  { symbol: 'C7b13', expectedNotes: ['C', 'D', 'E', 'F', 'G', 'G#', 'A#'], category: 'Alterazioni - 7♭13' },
  { symbol: 'C13b9', expectedNotes: ['C', 'C#', 'E', 'F', 'G', 'A', 'A#'], category: 'Alterazioni - 13♭9' },
  { symbol: 'C13#11', expectedNotes: ['C', 'D', 'E', 'F#', 'G', 'A', 'A#'], category: 'Alterazioni - 13♯11' },

  // ALTERAZIONI COMBINATE
  { symbol: 'C7#9#5', expectedNotes: ['C', 'D#', 'E', 'G#', 'A#'], category: 'Combinate - 7♯9♯5' },
  { symbol: 'C7b9b5', expectedNotes: ['C', 'C#', 'E', 'F#', 'A#'], category: 'Combinate - 7♭9♭5' },
  { symbol: 'C7b9#11', expectedNotes: ['C', 'C#', 'E', 'F#', 'G', 'A#'], category: 'Combinate - 7♭9♯11' },

  // SLASH CHORDS
  { symbol: 'C/E', expectedNotes: ['C', 'E', 'G'], category: 'Slash - C/E' },
  { symbol: 'C7/G', expectedNotes: ['C', 'E', 'G', 'A#'], category: 'Slash - C7/G' },
  { symbol: 'Dm7/G', expectedNotes: ['D', 'F', 'A', 'C'], category: 'Slash - Dm7/G' },

  // ACCORDI COMPLESSI (JAZZ)
  { symbol: 'F#m7b5', expectedNotes: ['F#', 'A', 'C', 'E'], category: 'Jazz - F#m7♭5' },
  { symbol: 'Bb7#11', expectedNotes: ['A#', 'D', 'E', 'F', 'G#'], category: 'Jazz - B♭7♯11' },
  { symbol: 'Gbmaj9', expectedNotes: ['F#', 'G#', 'A#', 'C#', 'F'], category: 'Jazz - G♭maj9' },
  { symbol: 'Ebm11', expectedNotes: ['D#', 'F', 'F#', 'G#', 'A#', 'C#'], category: 'Jazz - E♭m11' },
];

function normalizeNotes(notes: string[]): string[] {
  return notes.map((n) => n.replace('♯', '#').replace('♭', 'b')).sort();
}

function areNotesEqual(actual: string[], expected: string[]): boolean {
  const normActual = normalizeNotes(actual);
  const normExpected = normalizeNotes(expected);

  if (normActual.length !== normExpected.length) return false;

  return normActual.every((note, i) => note === normExpected[i]);
}

function runTest(testCase: TestCase): boolean {
  const { symbol, expectedNotes, category } = testCase;

  const parsed = parseChordSymbol(symbol);

  if (!parsed) {
    console.log(`${colors.red}✗${colors.reset} ${symbol} - ${colors.red}PARSING FAILED${colors.reset}`);
    return false;
  }

  const voicings = generateVoicings(parsed, { style: 'basic' });

  if (voicings.length === 0) {
    console.log(`${colors.red}✗${colors.reset} ${symbol} - ${colors.red}NO VOICINGS GENERATED${colors.reset}`);
    return false;
  }

  const actualNotes = voicings[0].fullChord;

  const passed = areNotesEqual(actualNotes, expectedNotes);

  if (passed) {
    console.log(`${colors.green}✓${colors.reset} ${symbol.padEnd(15)} → ${actualNotes.join(', ')}`);
  } else {
    console.log(
      `${colors.red}✗${colors.reset} ${symbol.padEnd(15)} → Expected: [${expectedNotes.join(', ')}] | Got: [${actualNotes.join(', ')}]`
    );
  }

  return passed;
}

function runTestSuite() {
  console.log(`\n${colors.bold}${colors.cyan}========================================`);
  console.log('🎹 PIANO VOICINGS - TEST SUITE');
  console.log(`========================================${colors.reset}\n`);

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  const categories = [...new Set(TEST_CASES.map((t) => t.category))];

  categories.forEach((category) => {
    console.log(`\n${colors.bold}${colors.magenta}${category}${colors.reset}`);
    console.log(`${colors.magenta}${'─'.repeat(60)}${colors.reset}`);

    const testsInCategory = TEST_CASES.filter((t) => t.category === category);

    testsInCategory.forEach((test) => {
      totalTests++;
      const passed = runTest(test);
      if (passed) {
        passedTests++;
      } else {
        failedTests++;
      }
    });
  });

  console.log(`\n${colors.bold}${colors.cyan}========================================`);
  console.log('📊 RISULTATI');
  console.log(`========================================${colors.reset}`);
  console.log(`Total:  ${totalTests}`);
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);

  const percentage = ((passedTests / totalTests) * 100).toFixed(1);
  console.log(`\nSuccess Rate: ${percentage}%`);

  if (failedTests === 0) {
    console.log(`\n${colors.green}${colors.bold}🎉 ALL TESTS PASSED! 🎉${colors.reset}\n`);
  } else {
    console.log(`\n${colors.yellow}${colors.bold}⚠️  ${failedTests} TEST(S) FAILED ⚠️${colors.reset}\n`);
  }
}

runTestSuite();
