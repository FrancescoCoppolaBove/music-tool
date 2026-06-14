import { type Artist, UST_FOR_DOMINANT } from '../data/artistProfiles';
import { SectionLabel } from './shared';

export function ConstructionBlueprintPanel({ artist, color }: { artist: Artist; color: string }) {
  const steps = [
    {
      n: '01', title: 'Choose Your Scale',
      body: `Start with one of the preferred scales: ${artist.scalePreferences.join(', ')}. Pick a root and commit — the scale is the constraint that forces creativity.`,
    },
    {
      n: '02', title: 'Define the Rhythmic Skeleton',
      body: artist.id === 'ghostNote'
        ? 'Choose an odd meter (5/4 or 7/8). Decide the sub-grouping (3+2 or 2+3 for 5/4). Every note must fall naturally inside a group — no note should feel like it doesn\'t belong to a group.'
        : artist.id === 'lettuce'
        ? 'Mark 4–6 strong 16th-note slots in a 1-bar pattern, then add ghost notes (parenthetical/light touches) between each strong note. The ghost notes are what make it Lettuce.'
        : `Use the ${artist.id === 'jacobCollier' ? 'E(5,8) or E(3,8)' : 'E(7,16)'} euclidean rhythm as a skeleton. The mathematically-even distribution of accents is what gives it that natural, inevitable feel.`,
    },
    {
      n: '03', title: 'Build the 3-Note Melodic Cell',
      body: artist.id === 'jacobCollier'
        ? 'Choose 3 adjacent scale tones and play them through the rhythmic pattern. This cell becomes your superimposition material — you\'ll harmonize it two different ways.'
        : 'Identify a 3-note cell with a clear contour (up-down or down-up). Avoid starting on the root — begin on the 3rd, 5th, or 7th for immediate harmonic interest.',
    },
    {
      n: '04', title: 'Apply the Core Technique',
      body: artist.exampleApproach,
    },
    {
      n: '05', title: 'Add Harmonic Color',
      body: artist.id === 'snarkyPuppy'
        ? `In bar 4, place a ${UST_FOR_DOMINANT[2].label} over the root dom7 chord. This "${UST_FOR_DOMINANT[2].character}" moment is the payoff after 3 bars of modal groove.`
        : artist.id === 'jacobCollier'
        ? 'Reharmonize the riff\'s second half by implying a key a tritone away. Try the bVII pentatonic superimposition — the outside notes resolve beautifully when you return to the tonic.'
        : artist.id === 'lettuce'
        ? 'Keep the riff on one dominant 7th chord. Add color with a chromatic b5 passing tone between beat 4 and beat 1 of the next bar. Nothing else — restraint is the statement.'
        : 'Stack perfect 4ths above your lowest note for every punchy hit. The open quartal harmony reinforces the rhythmic force without defining a specific tonal center.',
    },
    {
      n: '06', title: 'Loop, Displace, Resolve',
      body: 'Loop the 2-bar riff 4 times. On repetition 5, displace the entire figure by +1 sixteenth. Run for 2 bars. Then snap back to the original downbeat position. The return is the most powerful moment in the riff.',
    },
  ];

  const rememberText: Record<string, string> = {
    snarkyPuppy: 'In Snarky Puppy\'s world, the unison IS the texture. Every instrument plays the same riff with identical rhythm and articulation. The blend creates the orchestral depth.',
    jacobCollier: 'Collier\'s magic is harmonic surprise. Any moment of stability should feel like it could shift at any time. Build trust with the listener, then violate it — lovingly.',
    lettuce: 'Lettuce never "resolves" — the dominant 7th IS home. The groove must feel so good that harmonic movement becomes unnecessary. Resist the urge to add complexity.',
    ghostNote: 'Ghost Note\'s riffs live and die by the meter choice. The odd-meter lurch IS the groove — the instability is intentional and structural. Never "fix" it by adding a bar of 4/4.',
  };

  return (
    <div>
      <SectionLabel text="Construction Blueprint" color={color} />
      <div style={{ background: '#161b22', border: `1px solid ${color}20`, borderRadius: 10, padding: '22px 26px' }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color, marginBottom: 18 }}>
          Building a {artist.name}-style Riff — Step by Step
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {steps.map(({ n, title, body }) => (
            <div key={n} style={{ display: 'flex', gap: 18 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 500, color: `${color}44`, flexShrink: 0, minWidth: 24, paddingTop: 2 }}>
                {n}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500, color, marginBottom: 4, letterSpacing: '0.04em' }}>
                  {title}
                </div>
                <div style={{ fontSize: 13, color: '#8b949e', lineHeight: 1.7 }}>{body}</div>
              </div>
            </div>
          ))}
        </div>

        {rememberText[artist.id] && (
          <div style={{ marginTop: 22, padding: '13px 16px', borderRadius: 8, background: `${color}0a`, border: `1px solid ${color}18`, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 3, height: 38, background: color, borderRadius: 2, flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#6b7280', lineHeight: 1.7 }}>
              <span style={{ color, fontWeight: 500 }}>Remember: </span>
              {rememberText[artist.id]}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
