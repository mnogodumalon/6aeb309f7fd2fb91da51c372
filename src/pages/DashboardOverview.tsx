import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import type { DashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import { lookupOption } from '@/types/app';
import type { FragenAnDieGruppe, Auswertungen } from '@/types/app';
import type { EnrichedFragenAnDieGruppe, EnrichedBeitraege } from '@/types/enriched';
import { LOOKUP_OPTIONS, APP_IDS } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { lookupKey } from '@/lib/formatters';
import { useClock, gruss, namen, undoToast } from '@/lib/polish';
import { tx, appLabel } from '@/i18n';
import { DashboardGrid } from '@/components/DashboardGrid';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { WorkList } from '@/components/WorkList';
import { HeroBanner } from '@/components/HeroBanner';
import { KanbanWidget } from '@/components/widgets/KanbanWidget';
import type { KanbanCard } from '@/components/widgets/KanbanWidget';
import { Button } from '@/components/ui/button';
import { IconPlus, IconSparkles, IconDeviceDesktop, IconInbox, IconCheck, IconPlayerPlay, IconPlayerStop, IconBolt } from '@tabler/icons-react';

// Hub: Veranstaltung → Fragen → Beiträge/Auswertungen. Primary surface = moderation board
// (KanbanWidget, Beiträge by Sichtbarkeit) of the selected question; variant "wide" gives all
// three columns room; mobile: board pages column by column, work lists come first.
export default function DashboardOverview({ data }: { data: DashboardData }) {
  const {
    veranstaltungen, fragenAnDieGruppe, teilnehmende, beitraege, auswertungen,
    setVeranstaltungen, setFragenAnDieGruppe, setBeitraege, fetchAll,
  } = data;
  const clock = useClock();
  const [selId, setSelId] = useState<string | null>(null);

  const frageLabel = (f: FragenAnDieGruppe | EnrichedFragenAnDieGruppe) =>
    f.fields.bezeichnung ?? `${f.fields.typ?.label ?? ''} ${f.fields.laufende_nummer ?? ''}`.trim();
  const eventOf = (f: FragenAnDieGruppe) => extractRecordId(f.fields.veranstaltung);

  // ---- shared write helpers -------------------------------------------------
  const setSichtbarkeit = async (b: EnrichedBeitraege, key: string): Promise<string | void> => {
    const prev = b.fields.sichtbarkeit;
    const next = lookupOption('beitraege', 'sichtbarkeit', key);
    const apply = (v: typeof prev) =>
      setBeitraege(list => list.map(x => x.record_id === b.record_id ? { ...x, fields: { ...x.fields, sichtbarkeit: v } } : x));
    apply(next);
    try {
      await LivingAppsService.updateBeitraegeEntry(b.record_id, { sichtbarkeit: key });
      undoToast(tx`Beitrag: ${next.label}`, () => {
        apply(prev);
        LivingAppsService.updateBeitraegeEntry(b.record_id, { sichtbarkeit: prev?.key ?? 'neu' }).catch(fetchAll);
      });
    } catch { fetchAll(); }
  };

  const advanceFrage = async (f: FragenAnDieGruppe): Promise<string | void> => {
    const cur = lookupKey(f.fields.status);
    const key = cur === 'vorbereitet' ? 'geoeffnet' : cur === 'geoeffnet' ? 'geschlossen' : null;
    if (!key) return;
    if (key === 'geoeffnet') {
      const other = fragenAnDieGruppe.find(o => o.record_id !== f.record_id
        && lookupKey(o.fields.status) === 'geoeffnet' && eventOf(o) === eventOf(f));
      if (other) return tx`Es ist schon „${frageLabel(other)}“ geöffnet — bitte erst schließen.`;
    }
    const prev = f.fields.status;
    const next = lookupOption('fragen_an_die_gruppe', 'status', key);
    const apply = (v: typeof prev) =>
      setFragenAnDieGruppe(list => list.map(x => x.record_id === f.record_id ? { ...x, fields: { ...x.fields, status: v } } : x));
    apply(next);
    try {
      await LivingAppsService.updateFragenAnDieGruppeEntry(f.record_id, { status: key });
      undoToast(tx`${frageLabel(f)}: ${next.label}`, () => {
        apply(prev);
        LivingAppsService.updateFragenAnDieGruppeEntry(f.record_id, { status: prev?.key ?? 'vorbereitet' }).catch(fetchAll);
      });
    } catch { fetchAll(); }
  };

  const advanceAuswertung = async (a: Auswertungen) => {
    const cur = lookupKey(a.fields.status) ?? 'entwurf';
    const key = cur === 'entwurf' ? 'an_ki_gegeben' : cur === 'an_ki_gegeben' ? 'ergebnis_vorhanden' : null;
    if (!key) return;
    try {
      await LivingAppsService.updateAuswertungenEntry(a.record_id, { status: key });
      undoToast(tx`Auswertung ${a.fields.bezeichnung ?? ''} weitergesetzt`, () => {
        LivingAppsService.updateAuswertungenEntry(a.record_id, { status: cur }).then(fetchAll).catch(fetchAll);
      });
      fetchAll();
    } catch { fetchAll(); }
  };

  // ---- derived --------------------------------------------------------------
  const frageList = crudFragen();
  function crudFragen() { return [...fragenAnDieGruppe].sort((a, b) => (b.createdat ?? '').localeCompare(a.createdat ?? '')); }
  const openFragen = fragenAnDieGruppe.filter(f => lookupKey(f.fields.status) === 'geoeffnet');
  const selected = fragenAnDieGruppe.find(f => f.record_id === selId) ?? openFragen[0] ?? frageList[0];
  const crud = useEntityCrud(data, {
    footer: (top) => {
      if (top.type === 'fragenAnDieGruppe') {
        const k = lookupKey(top.record.fields.status);
        if (k === 'vorbereitet') return { label: tx('Frage öffnen'), onClick: () => advanceFrage(top.record) };
        if (k === 'geoeffnet') return { label: tx('Frage schließen'), onClick: () => advanceFrage(top.record) };
      }
      if (top.type === 'beitraege') {
        const k = lookupKey(top.record.fields.sichtbarkeit);
        if (k !== 'freigegeben') return { label: tx('Für Beamer freigeben'), onClick: () => setSichtbarkeit(top.record, 'freigegeben') };
      }
      if (top.type === 'auswertungen') {
        const k = lookupKey(top.record.fields.status) ?? 'entwurf';
        if (k === 'entwurf') return { label: tx('Als an KI gegeben markieren'), onClick: () => advanceAuswertung(top.record) };
        if (k === 'an_ki_gegeben') return { label: tx('Ergebnis liegt vor'), onClick: () => advanceAuswertung(top.record) };
      }
      return undefined;
    },
  });
  const enrichedBeitraege = crud.enriched.beitraege;

  const selBeitraege = useMemo(
    () => selected ? enrichedBeitraege.filter(b => extractRecordId(b.fields.frage) === selected.record_id) : [],
    [enrichedBeitraege, selected],
  );
  const neue = selBeitraege.filter(b => (lookupKey(b.fields.sichtbarkeit) ?? 'neu') === 'neu');
  const selIsOpen = !!selected && lookupKey(selected.fields.status) === 'geoeffnet';
  const selEvent = selected ? veranstaltungen.find(v => v.record_id === eventOf(selected)) : undefined;

  const approveAll = async () => {
    const list = neue;
    list.forEach(b => setBeitraege(l => l.map(x => x.record_id === b.record_id ? { ...x, fields: { ...x.fields, sichtbarkeit: lookupOption('beitraege', 'sichtbarkeit', 'freigegeben') } } : x)));
    try {
      await Promise.all(list.map(b => LivingAppsService.updateBeitraegeEntry(b.record_id, { sichtbarkeit: 'freigegeben' })));
      undoToast(tx`${list.length} Beiträge für den Beamer freigegeben`, () => {
        Promise.all(list.map(b => LivingAppsService.updateBeitraegeEntry(b.record_id, { sichtbarkeit: 'neu' }))).then(fetchAll).catch(fetchAll);
      });
    } catch { fetchAll(); }
  };

  const toggleSofort = async () => {
    if (!selected) return;
    const nextVal = !selected.fields.sofort_zeigen;
    setFragenAnDieGruppe(l => l.map(x => x.record_id === selected.record_id ? { ...x, fields: { ...x.fields, sofort_zeigen: nextVal } } : x));
    try {
      await LivingAppsService.updateFragenAnDieGruppeEntry(selected.record_id, { sofort_zeigen: nextVal });
      undoToast(nextVal ? tx('Beiträge werden sofort gezeigt') : tx('Beiträge werden erst nach Freigabe gezeigt'), () => {
        setFragenAnDieGruppe(l => l.map(x => x.record_id === selected.record_id ? { ...x, fields: { ...x.fields, sofort_zeigen: !nextVal } } : x));
        LivingAppsService.updateFragenAnDieGruppeEntry(selected.record_id, { sofort_zeigen: !nextVal }).catch(fetchAll);
      });
    } catch { fetchAll(); }
  };

  const setBeamer = async (key: string) => {
    if (!selEvent) return;
    const prev = selEvent.fields.beamer_modus;
    const apply = (v: typeof prev) =>
      setVeranstaltungen(l => l.map(x => x.record_id === selEvent.record_id ? { ...x, fields: { ...x.fields, beamer_modus: v } } : x));
    apply(lookupOption('veranstaltungen', 'beamer_modus', key));
    try {
      await LivingAppsService.updateVeranstaltungenEntry(selEvent.record_id, { beamer_modus: key });
      undoToast(tx`Beamer zeigt jetzt: ${lookupOption('veranstaltungen', 'beamer_modus', key).label}`, () => {
        apply(prev);
        if (prev) LivingAppsService.updateVeranstaltungenEntry(selEvent.record_id, { beamer_modus: prev.key }).catch(fetchAll);
      });
    } catch { fetchAll(); }
  };

  // Auswertung: Einleitung + Auftrag + nummerierte, nicht ausgeblendete Beiträge; new Fassung each time.
  const createAuswertung = async () => {
    if (!selected) return;
    const used = selBeitraege
      .filter(b => lookupKey(b.fields.sichtbarkeit) !== 'ausgeblendet')
      .sort((a, b) => (a.createdat ?? '').localeCompare(b.createdat ?? ''));
    const fassung = 1 + auswertungen
      .filter(a => extractRecordId(a.fields.frage) === selected.record_id)
      .reduce((m, a) => Math.max(m, a.fields.fassung ?? 0), 0);
    const stand = format(clock, "yyyy-MM-dd'T'HH:mm");
    const nummeriert = used.map((b, i) => `${i + 1}. ${b.fields.antwort ?? ''}`).join('\n');
    const text = [selected.fields.ki_einleitung, selected.fields.ki_auftrag, nummeriert].filter(Boolean).join('\n\n');
    const verwendet = used.map((b, i) => `${i + 1}: ${b.record_id}`).join('\n');
    try {
      const res = await LivingAppsService.createAuswertungenEntry({
        frage: createRecordUrl(APP_IDS.FRAGEN_AN_DIE_GRUPPE, selected.record_id),
        fassung,
        bezeichnung: tx`${frageLabel(selected)} – Fassung ${fassung}`,
        zusammenstellung: text,
        verwendete_beitraege: verwendet,
        zeitstand: stand,
        status: 'entwurf',
      });
      await fetchAll();
      undoToast(tx`Auswertung „Fassung ${fassung}“ mit ${used.length} Beiträgen erstellt`, () => {
        LivingAppsService.deleteAuswertungenEntry(res.record_id).then(fetchAll).catch(fetchAll);
      });
    } catch { fetchAll(); }
  };

  // ---- kanban ---------------------------------------------------------------
  const columns = (LOOKUP_OPTIONS['beitraege']?.['sichtbarkeit'] ?? []).map(o => ({
    key: o.key, label: o.label,
    tone: o.key === 'freigegeben' ? ('success' as const) : o.key === 'ausgeblendet' ? ('default' as const) : ('primary' as const),
  }));
  const cards: KanbanCard[] = [...selBeitraege]
    .sort((a, b) => (b.createdat ?? '').localeCompare(a.createdat ?? ''))
    .map(b => ({
      id: b.record_id,
      column: lookupKey(b.fields.sichtbarkeit) ?? 'neu',
      title: <span className="line-clamp-3">{b.fields.antwort}</span>,
      subtitle: b.fields.wichtigkeit?.label
        ? tx`Wichtigkeit: ${b.fields.wichtigkeit.label}`
        : undefined,
      tone: lookupKey(b.fields.wichtigkeit) === 'hoch' ? 'warning' : 'default',
    }));

  const onCardMove = (id: string, col: string) => {
    const b = selBeitraege.find(x => x.record_id === id);
    if (!b) return;
    return setSichtbarkeit(b, col);
  };

  // ---- header context -------------------------------------------------------
  const vorbereitete = fragenAnDieGruppe.filter(f => lookupKey(f.fields.status) === 'vorbereitet');
  let context: string;
  if (fragenAnDieGruppe.length === 0) {
    context = tx('Lege deine erste Frage an die Gruppe an.');
  } else if (openFragen.length > 0) {
    const o = openFragen[0];
    const n = enrichedBeitraege.filter(b => extractRecordId(b.fields.frage) === o.record_id);
    context = tx`„${frageLabel(o)}“ ist offen — ${n.length} Beiträge sind schon da.`;
  } else if (vorbereitete.length > 0) {
    context = tx`Keine Frage offen — ${namen(vorbereitete.map(frageLabel), 3)} wartet auf dich.`;
  } else {
    context = tx('Alle Fragen sind geschlossen — Zeit für die Auswertung.');
  }

  const openAuswertungen = auswertungen.filter(a => (lookupKey(a.fields.status) ?? 'entwurf') !== 'ergebnis_vorhanden');
  const mitEmail = teilnehmende.filter(t => t.fields.einwilligung && t.fields.email).length;
  const beamerModi = LOOKUP_OPTIONS['veranstaltungen']?.['beamer_modus'] ?? [];

  const frageAction = (f: FragenAnDieGruppe) => {
    const k = lookupKey(f.fields.status);
    if (k === 'vorbereitet') return { label: tx('Öffnen'), onClick: () => { const r = advanceFrage(f); return r; } };
    if (k === 'geoeffnet') return { label: tx('Schließen'), onClick: () => { const r = advanceFrage(f); return r; } };
    return undefined;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{gruss(clock)}</h1>
          <p className="text-sm text-muted-foreground">{context}</p>
        </div>
        {crud.fragenAnDieGruppe.canWrite && (
          <Button onClick={() => crud.fragenAnDieGruppe.openCreate({ status: 'vorbereitet', ...(selEvent ? { veranstaltung: selEvent.record_id } : {}) })}>
            <IconPlus size={16} className="shrink-0" /> {tx('Neue Frage')}
          </Button>
        )}
      </div>

      <DashboardGrid
        variant="wide"
        hero={
          fragenAnDieGruppe.length === 0 ? (
            <HeroBanner
              icon={<IconInbox size={18} />}
              action={{ label: tx('Erste Frage anlegen'), onClick: () => crud.fragenAnDieGruppe.openCreate({ status: 'vorbereitet' }) }}
            >
              {tx('Noch keine Frage — lege eine an, die Gruppe antwortet per Handy.')}
            </HeroBanner>
          ) : selIsOpen && neue.length > 0 ? (
            <HeroBanner
              icon={<IconBolt size={18} />}
              action={{ label: tx('Alle freigeben'), onClick: approveAll }}
            >
              {neue.length === 1
                ? tx`Ein neuer Beitrag zu „${frageLabel(selected!)}“ wartet auf Freigabe.`
                : tx`${neue.length} neue Beiträge zu „${frageLabel(selected!)}“ warten auf Freigabe.`}
            </HeroBanner>
          ) : undefined
        }
        kpis={
          <StatStrip>
            <StatStripItem
              title={tx('Auswertungen ohne Ergebnis')}
              value={openAuswertungen.length}
              icon={<IconSparkles size={18} className="text-muted-foreground" />}
            />
            <StatStripItem
              title={tx('Einwilligungen mit E-Mail')}
              value={mitEmail}
              icon={<IconCheck size={18} className="text-muted-foreground" />}
            />
          </StatStrip>
        }
        primary={
          <KanbanWidget
            cards={cards}
            columns={columns}
            onCardClick={c => {
              const b = selBeitraege.find(x => x.record_id === c.id);
              if (b) crud.beitraege.openDetail(b);
            }}
            onCardMove={onCardMove}
            onAddCard={crud.beitraege.canWrite && selected
              ? col => crud.beitraege.openCreate({ sichtbarkeit: col, frage: selected.record_id })
              : undefined}
          >
            <div className="flex flex-col gap-3 p-3 border-b">
              <div className="flex flex-wrap gap-2">
                {frageList.map(f => (
                  <Button
                    key={f.record_id}
                    size="sm"
                    variant={selected?.record_id === f.record_id ? 'default' : 'outline'}
                    onClick={() => setSelId(f.record_id)}
                    className="max-w-full"
                  >
                    <span className="truncate">{frageLabel(f)}</span>
                    {lookupKey(f.fields.status) === 'geoeffnet' && <span className="ml-1 size-2 rounded-full bg-emerald-500 shrink-0" />}
                  </Button>
                ))}
              </div>
              {selected && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground min-w-0 truncate">{selected.fields.fragestellung}</span>
                </div>
              )}
              {selected && (
                <div className="flex flex-wrap items-center gap-2">
                  {frageAction(selected) && (
                    <Button size="sm" onClick={() => frageAction(selected)!.onClick()}>
                      {selIsOpen ? <IconPlayerStop size={16} className="shrink-0" /> : <IconPlayerPlay size={16} className="shrink-0" />}
                      {selIsOpen ? tx('Frage schließen') : tx('Frage öffnen')}
                    </Button>
                  )}
                  <Button size="sm" variant={selected.fields.sofort_zeigen ? 'default' : 'outline'} onClick={toggleSofort}>
                    {tx('Beiträge sofort zeigen')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={createAuswertung}>
                    <IconSparkles size={16} className="shrink-0" /> {tx('Auswertung erstellen')}
                  </Button>
                </div>
              )}
              {selEvent && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <IconDeviceDesktop size={16} className="shrink-0" /> {tx('Auf Beamer zeigen')}
                  </span>
                  {beamerModi.map(o => (
                    <Button
                      key={o.key}
                      size="sm"
                      variant={lookupKey(selEvent.fields.beamer_modus) === o.key ? 'default' : 'outline'}
                      onClick={() => setBeamer(o.key)}
                      className="max-w-full"
                    >
                      <span className="truncate">{o.label}</span>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </KanbanWidget>
        }
        aside={
          <>
            <WorkList
              title={appLabel('fragen_an_die_gruppe')}
              items={frageList.filter(f => lookupKey(f.fields.status) !== 'geschlossen').map(f => ({
                id: f.record_id,
                title: frageLabel(f),
                secondLine: (
                  <>
                    <span className={lookupKey(f.fields.status) === 'geoeffnet' ? 'font-medium text-emerald-600' : 'font-medium text-muted-foreground'}>
                      {f.fields.status?.label}
                    </span>
                    <span className="text-muted-foreground"> · {f.fields.fragestellung}</span>
                  </>
                ),
                action: frageAction(f),
              }))}
              onItemClick={id => { const f = fragenAnDieGruppe.find(x => x.record_id === id); if (f) crud.fragenAnDieGruppe.openDetail(f); }}
              empty={{ text: tx('Alle Fragen sind geschlossen.'), action: crud.fragenAnDieGruppe.canWrite ? { label: tx('Neue Frage'), onClick: () => crud.fragenAnDieGruppe.openCreate({ status: 'vorbereitet' }) } : undefined }}
            />
            <WorkList
              title={tx('Auswertungen in Arbeit')}
              items={openAuswertungen.map(a => {
                const k = lookupKey(a.fields.status) ?? 'entwurf';
                return {
                  id: a.record_id,
                  title: a.fields.bezeichnung ?? tx('Auswertung'),
                  secondLine: <span className="font-medium text-muted-foreground">{a.fields.status?.label ?? tx('Entwurf')}</span>,
                  action: { label: k === 'entwurf' ? tx('An KI gegeben') : tx('Ergebnis da'), onClick: () => advanceAuswertung(a) },
                };
              })}
              onItemClick={id => { const a = auswertungen.find(x => x.record_id === id); if (a) crud.auswertungen.openDetail(a); }}
              empty={{ text: tx('Keine offene Auswertung — erstelle eine aus einer Frage.') }}
            />
          </>
        }
      />
      {crud.surfaces}
    </div>
  );
}
