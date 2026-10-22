import { LEGAL_LINKS } from '../../config/legal';
import { openConsentPreferences } from '../consent/consent';

const linkStyle: React.CSSProperties = {
  color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2,
  background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer',
};

/** Footer links: Privacy · Cookie · Terms · Cookie preferences. */
export default function LegalLinks() {
  const docs = [
    { label: 'Privacy Policy', href: LEGAL_LINKS.privacy },
    { label: 'Cookie Policy', href: LEGAL_LINKS.cookies },
    { label: 'Terms of Service', href: LEGAL_LINKS.terms },
  ].filter((d): d is { label: string; href: string } => Boolean(d.href));

  return (
    <nav aria-label="Legal" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px 14px' }}>
      {docs.map(d => (
        <a key={d.label} href={d.href} target="_blank" rel="noopener noreferrer" style={linkStyle}>{d.label}</a>
      ))}
      <button type="button" onClick={openConsentPreferences} style={linkStyle}>Cookie preferences</button>
    </nav>
  );
}
