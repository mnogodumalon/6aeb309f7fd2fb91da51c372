import type { Auswertungen, FragenAnDieGruppe, Veranstaltungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface AuswertungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Auswertungen;
  /** N:1-Ziel „FragenAnDieGruppe": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  fragenAnDieGruppeList: FragenAnDieGruppe[];
  /** Klick auf die FragenAnDieGruppe-Relation → overlay.push auf dessen Detail. */
  onOpenFragenAnDieGruppe?: (record: FragenAnDieGruppe) => void;
  /** 1:N „Veranstaltungen" (beamer_auswertung): VOLLE Liste — der Block filtert auf diesen Record. */
  veranstaltungenList: Veranstaltungen[];
  /** Zeilen-Klick → overlay.push auf das Veranstaltungen-Detail (nie der Edit-Dialog). */
  onOpenVeranstaltungen: (record: Veranstaltungen) => void;
  /** Kontextuelles „+": öffnet den Veranstaltungen-Dialog mit diesem Record vorgesetzt. */
  onAddVeranstaltungen?: () => void;
  /** 1:N „Fragen an die Gruppe" (auswertung_quelle): VOLLE Liste — der Block filtert auf diesen Record. */
  fragenAnDieGruppeAuswertungQuelleList: FragenAnDieGruppe[];
  /** Zeilen-Klick → overlay.push auf das FragenAnDieGruppe-Detail (nie der Edit-Dialog). */
  onOpenFragenAnDieGruppeAuswertungQuelle: (record: FragenAnDieGruppe) => void;
  /** Kontextuelles „+": öffnet den FragenAnDieGruppe-Dialog mit diesem Record vorgesetzt. */
  onAddFragenAnDieGruppeAuswertungQuelle?: () => void;
}

export function AuswertungenDetails({
  record,
  fragenAnDieGruppeList,
  onOpenFragenAnDieGruppe,
  veranstaltungenList,
  onOpenVeranstaltungen,
  onAddVeranstaltungen,
  fragenAnDieGruppeAuswertungQuelleList,
  onOpenFragenAnDieGruppeAuswertungQuelle,
  onAddFragenAnDieGruppeAuswertungQuelle,
}: AuswertungenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const frageTarget = fragenAnDieGruppeList.find(r => r.record_id === extractRecordId(record.fields.frage));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('auswertungen', 'fassung')} value={record.fields.fassung} format="text" />
        <RecordField label={fieldLabel('auswertungen', 'bezeichnung')} value={record.fields.bezeichnung} format="text" />
        <RecordField label={fieldLabel('auswertungen', 'zusammenstellung')} value={record.fields.zusammenstellung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('auswertungen', 'verwendete_beitraege')} value={record.fields.verwendete_beitraege} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('auswertungen', 'zeitstand')} value={record.fields.zeitstand} format="datetime" />
        <RecordField label={fieldLabel('auswertungen', 'ki_antwort')} value={record.fields.ki_antwort} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('auswertungen', 'abschnitt_1')} value={record.fields.abschnitt_1} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('auswertungen', 'abschnitt_2')} value={record.fields.abschnitt_2} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('auswertungen', 'abschnitt_3')} value={record.fields.abschnitt_3} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('auswertungen', 'abschnitt_4')} value={record.fields.abschnitt_4} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('auswertungen', 'abschnitt_5')} value={record.fields.abschnitt_5} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('auswertungen', 'abschnitt_6')} value={record.fields.abschnitt_6} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('auswertungen', 'notizen')} value={record.fields.notizen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('auswertungen', 'status')} value={record.fields.status} format="pill" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('auswertungen', 'frage')}
          name={frageTarget?.fields.bezeichnung ?? '—'}
          meta={undefined}
          onClick={frageTarget && onOpenFragenAnDieGruppe ? () => onOpenFragenAnDieGruppe!(frageTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('veranstaltungen')}
        items={veranstaltungenList.filter(r => extractRecordId(r.fields.beamer_auswertung) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('veranstaltungen'), meta: r.fields.datum })}
        onOpen={onOpenVeranstaltungen}
        onAdd={onAddVeranstaltungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('fragen_an_die_gruppe')} · ${fieldLabel('fragen_an_die_gruppe', 'auswertung_quelle')}`}
        items={fragenAnDieGruppeAuswertungQuelleList.filter(r => extractRecordId(r.fields.auswertung_quelle) === record.record_id)}
        map={r => ({ name: r.fields.bezeichnung ?? appLabel('fragen_an_die_gruppe'), meta: undefined })}
        onOpen={onOpenFragenAnDieGruppeAuswertungQuelle}
        onAdd={onAddFragenAnDieGruppeAuswertungQuelle}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.AUSWERTUNGEN} recordId={record.record_id} readOnly={!perms.canWrite('auswertungen')} />
    </>
  );
}
