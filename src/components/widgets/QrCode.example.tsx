/**
 * QrCode.example.tsx — the wiring contract for the QR block (tsc-checked,
 * never edit). Two uses: a share link on screen (overview „Mitmachen“ card, a
 * beamer view), and the same link as a downloadable SVG for a poster.
 *
 * Rules the example shows:
 * - encode the ABSOLUTE link (window.location.origin + the hash route), never
 *   a relative path — a scanner opens exactly what it reads;
 * - on a beamer size by HEIGHT share (`size="34vh"`), on a card by pixels;
 * - keep the quiet zone (margin 4) — scanners at 5 m need it;
 * - the link TEXT stays next to the symbol („Oder öffne: …“) — a phone that
 *   cannot scan still gets in.
 */
import { QrCode, qrSvgString } from '@/components/widgets/QrCode';
import { Button } from '@/components/ui/button';
import { tx } from '@/i18n';

export function JoinCard({ slug, recordId }: { slug: string; recordId: string }) {
  // the public page behind a per-record link, as „Links“ in the admin hands it out
  const link = `${window.location.origin}${window.location.pathname}#/public/${slug}?veranstaltung=${recordId}`;
  const download = () => {
    const blob = new Blob([qrSvgString(link, { margin: 4 })], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `qr-${slug}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div className="flex flex-col items-center gap-3 rounded-[27px] bg-card p-6 shadow-lg">
      <QrCode value={link} size={220} title={tx('QR-Code zum Mitmachen')} />
      <p className="break-all text-center text-xs text-muted-foreground">{tx('Oder öffne:')} {link}</p>
      <Button variant="outline" size="sm" onClick={download}>{tx('Als SVG speichern')}</Button>
    </div>
  );
}

/** A beamer view: the symbol takes a third of the screen height, the link stays readable. */
export function BeamerJoin({ link }: { link: string }) {
  return (
    <aside className="flex flex-col items-center gap-4">
      <QrCode value={link} size="34vh" title={tx('QR-Code zum Mitmachen')} />
      <p className="text-2xl">{tx('Oder öffne:')} <span className="font-mono">{link}</span></p>
    </aside>
  );
}
