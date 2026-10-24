import { GUIDE, SOURCES, type GuideBlock } from '../guide';

function Block({ block }: { block: GuideBlock }) {
  if (block.type === 'p') return <p>{block.text}</p>;
  if (block.type === 'tip') return <p className="csp-tip">{block.text}</p>;
  return <ul>{block.items.map(item => <li key={item}>{item}</li>)}</ul>;
}

export default function CreativityGuide() {
  return (
    <div className="csp-guide">
      <nav className="csp-toc" aria-label="Indice della guida">
        <span className="csp-eyebrow">Indice</span>
        <ol>
          {GUIDE.map(s => <li key={s.id}><a href={`#csp-${s.id}`}>{s.title}</a></li>)}
          <li><a href="#csp-fonti">Fonti e letture</a></li>
        </ol>
      </nav>

      <div className="csp-guide-body">
        {GUIDE.map((s, i) => (
          <section key={s.id} id={`csp-${s.id}`} className="csp-guide-section">
            <span className="csp-eyebrow">{String(i + 1).padStart(2, '0')}</span>
            <h3>{s.title}</h3>
            <p className="csp-lead">{s.lead}</p>
            {s.blocks.map((b, j) => <Block key={j} block={b} />)}
          </section>
        ))}

        <section id="csp-fonti" className="csp-guide-section">
          <span className="csp-eyebrow">Fonti</span>
          <h3>Fonti e letture</h3>
          <p className="csp-lead">La guida riassume e parafrasa queste fonti: libri, forum di autori e articoli. Le opinioni dei forum sono esperienze personali, non regole.</p>
          <ul className="csp-sources">
            {SOURCES.map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.label}</a><span>{s.note}</span></li>)}
          </ul>
        </section>
      </div>
    </div>
  );
}
