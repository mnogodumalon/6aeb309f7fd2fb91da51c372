/**
 * EntityCrud — pre-generated CRUD + overlay plumbing for the dashboard.
 * Compose it; NEVER re-roll dialog state, submit handlers, an overlay stack
 * or a RecordOverlayHost in the page — this file owns all of it.
 *
 * API at a glance:
 *   const data = useDashboardData();
 *   const crud = useEntityCrud(data, {
 *     // optional — the ONE semantic slot on the overlay: the record's next
 *     // workflow step. Return undefined for types without one.
 *     footer: (top) => top.type === 'veranstaltungen'
 *       ? { label: …, onClick: () => … }
 *       : undefined,
 *   });
 *
 *   `top.type` is the SAME camelCase key as `crud.<entity>` — one spelling
 *   per entity, everywhere in this API.
 *   …
 *   crud.veranstaltungen.openCreate({ …defaults })   // create dialog, prefilled — defaults are
 *                                       // shape-tolerant: bare lookup keys / record ids are fine
 *   crud.veranstaltungen.openEdit(record)            // edit dialog (recordId + defaults wired)
 *   crud.veranstaltungen.openDetail(record)          // record overlay — pass the RAW record,
 *                                       // enrichment is resolved inside
 *   crud.overlay                         // RecordOverlayStack<OverlayItem> for drills:
 *                                       // push / pop / replace / close
 *   crud.enriched.veranstaltungen              // the display-ready array for EVERY entity —
 *                                       // Enriched* where relations exist, the raw array
 *                                       // otherwise. Reuse these; never call enrich*()
 *                                       // in the page, and never guess which entity has
 *                                       // one: they all do.
 *   {crud.surfaces}                      // render ONCE at the end of the page JSX:
 *                                       // all entity dialogs + the overlay host
 *
 * Built in (do NOT re-implement): optimistic update + Rückgängig counter-write
 * on edit, fetchAll-on-error, edit-from-overlay, and per-entity overlay bodies
 * (RecordHeader + <{Entity}Details> with every relation reachable and the
 * contextual "+" prefilled; list-field back-references additionally get a
 * "choose existing" picker that links an EXISTING record — built in, do not
 * re-roll). Drag writes (onEventDrop/onCardMove) stay YOURS:
 * optimistic setter first, PATCH in background, undoToast with counter-write.
 *
 * Overlay content per entity (the host renders these — you never compose
 * Details blocks yourself):
 *   veranstaltungen: beamer_auswertung, titel, datum, beschreibung, beamer_modus  ·  → auswertungen · ← fragen_an_die_gruppe (list + contextual +) · ← teilnehmende (list + contextual +)
 *   fragen_an_die_gruppe: typ, laufende_nummer, status, bezeichnung, fragestellung, ki_einleitung, ki_auftrag, sofort_zeigen, …  ·  → veranstaltungen · → auswertungen · ← beitraege (list + contextual +) · ← auswertungen (list + contextual +)
 *   teilnehmende: kuerzel, email, einwilligung, einwilligung_zeitpunkt, veranstaltung  ·  → veranstaltungen · ← beitraege (list + contextual +)
 *   beitraege: frage, teilnehmer, antwort, anmerkung, wichtigkeit, einsende_kennung, sichtbarkeit  ·  → fragen_an_die_gruppe · → teilnehmende
 *   auswertungen: frage, fassung, bezeichnung, zusammenstellung, verwendete_beitraege, zeitstand, ki_antwort, abschnitt_1, …  ·  → fragen_an_die_gruppe · ← veranstaltungen (list + contextual +) · ← fragen_an_die_gruppe (list + contextual +)
 */
import { useState, useMemo, type ReactNode } from 'react';
import type { Veranstaltungen, FragenAnDieGruppe, Teilnehmende, Beitraege, Auswertungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { enrichVeranstaltungen, enrichFragenAnDieGruppe, enrichTeilnehmende, enrichBeitraege, enrichAuswertungen } from '@/lib/enrich';
import type { EnrichedVeranstaltungen, EnrichedFragenAnDieGruppe, EnrichedTeilnehmende, EnrichedBeitraege, EnrichedAuswertungen } from '@/types/enriched';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  useRecordOverlayStack, RecordOverlayHost, RecordHeader,
  type RecordOverlayStack,
} from '@/components/widgets/RecordView';
import { VeranstaltungenDialog, type VeranstaltungenDialogDefaults } from '@/components/dialogs/VeranstaltungenDialog';
import { VeranstaltungenDetails } from '@/components/details/VeranstaltungenDetails';
import { FragenAnDieGruppeDialog, type FragenAnDieGruppeDialogDefaults } from '@/components/dialogs/FragenAnDieGruppeDialog';
import { FragenAnDieGruppeDetails } from '@/components/details/FragenAnDieGruppeDetails';
import { TeilnehmendeDialog, type TeilnehmendeDialogDefaults } from '@/components/dialogs/TeilnehmendeDialog';
import { TeilnehmendeDetails } from '@/components/details/TeilnehmendeDetails';
import { BeitraegeDialog, type BeitraegeDialogDefaults } from '@/components/dialogs/BeitraegeDialog';
import { BeitraegeDetails } from '@/components/details/BeitraegeDetails';
import { AuswertungenDialog, type AuswertungenDialogDefaults } from '@/components/dialogs/AuswertungenDialog';
import { AuswertungenDetails } from '@/components/details/AuswertungenDetails';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { t, appLabel } from '@/i18n';
import { undoToast } from '@/lib/polish';
import { usePermissions } from '@/lib/permissions';
import { toast } from 'sonner';
import { formatDate } from '@/lib/formatters';

// The overlay union — one branch per entity, `record` typed the way the data
// flows: Enriched* where enrichment exists, the raw record type otherwise.
// The host resolves enrichment itself; pages pass raw records everywhere.
export type OverlayItem =
  | { type: 'veranstaltungen'; record: EnrichedVeranstaltungen }
  | { type: 'fragenAnDieGruppe'; record: EnrichedFragenAnDieGruppe }
  | { type: 'teilnehmende'; record: EnrichedTeilnehmende }
  | { type: 'beitraege'; record: EnrichedBeitraege }
  | { type: 'auswertungen'; record: EnrichedAuswertungen };

/** The useDashboardData() return — pass it in, never re-fetch inside. */
export type EntityCrudData = ReturnType<typeof useDashboardData>;

export interface EntityCrudOptions {
  /** Per-type overlay footer — the record's next workflow step. */
  /** The action may return a sentence — the reason the step was NOT taken; the overlay shows it under the button. */
  footer?: (top: OverlayItem) => ReactNode | { label: ReactNode; onClick: () => void | string | Promise<void | string> } | undefined;
  placement?: 'side' | 'center';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface EntityCrudApi<TRecord, TDefaults> {
  /** Open the create dialog, optionally prefilled (shape-tolerant defaults). */
  openCreate: (defaults?: TDefaults) => void;
  /** Open the edit dialog for a record (recordId + defaults are wired). */
  openEdit: (record: TRecord) => void;
  /** Open the record overlay (raw record is fine — enrichment resolved inside). */
  openDetail: (record: TRecord) => void;
  /** May the signed-in user create/change records of this list? (the
   *  platform's rights — show a „+ Neu“ only when true; openCreate/openEdit
   *  refuse with a notice otherwise). */
  canWrite: boolean;
}

export interface EntityCrud {
  /** The overlay stack for drills: push / pop / replace / close. */
  overlay: RecordOverlayStack<OverlayItem>;
  /** Render ONCE at the end of the page JSX — all dialogs + the overlay host. */
  surfaces: ReactNode;
  veranstaltungen: EntityCrudApi<Veranstaltungen, VeranstaltungenDialogDefaults>;
  fragenAnDieGruppe: EntityCrudApi<FragenAnDieGruppe, FragenAnDieGruppeDialogDefaults>;
  teilnehmende: EntityCrudApi<Teilnehmende, TeilnehmendeDialogDefaults>;
  beitraege: EntityCrudApi<Beitraege, BeitraegeDialogDefaults>;
  auswertungen: EntityCrudApi<Auswertungen, AuswertungenDialogDefaults>;
  /** The display-ready array per entity: Enriched* where an enrich function
   *  exists, the raw array otherwise. One key per entity so no page has to
   *  know which is which. Reuse these; never re-enrich in the page. */
  enriched: { veranstaltungen: EnrichedVeranstaltungen[]; fragenAnDieGruppe: EnrichedFragenAnDieGruppe[]; teilnehmende: EnrichedTeilnehmende[]; beitraege: EnrichedBeitraege[]; auswertungen: EnrichedAuswertungen[] };
}

export function useEntityCrud(data: EntityCrudData, options?: EntityCrudOptions): EntityCrud {
  const overlay = useRecordOverlayStack<OverlayItem>();
  // the platform's rights of the signed-in user (lib/permissions.ts) — unknown = allowed
  const perms = usePermissions();
  const refuse = () => { toast.error(t('perm_denied_title'), { description: t('perm_denied_desc') }); };
  const [veranstaltungenDialog, setVeranstaltungenDialog] = useState<{ defaults?: VeranstaltungenDialogDefaults; editing?: Veranstaltungen } | null>(null);
  const [fragenAnDieGruppeDialog, setFragenAnDieGruppeDialog] = useState<{ defaults?: FragenAnDieGruppeDialogDefaults; editing?: FragenAnDieGruppe } | null>(null);
  const [teilnehmendeDialog, setTeilnehmendeDialog] = useState<{ defaults?: TeilnehmendeDialogDefaults; editing?: Teilnehmende } | null>(null);
  const [beitraegeDialog, setBeitraegeDialog] = useState<{ defaults?: BeitraegeDialogDefaults; editing?: Beitraege } | null>(null);
  const [auswertungenDialog, setAuswertungenDialog] = useState<{ defaults?: AuswertungenDialogDefaults; editing?: Auswertungen } | null>(null);
  const enrichedVeranstaltungen = useMemo(() => enrichVeranstaltungen(data.veranstaltungen, { auswertungenMap: data.auswertungenMap }), [data.veranstaltungen, data.auswertungenMap]);
  const enrichedFragenAnDieGruppe = useMemo(() => enrichFragenAnDieGruppe(data.fragenAnDieGruppe, { veranstaltungenMap: data.veranstaltungenMap, auswertungenMap: data.auswertungenMap }), [data.fragenAnDieGruppe, data.veranstaltungenMap, data.auswertungenMap]);
  const enrichedTeilnehmende = useMemo(() => enrichTeilnehmende(data.teilnehmende, { veranstaltungenMap: data.veranstaltungenMap }), [data.teilnehmende, data.veranstaltungenMap]);
  const enrichedBeitraege = useMemo(() => enrichBeitraege(data.beitraege, { fragenAnDieGruppeMap: data.fragenAnDieGruppeMap, teilnehmendeMap: data.teilnehmendeMap }), [data.beitraege, data.fragenAnDieGruppeMap, data.teilnehmendeMap]);
  const enrichedAuswertungen = useMemo(() => enrichAuswertungen(data.auswertungen, { fragenAnDieGruppeMap: data.fragenAnDieGruppeMap }), [data.auswertungen, data.fragenAnDieGruppeMap]);

  function detailVeranstaltungen(record: Veranstaltungen, push = false) {
    const rec = enrichedVeranstaltungen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'veranstaltungen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitVeranstaltungen(fields: Veranstaltungen['fields']) {
    const editing = veranstaltungenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setVeranstaltungen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateVeranstaltungenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('veranstaltungen')} — ${t('crud_updated')}`, async () => {
        data.setVeranstaltungen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateVeranstaltungenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createVeranstaltungenEntry(fields);
      undoToast(`${appLabel('veranstaltungen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailFragenAnDieGruppe(record: FragenAnDieGruppe, push = false) {
    const rec = enrichedFragenAnDieGruppe.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'fragenAnDieGruppe', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitFragenAnDieGruppe(fields: FragenAnDieGruppe['fields']) {
    const editing = fragenAnDieGruppeDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setFragenAnDieGruppe(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateFragenAnDieGruppeEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('fragen_an_die_gruppe')} — ${t('crud_updated')}`, async () => {
        data.setFragenAnDieGruppe(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateFragenAnDieGruppeEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createFragenAnDieGruppeEntry(fields);
      undoToast(`${appLabel('fragen_an_die_gruppe')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailTeilnehmende(record: Teilnehmende, push = false) {
    const rec = enrichedTeilnehmende.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'teilnehmende', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitTeilnehmende(fields: Teilnehmende['fields']) {
    const editing = teilnehmendeDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setTeilnehmende(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateTeilnehmendeEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('teilnehmende')} — ${t('crud_updated')}`, async () => {
        data.setTeilnehmende(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateTeilnehmendeEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createTeilnehmendeEntry(fields);
      undoToast(`${appLabel('teilnehmende')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailBeitraege(record: Beitraege, push = false) {
    const rec = enrichedBeitraege.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'beitraege', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitBeitraege(fields: Beitraege['fields']) {
    const editing = beitraegeDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setBeitraege(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateBeitraegeEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('beitraege')} — ${t('crud_updated')}`, async () => {
        data.setBeitraege(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateBeitraegeEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createBeitraegeEntry(fields);
      undoToast(`${appLabel('beitraege')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailAuswertungen(record: Auswertungen, push = false) {
    const rec = enrichedAuswertungen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'auswertungen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitAuswertungen(fields: Auswertungen['fields']) {
    const editing = auswertungenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setAuswertungen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateAuswertungenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('auswertungen')} — ${t('crud_updated')}`, async () => {
        data.setAuswertungen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateAuswertungenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createAuswertungenEntry(fields);
      undoToast(`${appLabel('auswertungen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  const surfaces = (
    <>
      <VeranstaltungenDialog
        open={veranstaltungenDialog !== null}
        onClose={() => setVeranstaltungenDialog(null)}
        onSubmit={submitVeranstaltungen}
        defaultValues={veranstaltungenDialog?.defaults}
        recordId={veranstaltungenDialog?.editing?.record_id}
        auswertungenList={data.auswertungen}
        enablePhotoScan={AI_PHOTO_SCAN['Veranstaltungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Veranstaltungen']}
      />
      <FragenAnDieGruppeDialog
        open={fragenAnDieGruppeDialog !== null}
        onClose={() => setFragenAnDieGruppeDialog(null)}
        onSubmit={submitFragenAnDieGruppe}
        defaultValues={fragenAnDieGruppeDialog?.defaults}
        recordId={fragenAnDieGruppeDialog?.editing?.record_id}
        veranstaltungenList={data.veranstaltungen}
        auswertungenList={data.auswertungen}
        enablePhotoScan={AI_PHOTO_SCAN['FragenAnDieGruppe']}
        enablePhotoLocation={AI_PHOTO_LOCATION['FragenAnDieGruppe']}
      />
      <TeilnehmendeDialog
        open={teilnehmendeDialog !== null}
        onClose={() => setTeilnehmendeDialog(null)}
        onSubmit={submitTeilnehmende}
        defaultValues={teilnehmendeDialog?.defaults}
        recordId={teilnehmendeDialog?.editing?.record_id}
        veranstaltungenList={data.veranstaltungen}
        enablePhotoScan={AI_PHOTO_SCAN['Teilnehmende']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Teilnehmende']}
      />
      <BeitraegeDialog
        open={beitraegeDialog !== null}
        onClose={() => setBeitraegeDialog(null)}
        onSubmit={submitBeitraege}
        defaultValues={beitraegeDialog?.defaults}
        recordId={beitraegeDialog?.editing?.record_id}
        fragenAnDieGruppeList={data.fragenAnDieGruppe}
        teilnehmendeList={data.teilnehmende}
        enablePhotoScan={AI_PHOTO_SCAN['Beitraege']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Beitraege']}
      />
      <AuswertungenDialog
        open={auswertungenDialog !== null}
        onClose={() => setAuswertungenDialog(null)}
        onSubmit={submitAuswertungen}
        defaultValues={auswertungenDialog?.defaults}
        recordId={auswertungenDialog?.editing?.record_id}
        fragenAnDieGruppeList={data.fragenAnDieGruppe}
        enablePhotoScan={AI_PHOTO_SCAN['Auswertungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Auswertungen']}
      />
      <RecordOverlayHost
        overlay={overlay}
        placement={options?.placement}
        size={options?.size}
        footer={options?.footer}
        render={(top) => {
          if (top.type === 'veranstaltungen') {
            return (
              <>
                <RecordHeader title={top.record.fields.titel ?? appLabel('veranstaltungen')} subtitle={top.record.fields.datum ? formatDate(top.record.fields.datum) : undefined} />
                <VeranstaltungenDetails
                  record={top.record}
                  auswertungenList={data.auswertungen}
                  onOpenAuswertungen={(r) => detailAuswertungen(r, true)}
                  fragenAnDieGruppeList={data.fragenAnDieGruppe}
                  onOpenFragenAnDieGruppe={(r) => detailFragenAnDieGruppe(r, true)}
                  onAddFragenAnDieGruppe={perms.canWrite('fragen_an_die_gruppe') ? () => setFragenAnDieGruppeDialog({ defaults: { veranstaltung: createRecordUrl(APP_IDS.VERANSTALTUNGEN, top.record.record_id) } }) : undefined}
                  teilnehmendeList={data.teilnehmende}
                  onOpenTeilnehmende={(r) => detailTeilnehmende(r, true)}
                  onAddTeilnehmende={perms.canWrite('teilnehmende') ? () => setTeilnehmendeDialog({ defaults: { veranstaltung: createRecordUrl(APP_IDS.VERANSTALTUNGEN, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'fragenAnDieGruppe') {
            return (
              <>
                <RecordHeader title={top.record.fields.bezeichnung ?? appLabel('fragen_an_die_gruppe')} subtitle={undefined} />
                <FragenAnDieGruppeDetails
                  record={top.record}
                  veranstaltungenList={data.veranstaltungen}
                  onOpenVeranstaltungen={(r) => detailVeranstaltungen(r, true)}
                  auswertungenList={data.auswertungen}
                  onOpenAuswertungen={(r) => detailAuswertungen(r, true)}
                  beitraegeList={data.beitraege}
                  onOpenBeitraege={(r) => detailBeitraege(r, true)}
                  onAddBeitraege={perms.canWrite('beitraege') ? () => setBeitraegeDialog({ defaults: { frage: createRecordUrl(APP_IDS.FRAGEN_AN_DIE_GRUPPE, top.record.record_id) } }) : undefined}
                  auswertungenFrageList={data.auswertungen}
                  onOpenAuswertungenFrage={(r) => detailAuswertungen(r, true)}
                  onAddAuswertungenFrage={perms.canWrite('auswertungen') ? () => setAuswertungenDialog({ defaults: { frage: createRecordUrl(APP_IDS.FRAGEN_AN_DIE_GRUPPE, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'teilnehmende') {
            return (
              <>
                <RecordHeader title={top.record.fields.kuerzel ?? appLabel('teilnehmende')} subtitle={top.record.fields.einwilligung_zeitpunkt ? formatDate(top.record.fields.einwilligung_zeitpunkt) : undefined} />
                <TeilnehmendeDetails
                  record={top.record}
                  veranstaltungenList={data.veranstaltungen}
                  onOpenVeranstaltungen={(r) => detailVeranstaltungen(r, true)}
                  beitraegeList={data.beitraege}
                  onOpenBeitraege={(r) => detailBeitraege(r, true)}
                  onAddBeitraege={perms.canWrite('beitraege') ? () => setBeitraegeDialog({ defaults: { teilnehmer: createRecordUrl(APP_IDS.TEILNEHMENDE, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'beitraege') {
            return (
              <>
                <RecordHeader title={top.record.fields.einsende_kennung ?? appLabel('beitraege')} subtitle={undefined} />
                <BeitraegeDetails
                  record={top.record}
                  fragenAnDieGruppeList={data.fragenAnDieGruppe}
                  onOpenFragenAnDieGruppe={(r) => detailFragenAnDieGruppe(r, true)}
                  teilnehmendeList={data.teilnehmende}
                  onOpenTeilnehmende={(r) => detailTeilnehmende(r, true)}
                />
              </>
            );
          }
          if (top.type === 'auswertungen') {
            return (
              <>
                <RecordHeader title={top.record.fields.bezeichnung ?? appLabel('auswertungen')} subtitle={top.record.fields.zeitstand ? formatDate(top.record.fields.zeitstand) : undefined} />
                <AuswertungenDetails
                  record={top.record}
                  fragenAnDieGruppeList={data.fragenAnDieGruppe}
                  onOpenFragenAnDieGruppe={(r) => detailFragenAnDieGruppe(r, true)}
                  veranstaltungenList={data.veranstaltungen}
                  onOpenVeranstaltungen={(r) => detailVeranstaltungen(r, true)}
                  onAddVeranstaltungen={perms.canWrite('veranstaltungen') ? () => setVeranstaltungenDialog({ defaults: { beamer_auswertung: createRecordUrl(APP_IDS.AUSWERTUNGEN, top.record.record_id) } }) : undefined}
                  fragenAnDieGruppeAuswertungQuelleList={data.fragenAnDieGruppe}
                  onOpenFragenAnDieGruppeAuswertungQuelle={(r) => detailFragenAnDieGruppe(r, true)}
                  onAddFragenAnDieGruppeAuswertungQuelle={perms.canWrite('fragen_an_die_gruppe') ? () => setFragenAnDieGruppeDialog({ defaults: { auswertung_quelle: createRecordUrl(APP_IDS.AUSWERTUNGEN, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          return null;
        }}
        canEdit={(top) => {
          if (top.type === 'veranstaltungen') return perms.canWrite('veranstaltungen');
          if (top.type === 'fragenAnDieGruppe') return perms.canWrite('fragen_an_die_gruppe');
          if (top.type === 'teilnehmende') return perms.canWrite('teilnehmende');
          if (top.type === 'beitraege') return perms.canWrite('beitraege');
          if (top.type === 'auswertungen') return perms.canWrite('auswertungen');
          return true;
        }}
        onEdit={(top) => {
          overlay.close();
          if (top.type === 'veranstaltungen') setVeranstaltungenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'fragenAnDieGruppe') setFragenAnDieGruppeDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'teilnehmende') setTeilnehmendeDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'beitraege') setBeitraegeDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'auswertungen') setAuswertungenDialog({ editing: top.record, defaults: top.record.fields });
        }}
      />
    </>
  );

  return {
    overlay,
    surfaces,
    veranstaltungen: {
      openCreate: (defaults?: VeranstaltungenDialogDefaults) => (perms.canWrite('veranstaltungen') ? setVeranstaltungenDialog({ defaults }) : refuse()),
      openEdit: (record: Veranstaltungen) => (perms.canWrite('veranstaltungen') ? setVeranstaltungenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Veranstaltungen) => detailVeranstaltungen(record, false),
      canWrite: perms.canWrite('veranstaltungen'),
    },
    fragenAnDieGruppe: {
      openCreate: (defaults?: FragenAnDieGruppeDialogDefaults) => (perms.canWrite('fragen_an_die_gruppe') ? setFragenAnDieGruppeDialog({ defaults }) : refuse()),
      openEdit: (record: FragenAnDieGruppe) => (perms.canWrite('fragen_an_die_gruppe') ? setFragenAnDieGruppeDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: FragenAnDieGruppe) => detailFragenAnDieGruppe(record, false),
      canWrite: perms.canWrite('fragen_an_die_gruppe'),
    },
    teilnehmende: {
      openCreate: (defaults?: TeilnehmendeDialogDefaults) => (perms.canWrite('teilnehmende') ? setTeilnehmendeDialog({ defaults }) : refuse()),
      openEdit: (record: Teilnehmende) => (perms.canWrite('teilnehmende') ? setTeilnehmendeDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Teilnehmende) => detailTeilnehmende(record, false),
      canWrite: perms.canWrite('teilnehmende'),
    },
    beitraege: {
      openCreate: (defaults?: BeitraegeDialogDefaults) => (perms.canWrite('beitraege') ? setBeitraegeDialog({ defaults }) : refuse()),
      openEdit: (record: Beitraege) => (perms.canWrite('beitraege') ? setBeitraegeDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Beitraege) => detailBeitraege(record, false),
      canWrite: perms.canWrite('beitraege'),
    },
    auswertungen: {
      openCreate: (defaults?: AuswertungenDialogDefaults) => (perms.canWrite('auswertungen') ? setAuswertungenDialog({ defaults }) : refuse()),
      openEdit: (record: Auswertungen) => (perms.canWrite('auswertungen') ? setAuswertungenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Auswertungen) => detailAuswertungen(record, false),
      canWrite: perms.canWrite('auswertungen'),
    },
    enriched: { veranstaltungen: enrichedVeranstaltungen, fragenAnDieGruppe: enrichedFragenAnDieGruppe, teilnehmende: enrichedTeilnehmende, beitraege: enrichedBeitraege, auswertungen: enrichedAuswertungen },
  };
}
