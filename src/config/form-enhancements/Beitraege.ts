// Auto-generated. Per-entity form-enhancements config for "Beiträge".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["frage", "teilnehmer", "antwort", {"row": ["wichtigkeit", "sichtbarkeit"], "cols": "1fr 1fr"}, "einsende_kennung", "anmerkung"],
  defaults: {
    'sichtbarkeit': { kind: 'lookup', key: 'neu', label: 'Neu' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
