// src/features/secondary-dominants/components/DegreeCard.tsx
import { useEffect, useRef } from 'react';
import {
  audioPlayer,
  voiceChord,
  playChordSequence,
  type SequenceHandle,
} from '@shared/utils/chordAudio';
import type { DegreeData } from '../utils/secondaryDominants';

interface Props {
  data: DegreeData;
  playingId: string | null;
  setPlayingId: (id: string | null) => void;
}

export function DegreeCard({ data, playingId, setPlayingId }: Props) {
  const seqRef = useRef<SequenceHandle | null>(null);
  const cancelRef = useRef(false);

  useEffect(() => () => { seqRef.current?.stop(); }, []);

  function stopCurrent() {
    cancelRef.current = true;
    seqRef.current?.stop();
    seqRef.current = null;
    audioPlayer.stopAll();
    setPlayingId(null);
  }

  async function playSingle(rowId: string, notes: string[]) {
    stopCurrent();
    cancelRef.current = false;
    setPlayingId(rowId);
    await audioPlayer.playChord(voiceChord(notes));
    if (!cancelRef.current) setPlayingId(null);
  }

  function playSeq(rowId: string, chords: { notes: string[] }[]) {
    stopCurrent();
    cancelRef.current = false;
    setPlayingId(rowId);
    seqRef.current = playChordSequence(chords, 100, undefined, () => {
      setPlayingId(null);
      seqRef.current = null;
    });
  }

  const { degree, targetChord, targetNotes, secDom, tritoneSub, iiChord } = data;

  const baseCard: React.CSSProperties = {
    background: '#13132b',
    border: '1px solid #2a2a50',
    borderRadius: 12,
    overflow: 'hidden',
  };

  const header: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    background: '#1a1a3a',
    borderBottom: '1px solid #2a2a50',
  };

  const degreeBadge: React.CSSProperties = {
    background: '#7c6af7',
    color: 'white',
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 'bold',
    flexShrink: 0,
  };

  const cardBody: React.CSSProperties = {
    padding: '10px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '7px 10px',
    borderRadius: 7,
    background: '#1c1c38',
  };

  function playBtnStyle(active: boolean): React.CSSProperties {
    return {
      background: active ? '#7c6af7' : '#252550',
      border: `1px solid ${active ? '#7c6af7' : '#3a3a70'}`,
      color: active ? 'white' : '#aaa',
      width: 26,
      height: 26,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: 10,
      flexShrink: 0,
    };
  }

  return (
    <div style={baseCard}>
      <div style={header}>
        <div style={degreeBadge}>{degree}</div>
        <span style={{ color: '#e0e0e0', fontWeight: 'bold', fontSize: 15 }}>{targetChord}</span>
        <span style={{ color: '#555', fontSize: 11, marginLeft: 'auto', textTransform: 'uppercase', letterSpacing: 0.5 }}>target</span>
      </div>

      <div style={cardBody}>
        {/* V7/X row */}
        <div style={rowStyle}>
          <span style={{ fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: 0.5, width: 44, flexShrink: 0, color: '#f7c948' }}>
            V/{degree}
          </span>
          <span style={{ fontSize: 14, fontWeight: 'bold', flex: 1, color: '#f7c948' }}>{secDom.name}</span>
          <span style={{ fontSize: 10, color: '#555', marginRight: 4 }}>{secDom.notes.join(' ')}</span>
          <button style={playBtnStyle(playingId === `${degree}-secdom`)} onClick={() => void playSingle(`${degree}-secdom`, secDom.notes)}>▶</button>
        </div>

        {/* Tritone sub row */}
        <div style={rowStyle}>
          <span style={{ fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: 0.5, width: 44, flexShrink: 0, color: '#6af7c9' }}>
            SubV
          </span>
          <span style={{ fontSize: 14, fontWeight: 'bold', flex: 1, color: '#6af7c9' }}>{tritoneSub.name}</span>
          <span style={{ fontSize: 10, color: '#555', marginRight: 4 }}>{tritoneSub.notes.join(' ')}</span>
          <button style={playBtnStyle(playingId === `${degree}-tritone`)} onClick={() => void playSingle(`${degree}-tritone`, tritoneSub.notes)}>▶</button>
        </div>

        {/* ii–V row */}
        <div style={rowStyle}>
          <span style={{ fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: 0.5, width: 44, flexShrink: 0, color: '#f796c0' }}>
            ii–V
          </span>
          <span style={{ fontSize: 13, fontWeight: 'bold', flex: 1, color: '#f796c0' }}>{iiChord.name} – {secDom.name}</span>
          <button
            style={playBtnStyle(playingId === `${degree}-iiv`)}
            onClick={() => playSeq(`${degree}-iiv`, [{ notes: iiChord.notes }, { notes: secDom.notes }])}
          >▶</button>
        </div>
      </div>

      <button
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          margin: '0 14px 10px',
          padding: 7,
          background: playingId === `${degree}-seq` ? '#1a1a50' : '#1a1a38',
          border: `1px dashed ${playingId === `${degree}-seq` ? '#7c6af7' : '#333'}`,
          borderRadius: 7,
          color: playingId === `${degree}-seq` ? '#aaa' : '#555',
          fontSize: 11,
          cursor: 'pointer',
          width: 'calc(100% - 28px)',
        }}
        onClick={() => playSeq(`${degree}-seq`, [
          { notes: iiChord.notes },
          { notes: secDom.notes },
          { notes: targetNotes },
        ])}
      >
        ▶ suona ii–V–I verso {targetChord}
      </button>
    </div>
  );
}
