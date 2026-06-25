import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { PitchTracker, PitchReading } from '../../nail-the-pitch/pitchTracker';
import { SolfeggioNote, NoteEvaluation } from '../types';

export interface MicEvaluatorHandle {
  start: (notes: SolfeggioNote[], onDone: (evals: NoteEvaluation[]) => void) => void;
  stop: () => void;
}

export const MicEvaluator = forwardRef<MicEvaluatorHandle>(function MicEvaluator(_, ref) {
  const trackerRef   = useRef<PitchTracker | null>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const [listening, setListening] = useState(false);
  const [currentLabel, setCurrentLabel] = useState('');
  const [level, setLevel] = useState(0);

  useImperativeHandle(ref, () => ({
    start: async (notes: SolfeggioNote[], onDone: (evals: NoteEvaluation[]) => void) => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      const source   = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      const tracker = new PitchTracker();
      trackerRef.current = tracker;
      const buf = new Float32Array(analyser.fftSize);
      const evals: NoteEvaluation[] = [];
      let noteIdx = 0;
      let noteStart = Date.now();
      const readings: number[] = [];

      setListening(true);
      setCurrentLabel(notes[0]?.label ?? '');

      function frame() {
        analyser.getFloatTimeDomainData(buf);
        const reading: PitchReading = tracker.detect(buf, audioCtx.sampleRate);

        if (reading.voiced) {
          readings.push(reading.midi);
          setLevel(reading.clarity);
        }

        const elapsed = Date.now() - noteStart;
        const note    = notes[noteIdx];

        if (elapsed >= note.durationMs) {
          const median = medianMidi(readings);
          let ev: NoteEvaluation;
          if (median === null) {
            ev = { note, status: 'missed', centsOff: 0 };
          } else {
            const centsOff = (median - note.midi) * 100;
            const status   = Math.abs(centsOff) <= 50 ? 'correct' : centsOff > 0 ? 'sharp' : 'flat';
            ev = { note, status, centsOff: Math.round(centsOff) };
          }
          evals.push(ev);
          readings.length = 0;
          noteIdx++;
          noteStart = Date.now();

          if (noteIdx >= notes.length) {
            stream.getTracks().forEach(t => t.stop());
            audioCtx.close();
            setListening(false);
            cancelAnimationFrame(animFrameRef.current);
            onDone(evals);
            return;
          }
          setCurrentLabel(notes[noteIdx].label);
        }

        animFrameRef.current = requestAnimationFrame(frame);
      }

      animFrameRef.current = requestAnimationFrame(frame);
    },

    stop: () => {
      cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      setListening(false);
    },
  }));

  if (!listening) return null;

  return (
    <div style={{ textAlign: 'center', padding: '12px 0' }}>
      <div style={{ fontSize: 48, fontWeight: 800, color: '#c4b5fd', fontFamily: "'Syne', sans-serif" }}>
        {currentLabel}
      </div>
      <div style={{ height: 6, background: '#21262d', borderRadius: 3, margin: '10px auto', maxWidth: 200, overflow: 'hidden' }}>
        <div style={{ width: `${level * 100}%`, height: '100%', background: '#22c55e', borderRadius: 3, transition: 'width .05s' }} />
      </div>
      <div style={{ fontSize: 11, color: '#4b5563' }}>🎤 In ascolto…</div>
    </div>
  );
});

function medianMidi(readings: number[]): number | null {
  if (readings.length === 0) return null;
  const sorted = [...readings].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}
