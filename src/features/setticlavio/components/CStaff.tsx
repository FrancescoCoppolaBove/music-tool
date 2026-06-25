import React from 'react';
import { CClefType } from '../types';

interface Props {
  clef: CClefType;
  /** Staff position 0..10 */
  notePosition: number;
}

const LINE_Y = [68, 56, 44, 32, 20];   // y for lines 1-5 (bottom to top)
const STEP_H = 6;                       // half-step height

function posToY(pos: number): number {
  // pos 2 = line 1 = y 68; each step = STEP_H upward
  return 68 - (pos - 2) * STEP_H;
}

export function CStaff({ clef, notePosition }: Props) {
  const noteY     = posToY(notePosition);
  const clefLine  = clef === 'contralto' ? LINE_Y[2] : LINE_Y[3]; // 3rd or 4th line

  const needBottomLedger = notePosition <= 1;
  const needTopLedger    = notePosition >= 11;

  return (
    <svg viewBox="0 0 360 100" style={{ width: '100%', maxWidth: 360, display: 'block', margin: '0 auto' }}>
      {/* Five staff lines */}
      {LINE_Y.map((y, i) => (
        <line key={i} x1="20" y1={y} x2="340" y2={y} stroke="#30363d" strokeWidth="1.2" />
      ))}

      {/* C-clef bracket */}
      {/* Left vertical bar */}
      <rect x="22" y={LINE_Y[4]} width="3" height={LINE_Y[0] - LINE_Y[4]} fill="#8b949e" />
      {/* Top bracket curve */}
      <path d={`M25,${clefLine - 10} C45,${clefLine - 10} 45,${clefLine} 25,${clefLine}`} fill="none" stroke="#8b949e" strokeWidth="2.5" />
      {/* Bottom bracket curve */}
      <path d={`M25,${clefLine + 10} C45,${clefLine + 10} 45,${clefLine} 25,${clefLine}`} fill="none" stroke="#8b949e" strokeWidth="2.5" />
      {/* Center dot */}
      <circle cx="40" cy={clefLine} r="2.5" fill="#8b949e" />
      {/* Clef label */}
      <text x="48" y={clefLine + 4} fill="#4b5563" fontSize="9" fontFamily="'DM Sans', sans-serif">
        {clef === 'contralto' ? 'C.alto' : 'Tenore'}
      </text>

      {/* Ledger lines */}
      {needBottomLedger && (
        <line x1="148" y1={LINE_Y[0] + STEP_H * 2} x2="212" y2={LINE_Y[0] + STEP_H * 2} stroke="#30363d" strokeWidth="1.2" />
      )}
      {needTopLedger && (
        <line x1="148" y1={LINE_Y[4] - STEP_H * 2} x2="212" y2={LINE_Y[4] - STEP_H * 2} stroke="#30363d" strokeWidth="1.2" />
      )}

      {/* Note head */}
      <ellipse cx="180" cy={noteY} rx="11" ry="7.5" fill="#7c3aed" stroke="#c4b5fd" strokeWidth="1" />
      {/* Stem */}
      <line x1="191" y1={noteY} x2="191" y2={noteY - 36} stroke="#c4b5fd" strokeWidth="1.5" />
    </svg>
  );
}
