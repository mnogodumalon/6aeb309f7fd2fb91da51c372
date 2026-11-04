/**
 * Occupancy semantics — DECIDED BY THE PLAN when it has a no_overlap check
 * (rendered below, generator-owned), else by the build agent, never by a
 * heuristic. Without a plan the Phase-2 orchestrator writes its decision to
 * `.intents-staging/occupancy.json` (stay pair, booked resource, statuses
 * that do not occupy); the integration step validates it against the app
 * metadata and renders it into the block below. Do not edit outside the markers.
 *
 * Both doors read this and nothing else: `occupancyFor` (internal flows AND
 * public pages) and the owner service (the public grant's occupancy read).
 * No rule for an entity = no availability calendar, no occupancy claim —
 * a plain date field pair is shown instead.
 *
 * Facts from the metadata — candidates, NOT decisions:
 *   - veranstaltungen: applookups beamer_auswertung→auswertungen · lookups beamer_modus[frage_beitraege|zusammenstellung|ki_ergebnis]
 *   - fragen_an_die_gruppe: applookups veranstaltung→veranstaltungen, auswertung_quelle→auswertungen · lookups typ[ideen|fragen|stimmung|probleme|sonstiges], status[vorbereitet|geoeffnet|geschlossen]
 *   - teilnehmende: applookups veranstaltung→veranstaltungen
 *   - beitraege: applookups frage→fragen_an_die_gruppe, teilnehmer→teilnehmende · lookups wichtigkeit[niedrig|mittel|hoch], sichtbarkeit[neu|freigegeben|ausgeblendet]
 *   - auswertungen: applookups frage→fragen_an_die_gruppe · lookups status[entwurf|an_ki_gegeben|ergebnis_vorhanden]
 */
import type { EntityKey } from '@/lib/journey/rules';

export interface OccupancyRule {
  /** Arrival / departure fields (the departure day is exclusive). */
  from: string;
  to: string;
  /** applookup field naming the booked RESOURCE (room, vehicle, court).
   *  Omit when the entity itself is the one resource (a single holiday flat). */
  resource?: string;
  /** lookup field + the keys that mean "does NOT occupy" (cancelled, no-show). */
  statusField?: string;
  freeKeys?: string[];
}

export const OCCUPANCY: Partial<Record<EntityKey, OccupancyRule>> = {
  // <custom:occupancy>
  // </custom:occupancy>
};

/**
 * A record of the KEY entity is TAKEN while a record of `entity` points at it
 * through `field` — a slot with a booking, a seat with a ticket. Generated
 * from the plan's blocking `unique` check on that reference (05.10.2026:
 * the salon's public page offered booked slots again). Pickers on both
 * doors leave taken records out (useRecordSearch); a public page reads only
 * `field` of `entity` — never who booked. Generator-owned: no markers.
 */
export interface TakenRule {
  entity: EntityKey;
  field: string;
}

export const TAKEN_BY: Partial<Record<EntityKey, TakenRule>> = {
};
