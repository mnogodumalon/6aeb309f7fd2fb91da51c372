import type { Auswertungen, Beitraege, FragenAnDieGruppe, Teilnehmende, Veranstaltungen } from './app';

export type EnrichedVeranstaltungen = Veranstaltungen & {
  beamer_auswertungName: string;
};

export type EnrichedFragenAnDieGruppe = FragenAnDieGruppe & {
  veranstaltungName: string;
  auswertung_quelleName: string;
};

export type EnrichedTeilnehmende = Teilnehmende & {
  veranstaltungName: string;
};

export type EnrichedBeitraege = Beitraege & {
  frageName: string;
  teilnehmerName: string;
};

export type EnrichedAuswertungen = Auswertungen & {
  frageName: string;
};
