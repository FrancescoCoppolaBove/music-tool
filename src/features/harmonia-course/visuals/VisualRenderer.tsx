import type { Visual } from '../data/types';
import KeyboardDiagram from './KeyboardDiagram';
import ProgressionChart from './ProgressionChart';
import IntervalGrid from './IntervalGrid';
import CircleSegment from './CircleSegment';

export default function VisualRenderer({ visual }: { visual: Visual }) {
  switch (visual.type) {
    case 'keyboard':
      return <KeyboardDiagram title={visual.title} chords={visual.chords} />;
    case 'progression':
      return (
        <ProgressionChart
          title={visual.title}
          musicalKey={visual.key}
          steps={visual.steps}
        />
      );
    case 'interval-grid':
      return (
        <IntervalGrid
          title={visual.title}
          chord={visual.chord}
          scale={visual.scale}
          root={visual.root}
          rows={visual.rows}
        />
      );
    case 'circle-segment':
      return (
        <CircleSegment
          title={visual.title}
          highlight={visual.highlight}
          tonic={visual.tonic}
        />
      );
  }
}
