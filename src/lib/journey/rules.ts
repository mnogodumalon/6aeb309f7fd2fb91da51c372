/**
 * Field rules — GENERATED from the app metadata. Do not edit.
 *
 * The mechanical truth about every field: what kind it is, whether the
 * platform's base view marks it required, which lookup keys exist, where an
 * applookup points, what the label is. `useStepForm` validates against these
 * rules and phrases its messages with the real labels; `toWirePayload` uses
 * them to shape the create payload; `SHAPES` tells a page which input FORM
 * fits the data (a date pair wants a calendar, not two fields) — it is a
 * signal, not a gate.
 */
import { appLabel, fieldLabel, lookupLabel } from '@/i18n';
import { policyLabel } from './policy';
import { LOOKUP_OPTIONS } from '@/types/app';

export type EntityKey = 'veranstaltungen' | 'fragen_an_die_gruppe' | 'teilnehmende' | 'beitraege' | 'auswertungen';

/** The text fields of each entity — what a search may run over (generated;
 *  `never` for an entity without text of its own, e.g. a link table). */
export interface StringFields {
  "veranstaltungen": "titel" | "beschreibung";
  "fragen_an_die_gruppe": "bezeichnung" | "fragestellung" | "ki_einleitung" | "ki_auftrag";
  "teilnehmende": "kuerzel" | "email";
  "beitraege": "antwort" | "anmerkung" | "einsende_kennung";
  "auswertungen": "bezeichnung" | "zusammenstellung" | "verwendete_beitraege" | "ki_antwort" | "abschnitt_1" | "abschnitt_2" | "abschnitt_3" | "abschnitt_4" | "abschnitt_5" | "abschnitt_6" | "notizen";
}
export type StringFieldKey<E extends EntityKey> = E extends keyof StringFields ? StringFields[E] : never;

/** The applookup fields of each entity (generated). A pick stored through
 *  `form.set` on one of these must carry its display name — at compile time
 *  (`StepForm.set`), because the review would otherwise show the id. */
export interface RecordFields {
  "veranstaltungen": "beamer_auswertung";
  "fragen_an_die_gruppe": "veranstaltung" | "auswertung_quelle";
  "teilnehmende": "veranstaltung";
  "beitraege": "frage" | "teilnehmer";
  "auswertungen": "frage";
}
export type RecordFieldKey<E extends EntityKey> = E extends keyof RecordFields ? RecordFields[E] : never;

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'url'
  | 'number'
  | 'bool'
  | 'date'
  | 'datetime'
  | 'lookup'
  | 'multilookup'
  | 'record'
  | 'multirecord'
  | 'file'
  | 'geo';

export interface FieldRule {
  key: string;
  fulltype: string;
  kind: FieldKind;
  /** From the app's base view. A public page may override this per field. */
  required: boolean;
  /** Build-time label — `labelOf()` prefers the runtime i18n bundle. */
  label: string;
  /** Whether a journey may write it as a value. `file` is false: a file is UPLOADED
   *  (`form.file(key)` → FileField; the chosen file travels in the create as a data URL). */
  writable: boolean;
  maxLength?: number;
  /** lookup / multilookup: the ONLY valid write values. */
  options?: string[];
  /** record / multirecord: the target app (always) and its entity key (when inside this appgroup). */
  targetAppId?: string;
  targetEntity?: EntityKey;
  format?: 'currency';
  /** HTML autocomplete token derived from the field name (given-name, email, tel, …). */
  autoComplete?: string;
}

export interface EntityInfo {
  key: EntityKey;
  appId: string;
  label: string;
  /** PascalCase plural — `get<pascal>()` on the service. */
  pascal: string;
  /** The single-record suffix — `create<single>()` on the service. */
  single: string;
}

/** Input-form signals per entity: which data shape each field (pair) has.
 *  `range`  — two date fields that form a stay/period → AvailabilityRangePicker
 *  `choice` — a lookup with few options → ChoiceGroup pills instead of a select
 *  `record` — an applookup → EntitySelectStep with search, never a raw id field
 *  `stock`  — a quantity that has a stock/capacity counterpart → show it, warn on overshoot */
export type Shape =
  | { kind: 'range'; from: string; to: string }
  | { kind: 'choice'; field: string; count: number }
  | { kind: 'record'; field: string; targetEntity?: EntityKey }
  | { kind: 'stock'; field: string };

export const ENTITIES: Record<EntityKey, EntityInfo> = {
  "veranstaltungen": {
    "key": "veranstaltungen",
    "appId": "6aeb307e4423a94faa51dfc8",
    "label": "Veranstaltungen",
    "pascal": "Veranstaltungen",
    "single": "VeranstaltungenEntry"
  },
  "fragen_an_die_gruppe": {
    "key": "fragen_an_die_gruppe",
    "appId": "6aeb30829beececa30d0d8b2",
    "label": "Fragen an die Gruppe",
    "pascal": "FragenAnDieGruppe",
    "single": "FragenAnDieGruppeEntry"
  },
  "teilnehmende": {
    "key": "teilnehmende",
    "appId": "6aeb3083c32dea681e14788b",
    "label": "Teilnehmende",
    "pascal": "Teilnehmende",
    "single": "TeilnehmendeEntry"
  },
  "beitraege": {
    "key": "beitraege",
    "appId": "6aeb30842a48cc944c67e8a1",
    "label": "Beiträge",
    "pascal": "Beitraege",
    "single": "BeitraegeEntry"
  },
  "auswertungen": {
    "key": "auswertungen",
    "appId": "6aeb3084509815871d12620e",
    "label": "Auswertungen",
    "pascal": "Auswertungen",
    "single": "AuswertungenEntry"
  }
};

export const FIELD_RULES: Record<EntityKey, Record<string, FieldRule>> = {
  "veranstaltungen": {
    "beamer_auswertung": {
      "key": "beamer_auswertung",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Auf dem Beamer gezeigte Auswertung",
      "writable": true,
      "targetAppId": "6aeb3084509815871d12620e",
      "targetEntity": "auswertungen"
    },
    "titel": {
      "key": "titel",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Titel der Veranstaltung",
      "writable": true,
      "maxLength": 4000
    },
    "datum": {
      "key": "datum",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Datum",
      "writable": true
    },
    "beschreibung": {
      "key": "beschreibung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Beschreibung",
      "writable": true
    },
    "beamer_modus": {
      "key": "beamer_modus",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": false,
      "label": "Auf Beamer zeigen",
      "writable": true,
      "options": [
        "frage_beitraege",
        "zusammenstellung",
        "ki_ergebnis"
      ]
    }
  },
  "fragen_an_die_gruppe": {
    "typ": {
      "key": "typ",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Typ",
      "writable": true,
      "options": [
        "ideen",
        "fragen",
        "stimmung",
        "probleme",
        "sonstiges"
      ]
    },
    "laufende_nummer": {
      "key": "laufende_nummer",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Laufende Nummer",
      "writable": true
    },
    "status": {
      "key": "status",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Status",
      "writable": true,
      "options": [
        "vorbereitet",
        "geoeffnet",
        "geschlossen"
      ]
    },
    "bezeichnung": {
      "key": "bezeichnung",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Bezeichnung (Typ und Nummer)",
      "writable": true,
      "maxLength": 4000
    },
    "fragestellung": {
      "key": "fragestellung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Fragestellung an die Gruppe",
      "writable": true
    },
    "ki_einleitung": {
      "key": "ki_einleitung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Einleitung an die KI",
      "writable": true
    },
    "ki_auftrag": {
      "key": "ki_auftrag",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Auftrag an die KI",
      "writable": true
    },
    "sofort_zeigen": {
      "key": "sofort_zeigen",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Beiträge sofort zeigen",
      "writable": true
    },
    "veranstaltung": {
      "key": "veranstaltung",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Veranstaltung",
      "writable": true,
      "targetAppId": "6aeb307e4423a94faa51dfc8",
      "targetEntity": "veranstaltungen"
    },
    "auswertung_quelle": {
      "key": "auswertung_quelle",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Entstanden aus Auswertung",
      "writable": true,
      "targetAppId": "6aeb3084509815871d12620e",
      "targetEntity": "auswertungen"
    }
  },
  "teilnehmende": {
    "kuerzel": {
      "key": "kuerzel",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Kürzel",
      "writable": true,
      "maxLength": 4000
    },
    "email": {
      "key": "email",
      "fulltype": "string/email",
      "kind": "email",
      "required": false,
      "label": "E-Mail-Adresse (freiwillig)",
      "writable": true,
      "autoComplete": "email"
    },
    "einwilligung": {
      "key": "einwilligung",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Ich willige ein, dass meine E-Mail-Adresse zu meinem Kürzel gespeichert wird",
      "writable": true
    },
    "einwilligung_zeitpunkt": {
      "key": "einwilligung_zeitpunkt",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": false,
      "label": "Zeitpunkt der Einwilligung",
      "writable": true
    },
    "veranstaltung": {
      "key": "veranstaltung",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Veranstaltung",
      "writable": true,
      "targetAppId": "6aeb307e4423a94faa51dfc8",
      "targetEntity": "veranstaltungen"
    }
  },
  "beitraege": {
    "frage": {
      "key": "frage",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Frage",
      "writable": true,
      "targetAppId": "6aeb30829beececa30d0d8b2",
      "targetEntity": "fragen_an_die_gruppe"
    },
    "teilnehmer": {
      "key": "teilnehmer",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Teilnehmer",
      "writable": true,
      "targetAppId": "6aeb3083c32dea681e14788b",
      "targetEntity": "teilnehmende"
    },
    "antwort": {
      "key": "antwort",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Deine Antwort",
      "writable": true
    },
    "anmerkung": {
      "key": "anmerkung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Anmerkung (freiwillig)",
      "writable": true
    },
    "wichtigkeit": {
      "key": "wichtigkeit",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": false,
      "label": "Wichtigkeit (freiwillig)",
      "writable": true,
      "options": [
        "niedrig",
        "mittel",
        "hoch"
      ]
    },
    "einsende_kennung": {
      "key": "einsende_kennung",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Einsende-Kennung",
      "writable": true,
      "maxLength": 4000
    },
    "sichtbarkeit": {
      "key": "sichtbarkeit",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": false,
      "label": "Sichtbarkeit",
      "writable": true,
      "options": [
        "neu",
        "freigegeben",
        "ausgeblendet"
      ]
    }
  },
  "auswertungen": {
    "frage": {
      "key": "frage",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Frage",
      "writable": true,
      "targetAppId": "6aeb30829beececa30d0d8b2",
      "targetEntity": "fragen_an_die_gruppe"
    },
    "fassung": {
      "key": "fassung",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Fassungsnummer",
      "writable": true
    },
    "bezeichnung": {
      "key": "bezeichnung",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Bezeichnung",
      "writable": true,
      "maxLength": 4000
    },
    "zusammenstellung": {
      "key": "zusammenstellung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Text für die KI (Einleitung, Auftrag, nummerierte Beiträge)",
      "writable": true
    },
    "verwendete_beitraege": {
      "key": "verwendete_beitraege",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Verwendete Beiträge",
      "writable": true
    },
    "zeitstand": {
      "key": "zeitstand",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": false,
      "label": "Zeitstand der Zusammenstellung",
      "writable": true
    },
    "ki_antwort": {
      "key": "ki_antwort",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Antwort der KI (Rohtext)",
      "writable": true
    },
    "abschnitt_1": {
      "key": "abschnitt_1",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Abschnitt 1",
      "writable": true
    },
    "abschnitt_2": {
      "key": "abschnitt_2",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Abschnitt 2",
      "writable": true
    },
    "abschnitt_3": {
      "key": "abschnitt_3",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Abschnitt 3",
      "writable": true
    },
    "abschnitt_4": {
      "key": "abschnitt_4",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Abschnitt 4",
      "writable": true
    },
    "abschnitt_5": {
      "key": "abschnitt_5",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Abschnitt 5 (optional)",
      "writable": true
    },
    "abschnitt_6": {
      "key": "abschnitt_6",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Abschnitt 6 (optional)",
      "writable": true
    },
    "notizen": {
      "key": "notizen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Notizen (nur intern)",
      "writable": true
    },
    "status": {
      "key": "status",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": false,
      "label": "Status",
      "writable": true,
      "options": [
        "entwurf",
        "an_ki_gegeben",
        "ergebnis_vorhanden"
      ]
    }
  }
};

export const SHAPES: Record<EntityKey, Shape[]> = {
  "veranstaltungen": [
    {
      "kind": "choice",
      "field": "beamer_modus",
      "count": 3
    },
    {
      "kind": "record",
      "field": "beamer_auswertung",
      "targetEntity": "auswertungen"
    }
  ],
  "fragen_an_die_gruppe": [
    {
      "kind": "choice",
      "field": "typ",
      "count": 5
    },
    {
      "kind": "choice",
      "field": "status",
      "count": 3
    },
    {
      "kind": "record",
      "field": "veranstaltung",
      "targetEntity": "veranstaltungen"
    },
    {
      "kind": "record",
      "field": "auswertung_quelle",
      "targetEntity": "auswertungen"
    }
  ],
  "teilnehmende": [
    {
      "kind": "record",
      "field": "veranstaltung",
      "targetEntity": "veranstaltungen"
    }
  ],
  "beitraege": [
    {
      "kind": "choice",
      "field": "wichtigkeit",
      "count": 3
    },
    {
      "kind": "choice",
      "field": "sichtbarkeit",
      "count": 3
    },
    {
      "kind": "record",
      "field": "frage",
      "targetEntity": "fragen_an_die_gruppe"
    },
    {
      "kind": "record",
      "field": "teilnehmer",
      "targetEntity": "teilnehmende"
    }
  ],
  "auswertungen": [
    {
      "kind": "choice",
      "field": "status",
      "count": 3
    },
    {
      "kind": "record",
      "field": "frage",
      "targetEntity": "fragen_an_die_gruppe"
    }
  ]
};

/** The fields a record of this entity is recognised by (a person: first and
 *  last name; else its title-like text field) — the same choice the dashboard's
 *  enrichment makes for `<key>Name`. `useRecordSearch` resolves an applookup to
 *  this name (`ctx.ref('gast')` in `toItem`). */
export const DISPLAY_FIELDS: Record<EntityKey, string[]> = {
  "veranstaltungen": [
    "titel"
  ],
  "fragen_an_die_gruppe": [
    "bezeichnung"
  ],
  "teilnehmende": [
    "kuerzel"
  ],
  "beitraege": [
    "antwort"
  ],
  "auswertungen": [
    "bezeichnung"
  ]
};

/** The display name of a record: its display fields joined, else the first
 *  non-empty text value, else ''. */
/** A display-field value as text: strings as they are, a lookup `{ key, label }`
 *  (either door hydrates lookups to objects) by its label — an entity whose
 *  only title-like field is a lookup/select otherwise had no name at all. */
function displayPart(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (v && typeof v === 'object' && 'label' in v) {
    const l = (v as { label?: unknown }).label;
    return l === null || l === undefined ? '' : String(l).trim();
  }
  return '';
}

export function displayNameOf(entity: EntityKey, fields: Record<string, unknown>): string {
  const parts = (DISPLAY_FIELDS[entity] ?? [])
    .map(k => displayPart(fields[k]))
    .filter(v => v !== '');
  if (parts.length > 0) return parts.join(' ');
  for (const [k, rule] of Object.entries(FIELD_RULES[entity] ?? {})) {
    if (rule.kind !== 'text' && rule.kind !== 'email') continue;
    const v = fields[k];
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
  }
  return '';
}

export function ruleOf(entity: EntityKey, key: string): FieldRule | undefined {
  return FIELD_RULES[entity]?.[key];
}

/** The field label as the user sees it — the owner's policy label first (a
 *  public page's "Felder anpassen"), runtime bundle second, generated label last. */
export function labelOf(entity: EntityKey, key: string): string {
  const own = policyLabel(entity, key);
  if (own) return own;
  const fromBundle = fieldLabel(entity, key);
  if (fromBundle !== key) return fromBundle;
  return ruleOf(entity, key)?.label ?? key;
}

export function entityLabel(entity: EntityKey): string {
  const fromBundle = appLabel(entity);
  if (fromBundle !== entity) return fromBundle;
  return ENTITIES[entity]?.label ?? entity;
}

/** Lookup options with runtime labels — the only legitimate source of `{key,label}` pairs. */
export function optionsOf(entity: EntityKey, key: string): Array<{ key: string; label: string }> {
  const generated = (LOOKUP_OPTIONS as Record<string, Record<string, Array<{ key: string; label: string }>>>)[entity]?.[key];
  if (generated && generated.length) return generated.map(o => ({ key: o.key, label: o.label }));
  const keys = ruleOf(entity, key)?.options ?? [];
  return keys.map(k => ({ key: k, label: lookupLabel(entity, key, k) ?? k }));
}

/** „Nicht ausgefüllt“ for a required field, by its kind: a checkbox that is
 *  `false` is NOT filled — the person did not consent (live 03.11.2026: a
 *  consent page validated with the box unticked and the grant took it). Every
 *  other kind is isEmptyValue. */
export function isUnfilled(entity: EntityKey, key: string, v: unknown): boolean {
  if (ruleOf(entity, key)?.kind === 'bool') return v !== true;
  return isEmptyValue(v);
}

export function isEmptyValue(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object' && 'from' in (v as object) && 'to' in (v as object)) {
    const r = v as { from: unknown; to: unknown };
    return isEmptyValue(r.from) && isEmptyValue(r.to);
  }
  return false;
}
