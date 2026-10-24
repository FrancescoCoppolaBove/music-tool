import { escapeXml } from './scoreXml';

export async function printScore(xml: string, title: string): Promise<void> {
  const popup = window.open('', '_blank');
  if (!popup) throw new Error('Allow pop-ups to print or save the score as PDF.');
  popup.document.title = title;
  popup.document.body.textContent = 'Preparing score...';
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute;left:-10000px;top:0;width:900px;background:white;';
  document.body.append(host);
  try {
    const { OpenSheetMusicDisplay } = await import('opensheetmusicdisplay');
    const renderer = new OpenSheetMusicDisplay(host, { backend: 'svg', autoResize: false, pageFormat: 'A4', drawTitle: true, drawPartNames: false });
    renderer.Zoom = 0.8;
    await renderer.load(xml);
    renderer.render();
    if (popup.closed) return;
    popup.document.open();
    popup.document.write(`<!doctype html><html lang="en"><head><title>${escapeXml(title)}</title><style>@page{size:A4;margin:10mm}body{margin:0;background:white;color:black}svg{display:block;width:100%;height:auto;max-height:277mm;break-after:page}svg:last-child{break-after:auto}</style></head><body>${[...host.querySelectorAll('svg')].map(svg => svg.outerHTML).join('')}</body></html>`);
    popup.document.close();
    await popup.document.fonts.ready;
    popup.focus();
    popup.print();
  } catch (error) {
    if (!popup.closed) popup.document.body.textContent = 'Could not prepare the score. Close this window and try again.';
    throw error;
  } finally { host.remove(); }
}
