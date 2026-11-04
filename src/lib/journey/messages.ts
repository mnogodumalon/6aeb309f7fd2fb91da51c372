/**
 * Required-field messages — WRITTEN BY THE BUILD AGENT, never by a heuristic.
 *
 * The layer knows two things about an empty required field: that it is
 * required and what its label is. Out of that it can only say „„Anreise" ist
 * ein Pflichtfeld". What the person should do instead („Bitte einen Gast
 * auswählen.") is meaning, and meaning is the agent's: the Phase-2 orchestrator
 * writes one short instruction per required field — what is needed, not why — to
 * `.intents-staging/messages.json`, the integration step validates it against
 * the app metadata and renders it into the block below. Scaffold updates keep
 * the block. Do not edit outside the markers.
 *
 * Every door reads this and nothing else: `useStepForm` (flows and public
 * pages), the generated {Entity}Dialog and the public form's server-error line.
 * A field without a sentence falls back to the label sentence — never to a
 * bare „Dieses Feld ist erforderlich".
 *
 * Required fields per entity (from the base view):
 *   - veranstaltungen: titel (Titel der Veranstaltung)
 *   - fragen_an_die_gruppe: typ (Typ), status (Status), fragestellung (Fragestellung an die Gruppe), veranstaltung (Veranstaltung)
 *   - teilnehmende: kuerzel (Kürzel), veranstaltung (Veranstaltung)
 *   - beitraege: frage (Frage), antwort (Deine Antwort)
 *   - auswertungen: frage (Frage)
 */
import { t, tx } from '@/i18n';
import { labelOf, type EntityKey } from './rules';

/** The writable fields of each entity — the keys a message may address (generated). */
export interface MessageFields {
  "veranstaltungen": "beamer_auswertung" | "titel" | "datum" | "beschreibung" | "beamer_modus";
  "fragen_an_die_gruppe": "typ" | "laufende_nummer" | "status" | "bezeichnung" | "fragestellung" | "ki_einleitung" | "ki_auftrag" | "sofort_zeigen" | "veranstaltung" | "auswertung_quelle";
  "teilnehmende": "kuerzel" | "email" | "einwilligung" | "einwilligung_zeitpunkt" | "veranstaltung";
  "beitraege": "frage" | "teilnehmer" | "antwort" | "anmerkung" | "wichtigkeit" | "einsende_kennung" | "sichtbarkeit";
  "auswertungen": "frage" | "fassung" | "bezeichnung" | "zusammenstellung" | "verwendete_beitraege" | "zeitstand" | "ki_antwort" | "abschnitt_1" | "abschnitt_2" | "abschnitt_3" | "abschnitt_4" | "abschnitt_5" | "abschnitt_6" | "notizen" | "status";
}
export type MessageFieldKey<E extends EntityKey> = E extends keyof MessageFields ? MessageFields[E] : never;

export const REQUIRED_MESSAGES: { [E in EntityKey]?: Partial<Record<MessageFieldKey<E>, string>> } = {
  // <custom:messages>
  veranstaltungen: { titel: "Bitte einen Titel eingeben." },
  fragen_an_die_gruppe: { typ: "Bitte den Typ der Frage wählen.", status: "Bitte den Status wählen.", fragestellung: "Bitte die Frage an die Gruppe eingeben.", veranstaltung: "Bitte eine Veranstaltung wählen." },
  teilnehmende: { kuerzel: "Bitte ein Kürzel eingeben.", veranstaltung: "Bitte eine Veranstaltung wählen." },
  beitraege: { frage: "Bitte eine Frage wählen.", antwort: "Bitte deine Antwort eingeben." },
  auswertungen: { frage: "Bitte eine Frage wählen." },
  // </custom:messages>
};

/** The sentence shown when `key` of `entity` is required and empty — the
 *  agent's own text (translated at runtime like every page string), else the
 *  label sentence. Call it while rendering, not at module scope. */
export function requiredMessage(entity: EntityKey, key: string): string {
  const own = (REQUIRED_MESSAGES as Record<string, Record<string, string | undefined> | undefined>)[entity]?.[key];
  if (own && own.trim()) return tx(own);
  return t('v_required', { label: labelOf(entity, key) });
}

/** True when the agent wrote a sentence for the field. */
export function hasOwnMessage(entity: EntityKey, key: string): boolean {
  const own = (REQUIRED_MESSAGES as Record<string, Record<string, string | undefined> | undefined>)[entity]?.[key];
  return Boolean(own && own.trim());
}
