# Composition feature ownership

Updated 2026-10-11 after reviewing the existing feature modules. New work must first check the owning module below and extend it instead of adding another editor or a combined Lab page.

| Capability | Existing owner | Refactor decision |
| --- | --- | --- |
| Progression generation, styles, secondary dominants, substitutions | Chord Progressions | Remove the Lab builder; add project saving, explicit archived-progression import and optional validated AI proposals here. |
| Harmonic functions and analysis | Harmonic Analysis | Keep the existing implementation. |
| Passing chords and reharmonization | Reharmonization Lab / Modal Interchange | Keep the existing implementations. |
| Voice leading and voicings | Voice Leading Lab / Chord Voicings | Remove the Lab's block-chord imitation. |
| Contour, approaches and motif transformations | Melody Architect | Remove the new eight-note generator. Add audition, use-transformation action, local draft persistence and archive integration to the existing Motif Lab. |
| Form, sections and energy | Song Architect | Remove the second section editor. Enhance the existing Form & Energy Map with chords, persistent draft and versioned project saving; retain section melodies on import/save. |
| Expressive directions | Song Architect | Optional expandable selector adds an idea to the existing form editor. |
| Scales, modes and comparisons | Scale Dictionary | Remove the second atlas and keyboard. Add same-tonic audio comparison and fix selected-scale notes after changing tonic. |
| World traditions and listening references | Scale Dictionary | Preserve the sourced World Music Explorer in an expandable section. |
| Circle and key relationships | Circle of Fifths / Scale Harmonization | Remove the second circle and key-profile panel. |
| Horn transposition and harmonization | Transposing Instruments / Melody Harmonizer | Keep the dedicated tools. |
| Ear training | Ear Training Pro | No second quiz or training panel. |
| Groove | Groove Kitchen (existing) | Outside this composition work; remove Lab handoff banners. |
| Project snapshots, revisions and full JSON backups | My compositions | Archive only: no scale, harmony, melody or form editors. |
| Repertoire and song practice records | Song Library | Existing cloud repertoire records remain separate from local composition snapshots. |

## Data compatibility

- The archive still uses `tonic_harmony_composition_lab_projects`; no saved project is deleted or migrated destructively.
- The internal `harmony-lab` navigation ID stays as a compatibility alias, labelled **My compositions**.
- Editors receive an explicit import request and ask the user to load it before replacing their working draft.
- Saving an imported composition appends a revision under the same project ID. Section chords and melodies are retained.
- JSON contains full project data. MIDI and MusicXML exports remain explicitly labelled **progression** exports.
- Audio audition uses the existing AudioPlayer and Web Audio scheduling, including cancellation while samples load.

## Verification and limits

TypeScript/production build plus theory, snapshot and repository round-trip tests cover this change. Browser interaction and audible playback require a manual UI check. AI proposals require the existing configured backend. Composition storage remains local to the browser; it is not Song Library cloud synchronization.
