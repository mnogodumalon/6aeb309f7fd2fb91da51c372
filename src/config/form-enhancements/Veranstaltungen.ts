// Auto-generated. Per-entity form-enhancements config for "Veranstaltungen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["titel", "datum", "beamer_modus", "beamer_auswertung", "beschreibung"],
  defaults: {
    'datum': { kind: 'today' },
    'beamer_modus': { kind: 'lookup', key: 'frage_beitraege', label: 'Frage mit QR-Code und freigegebenen Beiträgen' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
