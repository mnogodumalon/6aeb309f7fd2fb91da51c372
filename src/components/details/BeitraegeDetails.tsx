import type { Beitraege, FragenAnDieGruppe, Teilnehmende } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { usePermissions } from '@/lib/permissions';

export interface BeitraegeDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Beitraege;
  /** N:1-Ziel „FragenAnDieGruppe": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  fragenAnDieGruppeList: FragenAnDieGruppe[];
  /** Klick auf die FragenAnDieGruppe-Relation → overlay.push auf dessen Detail. */
  onOpenFragenAnDieGruppe?: (record: FragenAnDieGruppe) => void;
  /** N:1-Ziel „Teilnehmende": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  teilnehmendeList: Teilnehmende[];
  /** Klick auf die Teilnehmende-Relation → overlay.push auf dessen Detail. */
  onOpenTeilnehmende?: (record: Teilnehmende) => void;
}

export function BeitraegeDetails({
  record,
  fragenAnDieGruppeList,
  onOpenFragenAnDieGruppe,
  teilnehmendeList,
  onOpenTeilnehmende,
}: BeitraegeDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const frageTarget = fragenAnDieGruppeList.find(r => r.record_id === extractRecordId(record.fields.frage));
  const teilnehmerTarget = teilnehmendeList.find(r => r.record_id === extractRecordId(record.fields.teilnehmer));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('beitraege', 'antwort')} value={record.fields.antwort} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('beitraege', 'anmerkung')} value={record.fields.anmerkung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('beitraege', 'wichtigkeit')} value={record.fields.wichtigkeit} format="pill" />
        <RecordField label={fieldLabel('beitraege', 'einsende_kennung')} value={record.fields.einsende_kennung} format="text" />
        <RecordField label={fieldLabel('beitraege', 'sichtbarkeit')} value={record.fields.sichtbarkeit} format="pill" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('beitraege', 'frage')}
          name={frageTarget?.fields.bezeichnung ?? '—'}
          meta={undefined}
          onClick={frageTarget && onOpenFragenAnDieGruppe ? () => onOpenFragenAnDieGruppe!(frageTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('beitraege', 'teilnehmer')}
          name={teilnehmerTarget?.fields.kuerzel ?? '—'}
          meta={[teilnehmerTarget?.fields.email].filter(Boolean).join(' · ') || undefined}
          onClick={teilnehmerTarget && onOpenTeilnehmende ? () => onOpenTeilnehmende!(teilnehmerTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.BEITRAEGE} recordId={record.record_id} readOnly={!perms.canWrite('beitraege')} />
    </>
  );
}
