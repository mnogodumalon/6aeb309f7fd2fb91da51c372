import type { FragenAnDieGruppe, Veranstaltungen, Auswertungen, Beitraege } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface FragenAnDieGruppeDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: FragenAnDieGruppe;
  /** N:1-Ziel „Veranstaltungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  veranstaltungenList: Veranstaltungen[];
  /** Klick auf die Veranstaltungen-Relation → overlay.push auf dessen Detail. */
  onOpenVeranstaltungen?: (record: Veranstaltungen) => void;
  /** N:1-Ziel „Auswertungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  auswertungenList: Auswertungen[];
  /** Klick auf die Auswertungen-Relation → overlay.push auf dessen Detail. */
  onOpenAuswertungen?: (record: Auswertungen) => void;
  /** 1:N „Beiträge" (frage): VOLLE Liste — der Block filtert auf diesen Record. */
  beitraegeList: Beitraege[];
  /** Zeilen-Klick → overlay.push auf das Beitraege-Detail (nie der Edit-Dialog). */
  onOpenBeitraege: (record: Beitraege) => void;
  /** Kontextuelles „+": öffnet den Beitraege-Dialog mit diesem Record vorgesetzt. */
  onAddBeitraege?: () => void;
  /** 1:N „Auswertungen" (frage): VOLLE Liste — der Block filtert auf diesen Record. */
  auswertungenFrageList: Auswertungen[];
  /** Zeilen-Klick → overlay.push auf das Auswertungen-Detail (nie der Edit-Dialog). */
  onOpenAuswertungenFrage: (record: Auswertungen) => void;
  /** Kontextuelles „+": öffnet den Auswertungen-Dialog mit diesem Record vorgesetzt. */
  onAddAuswertungenFrage?: () => void;
}

export function FragenAnDieGruppeDetails({
  record,
  veranstaltungenList,
  onOpenVeranstaltungen,
  auswertungenList,
  onOpenAuswertungen,
  beitraegeList,
  onOpenBeitraege,
  onAddBeitraege,
  auswertungenFrageList,
  onOpenAuswertungenFrage,
  onAddAuswertungenFrage,
}: FragenAnDieGruppeDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const veranstaltungTarget = veranstaltungenList.find(r => r.record_id === extractRecordId(record.fields.veranstaltung));
  const auswertung_quelleTarget = auswertungenList.find(r => r.record_id === extractRecordId(record.fields.auswertung_quelle));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('fragen_an_die_gruppe', 'typ')} value={record.fields.typ} format="pill" />
        <RecordField label={fieldLabel('fragen_an_die_gruppe', 'laufende_nummer')} value={record.fields.laufende_nummer} format="text" />
        <RecordField label={fieldLabel('fragen_an_die_gruppe', 'status')} value={record.fields.status} format="pill" />
        <RecordField label={fieldLabel('fragen_an_die_gruppe', 'bezeichnung')} value={record.fields.bezeichnung} format="text" />
        <RecordField label={fieldLabel('fragen_an_die_gruppe', 'fragestellung')} value={record.fields.fragestellung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('fragen_an_die_gruppe', 'ki_einleitung')} value={record.fields.ki_einleitung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('fragen_an_die_gruppe', 'ki_auftrag')} value={record.fields.ki_auftrag} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('fragen_an_die_gruppe', 'sofort_zeigen')} value={record.fields.sofort_zeigen} format="bool" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('fragen_an_die_gruppe', 'veranstaltung')}
          name={veranstaltungTarget?.fields.titel ?? '—'}
          meta={undefined}
          onClick={veranstaltungTarget && onOpenVeranstaltungen ? () => onOpenVeranstaltungen!(veranstaltungTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('fragen_an_die_gruppe', 'auswertung_quelle')}
          name={auswertung_quelleTarget?.fields.bezeichnung ?? '—'}
          meta={undefined}
          onClick={auswertung_quelleTarget && onOpenAuswertungen ? () => onOpenAuswertungen!(auswertung_quelleTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('beitraege')}
        items={beitraegeList.filter(r => extractRecordId(r.fields.frage) === record.record_id)}
        map={r => ({ name: r.fields.einsende_kennung ?? appLabel('beitraege'), meta: undefined })}
        onOpen={onOpenBeitraege}
        onAdd={onAddBeitraege}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('auswertungen')} · ${fieldLabel('auswertungen', 'frage')}`}
        items={auswertungenFrageList.filter(r => extractRecordId(r.fields.frage) === record.record_id)}
        map={r => ({ name: r.fields.bezeichnung ?? appLabel('auswertungen'), meta: r.fields.zeitstand })}
        onOpen={onOpenAuswertungenFrage}
        onAdd={onAddAuswertungenFrage}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.FRAGEN_AN_DIE_GRUPPE} recordId={record.record_id} readOnly={!perms.canWrite('fragen_an_die_gruppe')} />
    </>
  );
}
