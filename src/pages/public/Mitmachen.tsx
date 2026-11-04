import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { PublicShell } from '@/components/PublicShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ChoiceGroup } from '@/components/blocks/ChoiceGroup';
import {
  loadPublicPagesConfig, prepareChallenge,
  type PublicPagesConfig, type PublicPageConfig,
} from '@/lib/publicClient';
import { createPublicPort } from '@/lib/journey/publicPort';
import { useLiveList, fieldText, fieldDate, fieldLookup, recordIdOf, nowIso } from '@/lib/journey';
import { tx } from '@/i18n';

const SLUG = 'mitmachen';
const KUERZEL_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/L
const KUERZEL_LENGTH = 5;

interface Participant { id: string; kuerzel: string }
interface Pending { frageId: string; antwort: string; anmerkung: string; wichtigkeit: string | null; kennung: string }

function randomString(alphabet: string, length: number): string {
  const buf = new Uint32Array(length);
  crypto.getRandomValues(buf);
  return Array.from(buf, n => alphabet[n % alphabet.length]).join('');
}

function readStore<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeStore(key: string, value: unknown) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — the page still works for this session */
  }
}

export default function Mitmachen() {
  const [params] = useSearchParams();
  const veranstaltungId = params.get('veranstaltungId') ?? '';

  const [cfg, setCfg] = useState<PublicPagesConfig | null>(null);
  const [page, setPage] = useState<PublicPageConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const [antwort, setAntwort] = useState('');
  const [anmerkung, setAnmerkung] = useState('');
  const [wichtigkeit, setWichtigkeit] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [sentCount, setSentCount] = useState(0);
  const [justSent, setJustSent] = useState(false);

  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [mailState, setMailState] = useState<'idle' | 'sending' | 'saved' | 'declined'>('idle');
  const [mailError, setMailError] = useState<string | null>(null);
  const challengeSent = useRef(false);

  const tnKey = `mitmachen-tn-${veranstaltungId}`;
  const pendingKey = `mitmachen-pending-${veranstaltungId}`;

  useEffect(() => {
    loadPublicPagesConfig(SLUG).then(c => {
      setCfg(c);
      setPage(c?.pages[SLUG] ?? null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (veranstaltungId) setParticipant(readStore<Participant>(tnKey));
  }, [veranstaltungId, tnKey]);

  const port = useMemo(() => (cfg && page ? createPublicPort(cfg, page) : null), [cfg, page]);

  const events = useLiveList(port, 'veranstaltungen', { intervalMs: 0, enabled: !!port && !!veranstaltungId });
  const fragen = useLiveList(port, 'fragen_an_die_gruppe', { intervalMs: 10000, enabled: !!port && !!veranstaltungId });

  const event = events.records.find(r => r.id === veranstaltungId) ?? null;
  const openFrage = useMemo(
    () => fragen.records.find(r => recordIdOf(r.fields.veranstaltung) === veranstaltungId && fieldLookup(r, 'status')?.key === 'geoeffnet') ?? null,
    [fragen.records, veranstaltungId],
  );

  if (loading || !cfg || !page || !port) {
    return <PublicShell loading={loading} unavailable={!loading} />;
  }

  if (!veranstaltungId) {
    return (
      <PublicShell title={page.title}>
        <p className="text-sm text-muted-foreground">
          {tx('Dieser Link ist unvollständig. Bitte scanne den QR-Code deiner Veranstaltung noch einmal.')}
        </p>
      </PublicShell>
    );
  }

  const warmUp = () => {
    if (challengeSent.current) return;
    challengeSent.current = true;
    const ep = page.endpoints?.find(e => e.op === 'create');
    if (ep) prepareChallenge(cfg, page, 'POST', `/apps/${ep.app_id}/records`);
  };

  const eventDate = event ? fieldDate(event, 'datum') : null;
  const eventDesc = event ? fieldText(event, 'beschreibung') : '';
  const frageText = openFrage ? fieldText(openFrage, 'fragestellung') : '';
  const frageLabel = openFrage ? fieldText(openFrage, 'bezeichnung') : '';

  const options = [
    { key: 'niedrig', label: tx('Niedrig') },
    { key: 'mittel', label: tx('Mittel') },
    { key: 'hoch', label: tx('Hoch') },
  ];

  const submit = async () => {
    if (!openFrage || sending) return;
    const text = antwort.trim();
    if (!text) {
      setError(tx('Bitte schreib zuerst deine Antwort.'));
      return;
    }
    setSending(true);
    setError(null);
    try {
      // 1) the Kürzel — created once on the first Beitrag, remembered for the evening
      let tn = participant;
      if (!tn) {
        const kuerzel = randomString(KUERZEL_ALPHABET, KUERZEL_LENGTH);
        const plan = { values: { kuerzel: kuerzel, veranstaltung: veranstaltungId } };
        const rec = await port.create('teilnehmende', plan.values);
        tn = { id: rec.id, kuerzel };
        writeStore(tnKey, tn);
        setParticipant(tn);
      }
      // 2) the idempotency key — stored BEFORE sending, reused on every retry of the same text
      const note = anmerkung.trim();
      let pending = readStore<Pending>(pendingKey);
      if (!pending || pending.frageId !== openFrage.id || pending.antwort !== text || pending.anmerkung !== note || pending.wichtigkeit !== wichtigkeit) {
        pending = { frageId: openFrage.id, antwort: text, anmerkung: note, wichtigkeit, kennung: randomString('abcdefghjkmnpqrstuvwxyz23456789', 16) };
        writeStore(pendingKey, pending);
      }
      const values: Record<string, unknown> = {
        frage: openFrage.id,
        teilnehmer: tn.id,
        antwort: text,
        einsende_kennung: pending.kennung,
      };
      if (note) values.anmerkung = note;
      if (wichtigkeit) values.wichtigkeit = wichtigkeit;
      await port.create('beitraege', values);
      writeStore(pendingKey, null);
      setAntwort('');
      setAnmerkung('');
      setWichtigkeit(null);
      setSentCount(n => n + 1);
      setJustSent(true);
    } catch {
      setError(tx('Das Senden hat nicht geklappt. Dein Text ist noch da — versuch es gleich noch einmal.'));
    } finally {
      setSending(false);
    }
  };

  const saveEmail = async () => {
    if (!participant) return;
    const mail = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) {
      setMailError(tx('Bitte gib eine gültige E-Mail-Adresse ein.'));
      return;
    }
    if (!consent) {
      setMailError(tx('Bitte stimme zu, damit wir deine E-Mail-Adresse speichern dürfen.'));
      return;
    }
    setMailState('sending');
    setMailError(null);
    try {
      // a public page can only CREATE: the e-mail arrives as a new entry bound to the same Kürzel
      await port.create('teilnehmende', {
        kuerzel: participant.kuerzel,
        veranstaltung: veranstaltungId,
        email: mail,
        einwilligung: true,
        einwilligung_zeitpunkt: nowIso(),
      });
      setMailState('saved');
    } catch {
      setMailState('idle');
      setMailError(tx('Das Speichern hat nicht geklappt. Bitte versuch es noch einmal.'));
    }
  };

  return (
    <PublicShell title={event ? fieldText(event, 'titel') : page.title} description={eventDate ? format(new Date(`${eventDate.slice(0, 10)}T00:00`), 'dd.MM.yyyy') : undefined}>
      <div className="space-y-6">
        {eventDesc && <p className="text-sm text-muted-foreground whitespace-pre-line">{eventDesc}</p>}

        {participant && (
          <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
            {tx('Dein Kürzel:')} <span className="font-mono text-base font-semibold tracking-widest">{participant.kuerzel}</span>
            <div className="text-xs text-muted-foreground mt-0.5">{tx('Merk es dir — damit erkennst du deine Beiträge wieder.')}</div>
          </div>
        )}

        {!openFrage ? (
          <div className="rounded-lg border border-dashed px-4 py-8 text-center space-y-1">
            <p className="font-medium">{tx('Gerade ist keine Frage geöffnet.')}</p>
            <p className="text-sm text-muted-foreground">
              {tx('Sobald die nächste Frage startet, erscheint sie hier von selbst — du musst die Seite nicht neu laden.')}
            </p>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={e => { e.preventDefault(); void submit(); }}
          >
            <div className="space-y-1">
              {frageLabel && <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{frageLabel}</div>}
              <p className="text-lg font-semibold whitespace-pre-line">{frageText}</p>
            </div>

            {justSent && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-900">
                {tx('Danke, dein Beitrag ist angekommen! Du kannst gern noch einen schicken.')}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="mm-antwort">{tx('Deine Antwort')}</Label>
              <Textarea
                id="mm-antwort"
                rows={4}
                value={antwort}
                onFocus={warmUp}
                onChange={e => { setAntwort(e.target.value); setJustSent(false); }}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mm-anmerkung">{tx('Anmerkung (freiwillig)')}</Label>
              <Textarea id="mm-anmerkung" rows={2} value={anmerkung} onChange={e => setAnmerkung(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label id="mm-wichtigkeit-label">{tx('Wie wichtig ist dir das? (freiwillig)')}</Label>
              <ChoiceGroup
                id="mm-wichtigkeit"
                aria-labelledby="mm-wichtigkeit-label"
                value={wichtigkeit}
                onChange={setWichtigkeit}
                options={options}
                allowClear
              />
            </div>

            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

            <Button type="submit" className="w-full sm:w-auto" disabled={sending}>
              {sending ? tx('Wird gesendet …') : tx('Beitrag senden')}
            </Button>
          </form>
        )}

        {sentCount > 0 && participant && mailState !== 'declined' && (
          <div className="border-t pt-5 space-y-3">
            {mailState === 'saved' ? (
              <p className="text-sm text-emerald-700">{tx('Danke! Deine E-Mail-Adresse ist zu deinem Kürzel gespeichert.')}</p>
            ) : (
              <>
                <h2 className="font-semibold">{tx('Zum Schluss: E-Mail (freiwillig)')}</h2>
                <p className="text-sm text-muted-foreground">
                  {tx('Wenn du möchtest, speichern wir deine E-Mail-Adresse zu deinem Kürzel — zum Beispiel für die Ergebnisse.')}
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="mm-email">{tx('E-Mail-Adresse')}</Label>
                  <Input id="mm-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="mm-consent" checked={consent} onCheckedChange={v => setConsent(v === true)} />
                  <Label htmlFor="mm-consent" className="text-sm font-normal leading-snug">
                    {tx('Ich willige ein, dass meine E-Mail-Adresse zu meinem Kürzel gespeichert wird.')}
                  </Label>
                </div>
                {mailError && <p className="text-sm text-destructive" role="alert">{mailError}</p>}
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={() => void saveEmail()} disabled={mailState === 'sending'}>
                    {tx('E-Mail speichern')}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setMailState('declined')}>
                    {tx('Nein, danke')}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </PublicShell>
  );
}
