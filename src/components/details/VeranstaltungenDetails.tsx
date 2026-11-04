import type { Veranstaltungen, Auswertungen, FragenAnDieGruppe, Teilnehmende } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface VeranstaltungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Veranstaltungen;
  /** N:1-Ziel „Auswertungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  auswertungenList: Auswertungen[];
  /** Klick auf die Auswertungen-Relation → overlay.push auf dessen Detail. */
  onOpenAuswertungen?: (record: Auswertungen) => void;
  /** 1:N „Fragen an die Gruppe" (veranstaltung): VOLLE Liste — der Block filtert auf diesen Record. */
  fragenAnDieGruppeList: FragenAnDieGruppe[];
  /** Zeilen-Klick → overlay.push auf das FragenAnDieGruppe-Detail (nie der Edit-Dialog). */
  onOpenFragenAnDieGruppe: (record: FragenAnDieGruppe) => void;
  /** Kontextuelles „+": öffnet den FragenAnDieGruppe-Dialog mit diesem Record vorgesetzt. */
  onAddFragenAnDieGruppe?: () => void;
  /** 1:N „Teilnehmende" (veranstaltung): VOLLE Liste — der Block filtert auf diesen Record. */
  teilnehmendeList: Teilnehmende[];
  /** Zeilen-Klick → overlay.push auf das Teilnehmende-Detail (nie der Edit-Dialog). */
  onOpenTeilnehmende: (record: Teilnehmende) => void;
  /** Kontextuelles „+": öffnet den Teilnehmende-Dialog mit diesem Record vorgesetzt. */
  onAddTeilnehmende?: () => void;
}

export function VeranstaltungenDetails({
  record,
  auswertungenList,
  onOpenAuswertungen,
  fragenAnDieGruppeList,
  onOpenFragenAnDieGruppe,
  onAddFragenAnDieGruppe,
  teilnehmendeList,
  onOpenTeilnehmende,
  onAddTeilnehmende,
}: VeranstaltungenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const beamer_auswertungTarget = auswertungenList.find(r => r.record_id === extractRecordId(record.fields.beamer_auswertung));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('veranstaltungen', 'titel')} value={record.fields.titel} format="text" />
        <RecordField label={fieldLabel('veranstaltungen', 'datum')} value={record.fields.datum} format="date" />
        <RecordField label={fieldLabel('veranstaltungen', 'beschreibung')} value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('veranstaltungen', 'beamer_modus')} value={record.fields.beamer_modus} format="pill" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('veranstaltungen', 'beamer_auswertung')}
          name={beamer_auswertungTarget?.fields.bezeichnung ?? '—'}
          meta={undefined}
          onClick={beamer_auswertungTarget && onOpenAuswertungen ? () => onOpenAuswertungen!(beamer_auswertungTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('fragen_an_die_gruppe')}
        items={fragenAnDieGruppeList.filter(r => extractRecordId(r.fields.veranstaltung) === record.record_id)}
        map={r => ({ name: r.fields.bezeichnung ?? appLabel('fragen_an_die_gruppe'), meta: undefined })}
        onOpen={onOpenFragenAnDieGruppe}
        onAdd={onAddFragenAnDieGruppe}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('teilnehmende')}
        items={teilnehmendeList.filter(r => extractRecordId(r.fields.veranstaltung) === record.record_id)}
        map={r => ({ name: r.fields.kuerzel ?? appLabel('teilnehmende'), meta: r.fields.einwilligung_zeitpunkt })}
        onOpen={onOpenTeilnehmende}
        onAdd={onAddTeilnehmende}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.VERANSTALTUNGEN} recordId={record.record_id} readOnly={!perms.canWrite('veranstaltungen')} />
    </>
  );
}
