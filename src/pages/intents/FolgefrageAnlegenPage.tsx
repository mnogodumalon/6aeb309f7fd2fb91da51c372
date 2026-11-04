/**
 * Folgefrage anlegen — 3-Schritt-Wizard.
 * Steps: 1) Auswertung wählen → 2) Neue Frage formulieren → 3) Prüfen & anlegen.
 * Reads: auswertungen (nur mit KI-Ergebnis), fragen_an_die_gruppe (Frage der Auswertung + vorhandene Nummern), veranstaltungen (Name).
 * Writes: fragen_an_die_gruppe (createFragenAnDieGruppe) — status vorbereitet, laufende Nummer = höchste Nummer des Typs in der Veranstaltung + 1.
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useEffect, useMemo, useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import {
  useStepForm, useJourneySubmit, useRecordSearch, useLiveList,
  fieldText, fieldLookup, fieldNumber, fieldRef, labelOf, optionsOf, refFilter,
} from '@/lib/journey';
import type { JourneyRecord } from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { tx } from '@/i18n';

const ABSCHNITTE = ['abschnitt_1', 'abschnitt_2', 'abschnitt_3', 'abschnitt_4', 'abschnitt_5', 'abschnitt_6'] as const;

function AbschnittePanel({ record }: { record: JourneyRecord | null }) {
  const filled = record ? ABSCHNITTE.filter(k => fieldText(record, k).trim() !== '') : [];
  return (
    <div className="space-y-3 rounded-2xl border bg-secondary/40 p-4 overflow-hidden">
      <p className="text-sm font-medium">{tx('KI-Ergebnis zum Nachlesen und Kopieren')}</p>
      {!record && <p className="text-sm text-muted-foreground">{tx('Lade Auswertung …')}</p>}
      {record && filled.length === 0 && (
        <p className="text-sm text-muted-foreground">{tx('Diese Auswertung hat keine Abschnitte.')}</p>
      )}
      {record && filled.map(k => (
        <div key={k} className="min-w-0">
          <p className="text-xs font-semibold text-muted-foreground">{labelOf('auswertungen', k)}</p>
          <p className="whitespace-pre-wrap break-words text-sm select-text">{fieldText(record, k)}</p>
        </div>
      ))}
    </div>
  );
}

export default function FolgefrageAnlegenPage() {
  const [step, setStep] = useState(1);
  const [auswertung, setAuswertung] = useState<JourneyRecord | null>(null);
  const [veranstaltung, setVeranstaltung] = useState<{ id: string; name: string } | null>(null);

  const auswertungen = useRecordSearch(servicePort, 'auswertungen', {
    filter: "r.v_status == 'ergebnis_vorhanden'",
    where: r => fieldLookup(r, 'status')?.key === 'ergebnis_vorhanden',
    searchFields: ['bezeichnung'],
    toItem: (a, ctx) => ({
      id: a.id,
      title: fieldText(a, 'bezeichnung') || tx('Auswertung ohne Bezeichnung'),
      subtitle: ctx.ref('frage'),
    }),
  });

  const f = useStepForm('fragen_an_die_gruppe', {
    fields: ['auswertung_quelle', 'typ', 'fragestellung', 'ki_einleitung', 'ki_auftrag', 'sofort_zeigen'],
    steps: { auswertung_quelle: 1, typ: 2, fragestellung: 2, ki_einleitung: 2, ki_auftrag: 2, sofort_zeigen: 2 },
  });

  const auswertungId = (f.get('auswertung_quelle') as string | null) ?? null;

  // The chosen Auswertung (also on a cold start from a draft) and, behind it, its question's Veranstaltung.
  useEffect(() => {
    let cancelled = false;
    setAuswertung(null);
    setVeranstaltung(null);
    if (!auswertungId) return;
    (async () => {
      const a = auswertungen.recordOf(auswertungId) ?? await servicePort.get('auswertungen', auswertungId);
      if (cancelled) return;
      setAuswertung(a);
      const frageId = a ? fieldRef(a, 'frage') : null;
      const frage = frageId ? await servicePort.get('fragen_an_die_gruppe', frageId) : null;
      const vId = frage ? fieldRef(frage, 'veranstaltung') : null;
      const v = vId ? await servicePort.get('veranstaltungen', vId) : null;
      if (cancelled) return;
      if (vId) setVeranstaltung({ id: vId, name: v ? fieldText(v, 'titel') : '' });
    })().catch(() => { /* the step explains the missing Veranstaltung */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auswertungId]);

  const vId = veranstaltung?.id;
  const bestehende = useLiveList(servicePort, 'fragen_an_die_gruppe', {
    intervalMs: 0,
    enabled: Boolean(vId),
    list: { filter: vId ? refFilter('veranstaltung', vId) : undefined },
  });

  const typKey = (f.get('typ') as string | null) ?? null;
  const typLabel = optionsOf('fragen_an_die_gruppe', 'typ').find(o => o.key === typKey)?.label ?? '';
  const nummer = useMemo(() => {
    if (!typKey) return null;
    const hoechste = bestehende.records
      .filter(r => fieldLookup(r, 'typ')?.key === typKey)
      .reduce((m, r) => Math.max(m, fieldNumber(r, 'laufende_nummer') ?? 0), 0);
    return hoechste + 1;
  }, [bestehende.records, typKey]);
  const bezeichnung = typLabel && nummer != null ? `${typLabel} ${nummer}` : '';

  const submit = useJourneySubmit(servicePort, [
    {
      key: 'frage',
      entity: 'fragen_an_die_gruppe',
      form: f,
      primary: true,
      values: {
        status: 'vorbereitet',
        veranstaltung: vId,
        laufende_nummer: nummer ?? 1,
        bezeichnung,
      },
    },
  ], { draftKey: 'folgefrage-anlegen' });

  return (
    <IntentWizardShell
      title={tx('Folgefrage anlegen')}
      currentStep={step} onStepChange={setStep}
      forms={[f]} draftKey="folgefrage-anlegen"
      intro={{
        description: tx('Aus einem Vorschlag der KI eine neue Frage an die Gruppe machen.'),
        needs: [tx('Eine Auswertung mit KI-Ergebnis'), tx('Die Fragestellung für die Gruppe')],
      }}
    >
      <WizardStep label={tx('Auswertung')} description={tx('Aus welcher Auswertung soll die neue Frage entstehen?')}>
        <div className="space-y-4">
          <EntitySelectStep {...auswertungen.select}
            selectedId={auswertungId}
            emptyText={tx('Noch keine Auswertung mit KI-Ergebnis vorhanden.')}
            create={false}
            searchPlaceholder={tx('Bezeichnung suchen …')}
            onSelect={id => f.set('auswertung_quelle', id, auswertungen.labelOf(id) ?? '')}
          />
          {auswertungId && <AbschnittePanel record={auswertung} />}
          <StepNav hideBack onNext={() => f.validate(['auswertung_quelle'])} nextStepLabel={tx('Neue Frage')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Neue Frage')} description={tx('Formuliere die Frage an die Gruppe — gern mit einem Vorschlag aus dem KI-Ergebnis.')} needs={['auswertung_quelle']}>
        <div className="space-y-4">
          <AbschnittePanel record={auswertung} />
          <Bound form={f} name="typ" />
          <Bound form={f} name="fragestellung" rows={4} />
          <Bound form={f} name="ki_einleitung" rows={3} />
          <Bound form={f} name="ki_auftrag" rows={3} />
          <Bound form={f} name="sofort_zeigen" />
          {!vId && (
            <p className="text-sm text-destructive">{tx('Zu dieser Auswertung konnte keine Veranstaltung ermittelt werden.')}</p>
          )}
          <StepNav
            onBack={() => setStep(1)}
            onNext={() => {
              if (!f.validate(['typ', 'fragestellung'])) return false;
              if (!vId) return tx('Zu dieser Auswertung konnte keine Veranstaltung ermittelt werden.');
              if (bestehende.loading) return tx('Die vorhandenen Fragen werden noch geladen — einen Moment bitte.');
              return true;
            }}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!submit.done && (
          <SummaryStep forms={[f]} submit={submit}
            items={[
              { key: 'veranstaltung', label: tx('Veranstaltung'), value: veranstaltung?.name || '—' },
              { key: 'bezeichnung', label: tx('Bezeichnung'), value: bezeichnung || '—' },
              { key: 'status', label: tx('Status'), value: optionsOf('fragen_an_die_gruppe', 'status').find(o => o.key === 'vorbereitet')?.label ?? '' },
            ]}
            whatHappensNext={tx('Die Frage wird vorbereitet und verweist auf die Auswertung. Du kannst sie danach für die Gruppe öffnen.')}
          />
        )}
      </WizardStep>

      {submit.result && (
        <SuccessStep result={submit.result} forms={[f]} submit={submit}
          next={[
            { label: tx('Zum Dashboard'), href: '#/' },
            { label: tx('Auswertung erstellen'), href: '#/intents/auswertung-erstellen' },
          ]}
          whatHappensNext={tx('Die neue Frage steht als „vorbereitet“ bereit.')}
        />
      )}
    </IntentWizardShell>
  );
}
