/**
 * Auswertung erstellen — 3-Schritt-Wizard.
 * Steps: 1) Frage wählen → 2) Zusammenstellung prüfen & bearbeiten → 3) Prüfen & anlegen.
 * Reads: fragen_an_die_gruppe (Auswahl), beitraege (sichtbare Beiträge der Frage), auswertungen (höchste Fassung).
 * Writes: auswertungen (neue Fassung, Status „entwurf“, nie überschreiben).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useEffect, useRef, useState } from 'react';
import { IconRefresh } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import {
  useStepForm, useJourneySubmit, useRecordSearch,
  fieldText, fieldLookup, fieldNumber, refFilter, nowIso,
} from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { tx } from '@/i18n';

const DRAFT_KEY = 'auswertung-erstellen';

export default function AuswertungErstellenPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [beitragCount, setBeitragCount] = useState<number | null>(null);
  const [fassung, setFassung] = useState<number | null>(null);
  const builtFor = useRef<string | null>(null);

  const fragen = useRecordSearch(servicePort, 'fragen_an_die_gruppe', {
    searchFields: ['bezeichnung', 'fragestellung'],
    toItem: fr => ({
      id: fr.id,
      title: fieldText(fr, 'bezeichnung') || fieldText(fr, 'fragestellung'),
      subtitle: fieldText(fr, 'fragestellung'),
      status: fieldLookup(fr, 'status') ?? undefined,
    }),
  });

  const f = useStepForm('auswertungen', {
    fields: ['frage', 'zusammenstellung', 'verwendete_beitraege', 'zeitstand'],
    steps: { frage: 1, zusammenstellung: 2, verwendete_beitraege: 2, zeitstand: 2 },
  });

  const frageId = (f.get('frage') as string | null) ?? '';
  const frageRecord = frageId ? fragen.recordOf(frageId) : undefined;
  const frageName = frageId
    ? (frageRecord ? fieldText(frageRecord, 'bezeichnung') : '') || fragen.labelOf(frageId) || ''
    : '';
  const bezeichnung = fassung != null ? `${frageName} – ${tx('Fassung')} ${fassung}` : frageName;

  const submit = useJourneySubmit(servicePort, [
    {
      key: 'auswertung', entity: 'auswertungen', form: f, primary: true,
      values: { fassung: fassung ?? 1, bezeichnung, status: 'entwurf' },
    },
  ], { draftKey: DRAFT_KEY });

  // Beiträge + bisherige Fassungen der gewählten Frage laden und den Text zusammenstellen
  const build = async (id: string, keepText: boolean) => {
    setLoading(true);
    setLoadError(null);
    try {
      const frage = fragen.recordOf(id) ?? (await servicePort.get('fragen_an_die_gruppe', id));
      const [beitraege, alte] = await Promise.all([
        servicePort.list('beitraege', { filter: refFilter('frage', id), limit: 1000 }),
        servicePort.list('auswertungen', { filter: refFilter('frage', id), limit: 1000 }),
      ]);
      const sichtbar = beitraege
        .filter(b => fieldLookup(b, 'sichtbarkeit')?.key !== 'ausgeblendet')
        .sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));
      const hoechste = alte.reduce((m, a) => Math.max(m, fieldNumber(a, 'fassung') ?? 0), 0);
      setFassung(hoechste + 1);
      setBeitragCount(sichtbar.length);
      if (!keepText) {
        const teile = [
          frage ? fieldText(frage, 'ki_einleitung').trim() : '',
          frage ? fieldText(frage, 'ki_auftrag').trim() : '',
          sichtbar.map((b, i) => `${i + 1}. ${fieldText(b, 'antwort').trim()}`).join('\n'),
        ].filter(Boolean);
        f.set('zusammenstellung', teile.join('\n\n'));
        f.set('verwendete_beitraege', sichtbar.map((b, i) => `${i + 1}: ${b.id}`).join('\n'));
        f.set('zeitstand', nowIso());
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : tx('Die Beiträge konnten nicht geladen werden.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!frageId || builtFor.current === frageId) return;
    builtFor.current = frageId;
    // ein aus dem Entwurf wiederhergestellter Text bleibt erhalten
    const hasText = String(f.get('zusammenstellung') ?? '').trim() !== '';
    void build(frageId, hasText);
  }, [frageId]);

  const pickFrage = (id: string) => {
    if (id !== frageId) {
      f.set('zusammenstellung', '');
      f.set('verwendete_beitraege', '');
      builtFor.current = null;
      setFassung(null);
      setBeitragCount(null);
    }
    f.set('frage', id, fragen.labelOf(id) ?? '');
    setStep(2);
  };

  return (
    <IntentWizardShell
      title={tx('Auswertung erstellen')}
      currentStep={step}
      onStepChange={setStep}
      forms={[f]}
      draftKey={DRAFT_KEY}
      intro={{
        description: tx('Aus den Beiträgen einer Frage einen Text für die KI zusammenstellen.'),
        needs: [tx('Eine Frage an die Gruppe')],
      }}
    >
      <WizardStep label={tx('Frage')} description={tx('Zu welcher Frage soll die Auswertung entstehen?')}>
        <EntitySelectStep
          {...fragen.select}
          selectedId={frageId || null}
          onSelect={pickFrage}
          searchPlaceholder={tx('Bezeichnung oder Fragestellung …')}
          create={false}
        />
      </WizardStep>

      <WizardStep
        label={tx('Zusammenstellung')}
        description={tx('Prüfe den Text und passe ihn bei Bedarf an.')}
        needs={['frage']}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-secondary p-3 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium">{bezeichnung}</p>
              <p className="text-muted-foreground">
                {loading
                  ? tx('Beiträge werden geladen …')
                  : beitragCount != null
                    ? tx`${beitragCount} Beiträge übernommen (ohne ausgeblendete)`
                    : ''}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading || !frageId}
              onClick={() => { void build(frageId, false); }}
            >
              <IconRefresh size={16} className="shrink-0" />
              {tx('Neu zusammenstellen')}
            </Button>
          </div>
          {loadError && <p className="text-sm text-destructive">{loadError}</p>}
          {beitragCount === 0 && !loading && (
            <p className="text-sm text-amber-600">{tx('Zu dieser Frage gibt es noch keine sichtbaren Beiträge.')}</p>
          )}
          <Bound form={f} name="zusammenstellung" rows={14} />
          <Bound form={f} name="verwendete_beitraege" rows={4} />
          <Bound form={f} name="zeitstand" />
          <StepNav
            onBack={() => setStep(1)}
            onNext={() => f.validate(['zusammenstellung'])}
            nextStepLabel={tx('Prüfen')}
            nextDisabled={loading}
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!submit.done && (
          <SummaryStep
            forms={[f]}
            submit={submit}
            items={[
              { key: 'fassung', label: tx('Fassung'), value: String(fassung ?? 1) },
              { key: 'bezeichnung', label: tx('Bezeichnung'), value: bezeichnung },
              { key: 'status', label: tx('Status'), value: tx('Entwurf') },
            ]}
            whatHappensNext={tx('Es entsteht immer eine neue Fassung — frühere Fassungen bleiben unverändert.')}
          />
        )}
      </WizardStep>

      {submit.result && (
        <SuccessStep
          result={submit.result}
          forms={[f]}
          submit={submit}
          next={[
            { label: tx('Folgefrage anlegen'), href: '#/intents/folgefrage-anlegen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
