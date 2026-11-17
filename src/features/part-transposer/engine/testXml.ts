import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { all, child, childText, withDeclaration, type XmlCodec } from './xmlDom';

export const testCodec: XmlCodec = {
  parse(xml) {
    try {
      return new DOMParser({ onError: () => {} }).parseFromString(xml, 'application/xml') as unknown as Document;
    } catch {
      throw new Error('Invalid XML');
    }
  },
  serialize: doc => withDeclaration(new XMLSerializer().serializeToString(doc as never)),
};

/** Written pitch names of every pitched, non-slash note, e.g. ['Bb4', 'G4']. */
export function pitchNames(doc: Document): string[] {
  return all(doc, 'note')
    .filter(n => child(n, 'pitch') && childText(n, 'notehead') !== 'slash')
    .map(n => {
      const p = child(n, 'pitch')!;
      const alter = Number(childText(p, 'alter') ?? 0);
      return `${childText(p, 'step')}${alter > 0 ? '#'.repeat(alter) : 'b'.repeat(-alter)}${childText(p, 'octave')}`;
    });
}
