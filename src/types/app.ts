import { lookupLabel } from '@/i18n';

// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
/** A raw record URL (applookup reference). NEVER render this directly
 *  in JSX — it is a URL, not a display value. Show the enriched `*Name`
 *  field or resolve it via the entity map instead. Assignable to/from
 *  string everywhere; the `& {}` keeps the alias NAME visible in tsc
 *  error messages (a plain primitive alias gets normalized away). */
export type RecordUrl = string & {};
export type GeoLocation = { lat: number; long: number; info?: string };

export type AttachmentType = 'file' | 'note' | 'url' | 'json';
export interface Attachment {
  id: string;
  type: AttachmentType;
  label: string | null;
  value: string | null;
  active: boolean;
  createdat?: string | null;
  updatedat?: string | null;
}

export interface AttachmentInput {
  type: AttachmentType;
  label?: string;
  value: string;
  active?: boolean;
}

export interface Veranstaltungen {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    beamer_auswertung?: RecordUrl; // applookup -> URL zu 'Auswertungen' Record
    titel?: string;
    datum?: string; // Format: YYYY-MM-DD oder ISO String
    beschreibung?: string;
    beamer_modus?: LookupValue;
  };
}

export interface FragenAnDieGruppe {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    typ?: LookupValue;
    laufende_nummer?: number;
    status?: LookupValue;
    bezeichnung?: string;
    fragestellung?: string;
    ki_einleitung?: string;
    ki_auftrag?: string;
    sofort_zeigen?: boolean;
    veranstaltung?: RecordUrl; // applookup -> URL zu 'Veranstaltungen' Record
    auswertung_quelle?: RecordUrl; // applookup -> URL zu 'Auswertungen' Record
  };
}

export interface Teilnehmende {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    kuerzel?: string;
    email?: string;
    einwilligung?: boolean;
    einwilligung_zeitpunkt?: string; // Format: YYYY-MM-DD oder ISO String
    veranstaltung?: RecordUrl; // applookup -> URL zu 'Veranstaltungen' Record
  };
}

export interface Beitraege {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    frage?: RecordUrl; // applookup -> URL zu 'FragenAnDieGruppe' Record
    teilnehmer?: RecordUrl; // applookup -> URL zu 'Teilnehmende' Record
    antwort?: string;
    anmerkung?: string;
    wichtigkeit?: LookupValue;
    einsende_kennung?: string;
    sichtbarkeit?: LookupValue;
  };
}

export interface Auswertungen {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    frage?: RecordUrl; // applookup -> URL zu 'FragenAnDieGruppe' Record
    fassung?: number;
    bezeichnung?: string;
    zusammenstellung?: string;
    verwendete_beitraege?: string;
    zeitstand?: string; // Format: YYYY-MM-DD oder ISO String
    ki_antwort?: string;
    abschnitt_1?: string;
    abschnitt_2?: string;
    abschnitt_3?: string;
    abschnitt_4?: string;
    abschnitt_5?: string;
    abschnitt_6?: string;
    notizen?: string;
    status?: LookupValue;
  };
}

export const APP_IDS = {
  VERANSTALTUNGEN: '6aeb307e4423a94faa51dfc8',
  FRAGEN_AN_DIE_GRUPPE: '6aeb30829beececa30d0d8b2',
  TEILNEHMENDE: '6aeb3083c32dea681e14788b',
  BEITRAEGE: '6aeb30842a48cc944c67e8a1',
  AUSWERTUNGEN: '6aeb3084509815871d12620e',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'veranstaltungen': {
    beamer_modus: [{ key: "frage_beitraege", get label() { return lookupLabel('veranstaltungen', 'beamer_modus', "frage_beitraege") ?? "Frage mit QR-Code und freigegebenen Beiträgen"; } }, { key: "zusammenstellung", get label() { return lookupLabel('veranstaltungen', 'beamer_modus', "zusammenstellung") ?? "Zusammenstellung"; } }, { key: "ki_ergebnis", get label() { return lookupLabel('veranstaltungen', 'beamer_modus', "ki_ergebnis") ?? "KI-Ergebnis"; } }],
  },
  'fragen_an_die_gruppe': {
    typ: [{ key: "ideen", get label() { return lookupLabel('fragen_an_die_gruppe', 'typ', "ideen") ?? "Ideen"; } }, { key: "fragen", get label() { return lookupLabel('fragen_an_die_gruppe', 'typ', "fragen") ?? "Fragen"; } }, { key: "stimmung", get label() { return lookupLabel('fragen_an_die_gruppe', 'typ', "stimmung") ?? "Stimmung"; } }, { key: "probleme", get label() { return lookupLabel('fragen_an_die_gruppe', 'typ', "probleme") ?? "Probleme"; } }, { key: "sonstiges", get label() { return lookupLabel('fragen_an_die_gruppe', 'typ', "sonstiges") ?? "Sonstiges"; } }],
    status: [{ key: "vorbereitet", get label() { return lookupLabel('fragen_an_die_gruppe', 'status', "vorbereitet") ?? "Vorbereitet"; } }, { key: "geoeffnet", get label() { return lookupLabel('fragen_an_die_gruppe', 'status', "geoeffnet") ?? "Geöffnet"; } }, { key: "geschlossen", get label() { return lookupLabel('fragen_an_die_gruppe', 'status', "geschlossen") ?? "Geschlossen"; } }],
  },
  'beitraege': {
    wichtigkeit: [{ key: "niedrig", get label() { return lookupLabel('beitraege', 'wichtigkeit', "niedrig") ?? "Niedrig"; } }, { key: "mittel", get label() { return lookupLabel('beitraege', 'wichtigkeit', "mittel") ?? "Mittel"; } }, { key: "hoch", get label() { return lookupLabel('beitraege', 'wichtigkeit', "hoch") ?? "Hoch"; } }],
    sichtbarkeit: [{ key: "neu", get label() { return lookupLabel('beitraege', 'sichtbarkeit', "neu") ?? "Neu"; } }, { key: "freigegeben", get label() { return lookupLabel('beitraege', 'sichtbarkeit', "freigegeben") ?? "Für Beamer freigegeben"; } }, { key: "ausgeblendet", get label() { return lookupLabel('beitraege', 'sichtbarkeit', "ausgeblendet") ?? "Ausgeblendet"; } }],
  },
  'auswertungen': {
    status: [{ key: "entwurf", get label() { return lookupLabel('auswertungen', 'status', "entwurf") ?? "Entwurf"; } }, { key: "an_ki_gegeben", get label() { return lookupLabel('auswertungen', 'status', "an_ki_gegeben") ?? "An KI gegeben"; } }, { key: "ergebnis_vorhanden", get label() { return lookupLabel('auswertungen', 'status', "ergebnis_vorhanden") ?? "Ergebnis vorhanden"; } }],
  },
};

// Optimistic LookupValue writes: never re-type a label — resolve the schema
// option instead (its label is a locale-aware getter; falls back to the key).
// WRONG: status: { key: 'offen', label: 'Offen' }   (frozen in one language)
// RIGHT: status: lookupOption('<appKey>', 'status', 'offen')
export function lookupOption(app: string, field: string, key: string): LookupValue {
  return LOOKUP_OPTIONS[app]?.[field]?.find(o => o.key === key) ?? { key, label: key };
}

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'veranstaltungen': {
    'beamer_auswertung': 'applookup/select',
    'titel': 'string/text',
    'datum': 'date/date',
    'beschreibung': 'string/textarea',
    'beamer_modus': 'lookup/radio',
  },
  'fragen_an_die_gruppe': {
    'typ': 'lookup/select',
    'laufende_nummer': 'number',
    'status': 'lookup/radio',
    'bezeichnung': 'string/text',
    'fragestellung': 'string/textarea',
    'ki_einleitung': 'string/textarea',
    'ki_auftrag': 'string/textarea',
    'sofort_zeigen': 'bool',
    'veranstaltung': 'applookup/select',
    'auswertung_quelle': 'applookup/select',
  },
  'teilnehmende': {
    'kuerzel': 'string/text',
    'email': 'string/email',
    'einwilligung': 'bool',
    'einwilligung_zeitpunkt': 'date/datetimeminute',
    'veranstaltung': 'applookup/select',
  },
  'beitraege': {
    'frage': 'applookup/select',
    'teilnehmer': 'applookup/select',
    'antwort': 'string/textarea',
    'anmerkung': 'string/textarea',
    'wichtigkeit': 'lookup/radio',
    'einsende_kennung': 'string/text',
    'sichtbarkeit': 'lookup/radio',
  },
  'auswertungen': {
    'frage': 'applookup/select',
    'fassung': 'number',
    'bezeichnung': 'string/text',
    'zusammenstellung': 'string/textarea',
    'verwendete_beitraege': 'string/textarea',
    'zeitstand': 'date/datetimeminute',
    'ki_antwort': 'string/textarea',
    'abschnitt_1': 'string/textarea',
    'abschnitt_2': 'string/textarea',
    'abschnitt_3': 'string/textarea',
    'abschnitt_4': 'string/textarea',
    'abschnitt_5': 'string/textarea',
    'abschnitt_6': 'string/textarea',
    'notizen': 'string/textarea',
    'status': 'lookup/radio',
  },
};

export const HUB_TOPOLOGY: Record<string, { field: string; entity: string }[]> = {
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateVeranstaltungen = StripLookup<Veranstaltungen['fields']>;
export type CreateFragenAnDieGruppe = StripLookup<FragenAnDieGruppe['fields']>;
export type CreateTeilnehmende = StripLookup<Teilnehmende['fields']>;
export type CreateBeitraege = StripLookup<Beitraege['fields']>;
export type CreateAuswertungen = StripLookup<Auswertungen['fields']>;