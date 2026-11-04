import type { EnrichedAuswertungen, EnrichedBeitraege, EnrichedFragenAnDieGruppe, EnrichedTeilnehmende, EnrichedVeranstaltungen } from '@/types/enriched';
import type { Auswertungen, Beitraege, FragenAnDieGruppe, Teilnehmende, Veranstaltungen } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface VeranstaltungenMaps {
  auswertungenMap: Map<string, Auswertungen>;
}

export function enrichVeranstaltungen(
  veranstaltungen: Veranstaltungen[],
  maps: VeranstaltungenMaps
): EnrichedVeranstaltungen[] {
  return veranstaltungen.map(r => ({
    ...r,
    beamer_auswertungName: resolveDisplay(r.fields.beamer_auswertung, maps.auswertungenMap, 'bezeichnung'),
  }));
}

interface FragenAnDieGruppeMaps {
  veranstaltungenMap: Map<string, Veranstaltungen>;
  auswertungenMap: Map<string, Auswertungen>;
}

export function enrichFragenAnDieGruppe(
  fragenAnDieGruppe: FragenAnDieGruppe[],
  maps: FragenAnDieGruppeMaps
): EnrichedFragenAnDieGruppe[] {
  return fragenAnDieGruppe.map(r => ({
    ...r,
    veranstaltungName: resolveDisplay(r.fields.veranstaltung, maps.veranstaltungenMap, 'titel'),
    auswertung_quelleName: resolveDisplay(r.fields.auswertung_quelle, maps.auswertungenMap, 'bezeichnung'),
  }));
}

interface TeilnehmendeMaps {
  veranstaltungenMap: Map<string, Veranstaltungen>;
}

export function enrichTeilnehmende(
  teilnehmende: Teilnehmende[],
  maps: TeilnehmendeMaps
): EnrichedTeilnehmende[] {
  return teilnehmende.map(r => ({
    ...r,
    veranstaltungName: resolveDisplay(r.fields.veranstaltung, maps.veranstaltungenMap, 'titel'),
  }));
}

interface BeitraegeMaps {
  fragenAnDieGruppeMap: Map<string, FragenAnDieGruppe>;
  teilnehmendeMap: Map<string, Teilnehmende>;
}

export function enrichBeitraege(
  beitraege: Beitraege[],
  maps: BeitraegeMaps
): EnrichedBeitraege[] {
  return beitraege.map(r => ({
    ...r,
    frageName: resolveDisplay(r.fields.frage, maps.fragenAnDieGruppeMap, 'bezeichnung'),
    teilnehmerName: resolveDisplay(r.fields.teilnehmer, maps.teilnehmendeMap, 'kuerzel'),
  }));
}

interface AuswertungenMaps {
  fragenAnDieGruppeMap: Map<string, FragenAnDieGruppe>;
}

export function enrichAuswertungen(
  auswertungen: Auswertungen[],
  maps: AuswertungenMaps
): EnrichedAuswertungen[] {
  return auswertungen.map(r => ({
    ...r,
    frageName: resolveDisplay(r.fields.frage, maps.fragenAnDieGruppeMap, 'bezeichnung'),
  }));
}
