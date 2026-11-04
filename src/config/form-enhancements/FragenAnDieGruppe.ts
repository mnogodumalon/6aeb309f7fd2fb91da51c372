// Auto-generated. Per-entity form-enhancements config for "Fragen an die Gruppe".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["bezeichnung", {"row": ["typ", "laufende_nummer"], "cols": "2fr 1fr"}, "veranstaltung", "status", "fragestellung", "sofort_zeigen", "auswertung_quelle", "ki_einleitung", "ki_auftrag"],
  defaults: {
    'status': { kind: 'lookup', key: 'vorbereitet', label: 'Vorbereitet' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
