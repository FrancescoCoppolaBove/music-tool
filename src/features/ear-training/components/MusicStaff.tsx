/**
 * MUSIC STAFF COMPONENT - WITH UNKNOWN/CORRECT/WRONG STATES
 * Pentagramma sempre visibile con "?" per note non inserite
 */

import React from 'react';

interface MusicStaffProps {
  notes: Array<{
    noteName: string;
    y: number;
    accidental: 'sharp' | 'flat' | null;
    ledgerLines: number[];
    isUnknown?: boolean;
    isCorrect?: boolean;
    isWrong?: boolean;
  }>;
  width?: number;
  height?: number;
}

export function MusicStaff({ notes, width = 700, height = 220 }: MusicStaffProps) {
  const staffLines = 5;
  const lineSpacing = 12;
  const staffTop = 70;
  const staffLeft = 60;
  const staffRight = width - 40;
  const noteSpacing = (staffRight - staffLeft - 80) / (notes.length + 1);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '2px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }}
    >
      <rect width={width} height={height} fill='#ffffff' rx='12' />

      {/* Staff Lines */}
      {Array.from({ length: staffLines }).map((_, i) => (
        <line
          key={`staff-${i}`}
          x1={staffLeft}
          y1={staffTop + i * lineSpacing}
          x2={staffRight}
          y2={staffTop + i * lineSpacing}
          stroke='#1e293b'
          strokeWidth={1.5}
          strokeLinecap='round'
        />
      ))}

      {/* Bar Lines */}
      <line x1={staffLeft} y1={staffTop} x2={staffLeft} y2={staffTop + (staffLines - 1) * lineSpacing} stroke='#1e293b' strokeWidth={2} />
      <line x1={staffRight} y1={staffTop} x2={staffRight} y2={staffTop + (staffLines - 1) * lineSpacing} stroke='#1e293b' strokeWidth={3} />
      <line
        x1={staffRight - 4}
        y1={staffTop}
        x2={staffRight - 4}
        y2={staffTop + (staffLines - 1) * lineSpacing}
        stroke='#1e293b'
        strokeWidth={1}
      />

      {/* Treble Clef - SVG professionale */}
      <g transform={`translate(${staffLeft - 10}, ${staffTop - 20}) scale(0.6)`}>
        <path
          d='m51.688 5.25c-5.427-0.1409-11.774 12.818-11.563 24.375 0.049 3.52 1.16 10.659 2.781 19.625-10.223 10.581-22.094 21.44-22.094 35.688-0.163 13.057 7.817 29.692 26.75 29.532 2.906-0.02 5.521-0.38 7.844-1 1.731 9.49 2.882 16.98 2.875 20.44 0.061 13.64-17.86 14.99-18.719 7.15 3.777-0.13 6.782-3.13 6.782-6.84 0-3.79-3.138-6.88-7.032-6.88-2.141 0-4.049 0.94-5.343 2.41-0.03 0.03-0.065 0.06-0.094 0.09-0.292 0.31-0.538 0.68-0.781 1.1-0.798 1.35-1.316 3.29-1.344 6.06 0 11.42 28.875 18.77 28.875-3.75 0.045-3.03-1.258-10.72-3.156-20.41 20.603-7.45 15.427-38.04-3.531-38.184-1.47 0.015-2.887 0.186-4.25 0.532-1.08-5.197-2.122-10.241-3.032-14.876 7.199-7.071 13.485-16.224 13.344-33.093 0.022-12.114-4.014-21.828-8.312-21.969zm1.281 11.719c2.456-0.237 4.406 2.043 4.406 7.062 0.199 8.62-5.84 16.148-13.031 23.719-0.688-4.147-1.139-7.507-1.188-9.5 0.204-13.466 5.719-20.886 9.813-21.281zm-7.719 44.687c0.877 4.515 1.824 9.272 2.781 14.063-12.548 4.464-18.57 21.954-0.781 29.781-10.843-9.231-5.506-20.158 2.312-22.062 1.966 9.816 3.886 19.502 5.438 27.872-2.107 0.74-4.566 1.17-7.438 1.19-7.181 0-21.531-4.57-21.531-21.875 0-14.494 10.047-20.384 19.219-28.969zm6.094 21.469c0.313-0.019 0.652-0.011 0.968 0 13.063 0 17.99 20.745 4.688 27.375-1.655-8.32-3.662-17.86-5.656-27.375z'
          stroke='#1e293b'
          strokeWidth='0.5'
          fill='#1e293b'
        />
      </g>

      {/* Notes */}
      {notes.map((note, i) => {
        const x = staffLeft + 100 + i * noteSpacing;
        const y = staffTop + (6 - note.y) * (lineSpacing / 2);

        // Colori in base allo stato
        const noteColor = note.isUnknown ? '#94a3b8' : note.isCorrect ? '#10b981' : note.isWrong ? '#ef4444' : '#1e293b';

        const labelColor = note.isUnknown ? '#94a3b8' : note.isCorrect ? '#10b981' : note.isWrong ? '#ef4444' : '#64748b';

        return (
          <g key={`note-${i}`}>
            {/* Ledger Lines */}
            {note.ledgerLines.map((ledgerY, idx) => (
              <line
                key={`ledger-${i}-${idx}`}
                x1={x - 14}
                y1={staffTop + (6 - ledgerY) * (lineSpacing / 2)}
                x2={x + 14}
                y2={staffTop + (6 - ledgerY) * (lineSpacing / 2)}
                stroke={noteColor}
                strokeWidth={1.5}
                strokeLinecap='round'
              />
            ))}

            {/* Accidental (solo se non è unknown) */}
            {!note.isUnknown && note.accidental === 'sharp' && (
              <g transform={`translate(${x - 20}, ${y})`}>
                <line x1='-2' y1='-8' x2='-2' y2='8' stroke={noteColor} strokeWidth='1.2' />
                <line x1='2' y1='-8' x2='2' y2='8' stroke={noteColor} strokeWidth='1.2' />
                <line x1='-4' y1='-2' x2='4' y2='1' stroke={noteColor} strokeWidth='1.5' />
                <line x1='-4' y1='2' x2='4' y2='5' stroke={noteColor} strokeWidth='1.5' />
              </g>
            )}
            {!note.isUnknown && note.accidental === 'flat' && (
              <g transform={`translate(${x - 20}, ${y})`}>
                <line x1='0' y1='-12' x2='0' y2='6' stroke={noteColor} strokeWidth='1.2' />
                <path d='M 0,-2 Q 6,0 6,3 Q 6,6 3,6 Q 0,6 0,4' fill='none' stroke={noteColor} strokeWidth='1.2' />
              </g>
            )}

            {/* Note Head o Question Mark */}
            {note.isUnknown ? (
              <text
                x={x}
                y={y + 8}
                fontSize={32}
                fontFamily="'SF Pro Text', 'Segoe UI', system-ui, sans-serif"
                fontWeight='700'
                fill={noteColor}
                textAnchor='middle'
              >
                ?
              </text>
            ) : (
              <>
                <ellipse cx={x} cy={y} rx={6} ry={4.5} fill={noteColor} transform={`rotate(-20 ${x} ${y})`} />
                <line x1={x + 5.5} y1={y} x2={x + 5.5} y2={y - 30} stroke={noteColor} strokeWidth={1.3} strokeLinecap='round' />
              </>
            )}

            {/* Note Name Label */}
            <text
              x={x}
              y={staffTop + staffLines * lineSpacing + 35}
              fontSize={13}
              fontFamily="'SF Pro Text', 'Segoe UI', system-ui, sans-serif"
              fontWeight='500'
              fill={labelColor}
              textAnchor='middle'
            >
              {note.noteName}
            </text>

            {/* Connection line */}
            {!note.isUnknown && (
              <line
                x1={x}
                y1={staffTop + staffLines * lineSpacing + 25}
                x2={x}
                y2={staffTop + staffLines * lineSpacing + 30}
                stroke='#cbd5e1'
                strokeWidth={1}
                strokeDasharray='2,2'
              />
            )}
          </g>
        );
      })}

      {/* Title */}
      <text
        x={width / 2}
        y={25}
        fontSize={14}
        fontFamily="'SF Pro Text', 'Segoe UI', system-ui, sans-serif"
        fontWeight='600'
        fill='#475569'
        textAnchor='middle'
      >
        Melody
      </text>
    </svg>
  );
}
