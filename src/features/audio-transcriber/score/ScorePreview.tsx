import { useEffect, useRef, useState } from 'react';

export default function ScorePreview({ xml, active }: { xml: string; active: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [width, setWidth] = useState(780);
  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setWidth(Math.max(280, Math.min(1000, Math.round(entry.contentRect.width))));
    });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!active || !host.current) return;
    let cancelled = false;
    const element = document.createElement('div');
    element.style.width = `${width}px`;
    element.style.margin = '0 auto';
    host.current.replaceChildren(element);
    setLoading(true); setError('');
    (async () => {
      try {
        const { OpenSheetMusicDisplay } = await import('opensheetmusicdisplay');
        if (cancelled) return;
        const renderer = new OpenSheetMusicDisplay(element, { backend: 'svg', autoResize: false, pageFormat: 'Endless', drawTitle: true, drawPartNames: false });
        renderer.Zoom = 0.85;
        await renderer.load(xml);
        if (cancelled) return;
        renderer.render();
        setLoading(false);
      } catch (e) { if (!cancelled) { setError(e instanceof Error ? e.message : 'Could not display score.'); setLoading(false); } }
    })();
    return () => { cancelled = true; element.remove(); };
  }, [xml, active, width]);
  return <div style={{ position: 'relative', background: 'white', color: '#111', borderRadius: 4, overflowX: 'auto', minHeight: 180 }}>
    {loading && <p role="status" style={{ padding: 16 }}>Preparing notation...</p>}
    {error && <p role="alert" style={{ padding: 16, color: '#a11' }}>{error}</p>}
    <div ref={host} aria-label="Harmonic score preview" />
  </div>;
}
