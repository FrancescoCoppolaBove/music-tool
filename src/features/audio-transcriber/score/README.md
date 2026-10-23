# Editable harmonic and rhythmic score

The Audio Transcriber's Score view builds a draft from the existing local note
and chord events. It does not run another transcription model or upload audio.

## Timing model

- Each section supplies a name, bar count, meter and **quarter-note BPM**.
- The first bar's audio offset is editable. A default 4/4 structure is only an
  initial assumption, not an automatically detected meter.
- Explicit bar-start anchors interpolate the nominal timeline between anchors.
  After the final anchor, the specified section tempos resume. This supports
  expressive recordings without claiming automatic beat-map detection.
- Supported grids are eighth notes, sixteenths and eighth-note triplets.
- Harmonic mode writes beat slashes with chord changes. Rhythmic mode groups
  attacks within 35 ms, quantizes gestures and splits durations at barlines.
  A later attack ends the preceding gesture, including under sustain pedal.
- Amber notes flag low confidence or substantial timing residuals. They are
  review hints, not a calibrated estimate of transcription accuracy.

## Editing and persistence

Bar events store integer ticks at 12 divisions per quarter. Editing rejects
overlap and events beyond the bar, and fills gaps with rests. Overrides are
separate from detected pitches. Regeneration asks before discarding overrides.
Undo/redo applies to bar edits; structural changes are regenerated explicitly.

Version-1 `.tonic-score.json` files contain structure, anchors, title and bar
overrides, not audio or source detections. Reload the matching recording and
analyze it before loading a saved score project.

## Notation and exports

OpenSheetMusicDisplay is loaded lazily when Score opens. Preview uses 12-bar
windows and adapts its staff layout to the available width. MusicXML and print
contain the full score. Print / PDF opens the browser's print dialog; choose
Save as PDF there.

Slash noteheads use a key-adjusted placeholder pitch solely for rendering.
**They do not encode the performed piano pitches or a two-staff piano score.**
Actual pitch transcription remains in the piano roll.

Exchange MusicXML retains semantic harmony elements. Because OSMD drops some
custom chord-kind labels, the display/print variant renders those chord symbols
as exact text directions instead. Both retain the same timing and bar structure.

Tests: `npm run test:transcriber` includes `engine/score.test.ts`.
