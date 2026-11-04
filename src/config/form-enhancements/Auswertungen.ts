// Auto-generated. Per-entity form-enhancements config for "Auswertungen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["frage", "bezeichnung", {"row": ["fassung", "status"], "cols": "1fr 2fr"}, "zeitstand", "zusammenstellung", "verwendete_beitraege", "ki_antwort", "abschnitt_1", "abschnitt_2", "abschnitt_3", "abschnitt_4", "abschnitt_5", "abschnitt_6", "notizen"],
  defaults: {
    'fassung': { kind: 'literal', value: 1 },
    'zeitstand': { kind: 'today', withTime: true },
    'status': { kind: 'lookup', key: 'entwurf', label: 'Entwurf' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
