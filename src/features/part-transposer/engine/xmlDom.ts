/**
 * Minimal DOM helpers that work on both the browser DOM and @xmldom/xmldom
 * (tests), which lacks `children`, `nextElementSibling` and `querySelector`.
 */
const ELEMENT_NODE = 1;

export interface XmlCodec {
  parse(xml: string): Document;
  serialize(doc: Document): string;
}

export function childElements(parent: Node, tag?: string): Element[] {
  const out: Element[] = [];
  for (let n = parent.firstChild; n; n = n.nextSibling) {
    if (n.nodeType === ELEMENT_NODE && (!tag || (n as Element).tagName === tag)) out.push(n as Element);
  }
  return out;
}

export function child(parent: Node, tag: string): Element | null {
  return childElements(parent, tag)[0] ?? null;
}

export function childText(parent: Node, tag: string): string | null {
  const el = child(parent, tag);
  return el ? (el.textContent ?? '').trim() : null;
}

/** All descendants with a tag name, as a static array (safe to mutate while iterating). */
export function all(root: Document | Element, tag: string): Element[] {
  return Array.from(root.getElementsByTagName(tag));
}

/** Inserts `el` before the first child whose tag is in `before`, or appends it. */
export function insertBeforeFirst(parent: Element, el: Element, before: string[]): void {
  parent.insertBefore(el, childElements(parent).find(c => before.includes(c.tagName)) ?? null);
}

/** Sets a child's text, creating it (before the first `before` sibling) when missing. */
export function setChildText(parent: Element, tag: string, value: string, before: string[] = []): Element {
  let el = child(parent, tag);
  if (!el) {
    el = parent.ownerDocument!.createElement(tag);
    insertBeforeFirst(parent, el, before);
  }
  el.textContent = value;
  return el;
}

export function removeChildren(parent: Element, tag: string): void {
  for (const el of childElements(parent, tag)) parent.removeChild(el);
}

export function withDeclaration(xml: string): string {
  return xml.startsWith('<?xml') ? xml : `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;
}

export const browserCodec: XmlCodec = {
  parse(xml) {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) throw new Error('Invalid XML');
    return doc;
  },
  serialize: doc => withDeclaration(new XMLSerializer().serializeToString(doc)),
};
