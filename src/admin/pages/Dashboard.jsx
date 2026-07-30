import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { supabase } from '../../lib/supabase'
import Icon from '../../components/Icon'
import AdminLayout, { PageTitle } from '../components/AdminLayout'
import { toast } from '../components/Toast'
import { EmptyState, Kpi, Loading, Panel, PanelTitle } from '../components/ui'
import { ACCENT, MESI, OGGI, monthLabel, saluto, tabellaMancante } from '../theme'

const ORO = ACCENT.dashboard

/* ------------------------------------------------------------------ */
/* Utilità                                                             */
/* ------------------------------------------------------------------ */

const giornoMese = (iso) => {
  if (!iso) return null
  const [, m, g] = String(iso).slice(0, 10).split('-')
  return { mese: Number(m), giorno: Number(g) }
}

const iniziali = (nome = '') =>
  nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase() || '··'

/* ------------------------------------------------------------------ */
/* Pagina                                                              */
/* ------------------------------------------------------------------ */

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [membri, setMembri] = useState([])
  const [dipartimenti, setDipartimenti] = useState([])
  const [eventi, setEventi] = useState([])
  const [chiese, setChiese] = useState([])
  const [promemoria, setPromemoria] = useState([])
  const [nuovoPromemoria, setNuovoPromemoria] = useState('')
  const [tabelleMancanti, setTabelleMancanti] = useState([])

  useEffect(() => {
    let annullato = false

    async function carica() {
      const mancanti = []

      const leggi = async (tabella, query) => {
        const { data, error } = await query
        if (error) {
          if (tabellaMancante(error)) mancanti.push(tabella)
          return []
        }
        return data || []
      }

      const oggiISO = OGGI.toISOString().slice(0, 10)

      const [m, d, e, c, p] = await Promise.all([
        leggi('membri', supabase.from('membri').select('*').eq('attivo', true)),
        leggi('dipartimenti', supabase.from('dipartimenti').select('*').order('nome')),
        leggi(
          'eventos',
          supabase
            .from('eventos')
            .select('*')
            .gte('data_evento', oggiISO)
            .order('data_evento', { ascending: true })
            .limit(4)
        ),
        leggi('igrejas', supabase.from('igrejas').select('id, slug, cidade, nome').order('cidade')),
        leggi('promemoria', supabase.from('promemoria').select('*').order('created_at', { ascending: false })),
      ])

      if (annullato) return

      setMembri(m)
      setDipartimenti(d)
      setEventi(e)
      setChiese(c)
      setPromemoria(p)
      setTabelleMancanti(mancanti)
      setLoading(false)
    }

    carica()
    return () => {
      annullato = true
    }
  }, [])

  /* --- Compleanni del mese, da oggi in avanti --- */
  const compleanni = useMemo(() => {
    const meseCorrente = OGGI.getMonth() + 1
    const giornoOggi = OGGI.getDate()
    return membri
      .filter((m) => {
        const d = giornoMese(m.data_nascita)
        return d && d.mese === meseCorrente && d.giorno >= giornoOggi
      })
      .sort((a, b) => giornoMese(a.data_nascita).giorno - giornoMese(b.data_nascita).giorno)
      .slice(0, 6)
  }, [membri])

  /* --- Demografia --- */
  const demografia = useMemo(() => {
    const bambini = membri.filter((m) => m.fascia_eta === 'Bambino')
    const uomini = membri.filter((m) => m.sesso === 'M' && m.fascia_eta !== 'Bambino')
    const donne = membri.filter((m) => m.sesso === 'F' && m.fascia_eta !== 'Bambino')
    return { uomini: uomini.length, donne: donne.length, bambini: bambini.length, totale: membri.length }
  }, [membri])

  /* --- Crescita: membri cumulati per mese, ultimi 12 --- */
  const crescita = useMemo(() => {
    const serie = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(OGGI.getFullYear(), OGGI.getMonth() - i, 1)
      const fineMese = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
      const totale = membri.filter((m) => m.created_at && new Date(m.created_at) <= fineMese).length
      serie.push({
        mese: monthLabel(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`),
        membri: totale,
      })
    }
    return serie
  }, [membri])

  /* --- Dipartimenti con conteggio membri --- */
  const dipartimentiConta = useMemo(
    () =>
      dipartimenti.map((d) => ({
        ...d,
        membri: membri.filter((m) => m.dipartimento_id === d.id).length,
      })),
    [dipartimenti, membri]
  )

  /* --- Promemoria --- */
  const aggiungiPromemoria = async (e) => {
    e.preventDefault()
    const testo = nuovoPromemoria.trim()
    if (!testo) return

    const { data, error } = await supabase.from('promemoria').insert([{ testo }]).select().single()
    if (error) {
      toast.error(`Errore: ${error.message}`)
      return
    }
    setPromemoria((p) => [data, ...p])
    setNuovoPromemoria('')
  }

  const alternaPromemoria = async (p) => {
    const { error } = await supabase.from('promemoria').update({ fatto: !p.fatto }).eq('id', p.id)
    if (error) return toast.error(`Errore: ${error.message}`)
    setPromemoria((prev) => prev.map((x) => (x.id === p.id ? { ...x, fatto: !x.fatto } : x)))
  }

  const eliminaPromemoria = async (p) => {
    const { error } = await supabase.from('promemoria').delete().eq('id', p.id)
    if (error) return toast.error(`Errore: ${error.message}`)
    setPromemoria((prev) => prev.filter((x) => x.id !== p.id))
  }

  const dataOggi = OGGI.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  if (loading) {
    return (
      <AdminLayout modulo="Home" titolo="Home" icona="space_dashboard" accent={ORO}>
        <Loading testo="Caricamento della panoramica…" accent={ORO} />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout titolo="Home" icona="space_dashboard" accent={ORO}>
      <div className="mx-auto max-w-[1600px]">
        {/* --- Saluto --- */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-hairline bg-ink-950 shadow-sm">
          <div className="relative px-6 py-8 lg:px-10 lg:py-10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-24 h-64 w-80 rounded-full bg-gold-400/15 blur-[90px]"
            />
            <div className="relative">
              <p className="text-[11px] font-bold uppercase tracking-widest2 text-gold-400">{dataOggi}</p>
              <h2 className="font-display-lg mt-3 text-[26px] font-light text-cream-50 lg:text-[34px]">
                {saluto()}, Pastore.
              </h2>
              <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-cream-100/60">
                Ecco la fotografia di oggi delle comunità L'Oasi di Latina, Terracina e Gaeta.
              </p>
            </div>
          </div>
        </div>

        <PageTitle titolo="Panoramica" sottotitolo="Membri, dipartimenti, eventi e attività della settimana." />

        {tabelleMancanti.length > 0 && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-50 p-4">
            <Icon name="database" className="mt-0.5 shrink-0 text-[20px] text-amber-600" />
            <div className="text-[13px] leading-relaxed text-amber-900">
              <strong className="font-bold">Configurazione incompleta.</strong> Mancano le tabelle{' '}
              {tabelleMancanti.map((t, i) => (
                <span key={t}>
                  <code className="rounded bg-amber-500/15 px-1.5 py-0.5 font-mono text-[12px]">{t}</code>
                  {i < tabelleMancanti.length - 1 ? ', ' : ''}
                </span>
              ))}
              . Esegui <strong>supabase_gestionale.sql</strong> nel SQL Editor di Supabase.
            </div>
          </div>
        )}

        {/* --- KPI --- */}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <Kpi icona="groups" tint={ORO} valore={demografia.totale} etichetta="Membri attivi" nota={`${chiese.length} comunità`} />
          <Kpi icona="diversity_3" tint="#7C3AED" valore={dipartimenti.length} etichetta="Dipartimenti" />
          <Kpi icona="event" tint="#0891B2" valore={eventi.length} etichetta="Eventi in programma" />
          <Kpi icona="cake" tint="#EC4899" valore={compleanni.length} etichetta="Compleanni nel mese" nota={MESI[OGGI.getMonth()]} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
          {/* --- Crescita --- */}
          <Panel className="lg:col-span-2">
            <PanelTitle titolo="Crescita della comunità" nota="Membri registrati · ultimi 12 mesi" />
            {demografia.totale === 0 ? (
              <EmptyState
                icona="show_chart"
                titolo="Ancora nessun membro registrato"
                testo="Quando registrerai i primi membri, qui vedrai l'andamento della comunità."
              />
            ) : (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={crescita} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaCrescita" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={ORO} stopOpacity={0.32} />
                        <stop offset="100%" stopColor={ORO} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" vertical={false} />
                    <XAxis
                      dataKey="mese"
                      tick={{ fontSize: 11, fontWeight: 600, fill: 'var(--color-ink-muted-48)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fontWeight: 600, fill: 'var(--color-ink-muted-48)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid var(--color-hairline)',
                        background: 'var(--color-surface-pearl)',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                      labelStyle={{ color: 'var(--color-ink-muted-48)' }}
                      formatter={(v) => [v, 'Membri']}
                    />
                    <Area type="monotone" dataKey="membri" stroke={ORO} strokeWidth={2.5} fill="url(#areaCrescita)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>

          {/* --- Demografia --- */}
          <Panel>
            <PanelTitle titolo="Composizione" nota="Membri attivi per fascia" />
            {demografia.totale === 0 ? (
              <EmptyState icona="pie_chart" titolo="Nessun dato" />
            ) : (
              <div className="flex flex-col gap-4 pt-2">
                {[
                  { label: 'Uomini', valore: demografia.uomini, colore: '#2563EB', icona: 'man' },
                  { label: 'Donne', valore: demografia.donne, colore: '#EC4899', icona: 'woman' },
                  { label: 'Bambini', valore: demografia.bambini, colore: '#F59E0B', icona: 'child_care' },
                ].map((r) => {
                  const pct = demografia.totale ? (r.valore / demografia.totale) * 100 : 0
                  return (
                    <div key={r.label}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                          <Icon name={r.icona} className="text-[17px]" style={{ color: r.colore }} />
                          {r.label}
                        </span>
                        <span className="text-[13px] font-bold text-ink">{r.valore}</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-canvas-parchment">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: r.colore }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Panel>

          {/* --- Prossimi eventi --- */}
          <Panel className="lg:col-span-2" padding={false}>
            <div className="p-4 lg:p-6">
              <PanelTitle titolo="Prossimi eventi" nota="I quattro appuntamenti più vicini" />
            </div>
            {eventi.length === 0 ? (
              <EmptyState
                icona="event_busy"
                titolo="Nessun evento in programma"
                testo="Gli eventi pubblicati compaiono qui e anche sul sito pubblico."
              />
            ) : (
              <div className="divide-y divide-hairline">
                {eventi.map((ev) => {
                  const d = ev.data_evento ? new Date(ev.data_evento) : null
                  return (
                    <div key={ev.id} className="flex items-center gap-4 px-4 py-3.5 lg:px-6">
                      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-canvas-parchment">
                        <span className="text-[10px] font-black uppercase tracking-wider text-ink-muted-48">
                          {d ? MESI[d.getMonth()].slice(0, 3) : '—'}
                        </span>
                        <span className="font-display-lg text-[20px] leading-none text-ink">
                          {d ? d.getDate() : '—'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14.5px] font-bold text-ink">{ev.titulo}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[12px] text-ink-muted-48">
                          {d && (
                            <span className="flex items-center gap-1">
                              <Icon name="schedule" className="text-[13px]" />
                              {d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                          {ev.local && (
                            <span className="flex items-center gap-1">
                              <Icon name="location_on" className="text-[13px]" />
                              {ev.local}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Panel>

          {/* --- Compleanni --- */}
          <Panel padding={false}>
            <div className="p-4 lg:p-6">
              <PanelTitle titolo="Compleanni" nota={`Da oggi a fine ${MESI[OGGI.getMonth()].toLowerCase()}`} />
            </div>
            {compleanni.length === 0 ? (
              <EmptyState icona="cake" titolo="Nessun compleanno" testo="Nessun compleanno nei prossimi giorni." />
            ) : (
              <div className="divide-y divide-hairline">
                {compleanni.map((m) => {
                  const d = giornoMese(m.data_nascita)
                  return (
                    <div key={m.id} className="flex items-center gap-3 px-4 py-3 lg:px-6">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-500/12 text-[12px] font-bold text-pink-600">
                        {iniziali(m.nome_completo)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-semibold text-ink">{m.nome_completo}</p>
                        {m.telefono && <p className="text-[12px] text-ink-muted-48">{m.telefono}</p>}
                      </div>
                      <span className="shrink-0 rounded-full bg-canvas-parchment px-2.5 py-1 text-[12px] font-bold text-ink-muted-80">
                        {d.giorno}/{String(d.mese).padStart(2, '0')}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </Panel>

          {/* --- Dipartimenti --- */}
          <Panel className="lg:col-span-2" padding={false}>
            <div className="p-4 lg:p-6">
              <PanelTitle titolo="Dipartimenti" nota="Membri per dipartimento">
                <Link
                  to="/admin/dipartimenti"
                  className="text-[11px] font-bold uppercase tracking-widest text-ink-muted-48 transition-colors hover:text-ink"
                >
                  Gestisci
                </Link>
              </PanelTitle>
            </div>
            {dipartimentiConta.length === 0 ? (
              <EmptyState icona="diversity_3" titolo="Nessun dipartimento" testo="Crea i dipartimenti della chiesa per organizzare i servizi." />
            ) : (
              <div className="grid gap-px bg-hairline sm:grid-cols-2">
                {dipartimentiConta.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 bg-surface-pearl px-4 py-3.5 lg:px-6">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/12 text-violet-600">
                      <Icon name="diversity_3" className="text-[18px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold text-ink">{d.nome}</p>
                    </div>
                    <span className="shrink-0 text-[13px] font-bold text-ink-muted-80">{d.membri}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* --- Promemoria --- */}
          <Panel>
            <PanelTitle titolo="Promemoria" nota="Le tue note personali" />

            <form onSubmit={aggiungiPromemoria} className="mb-3 flex gap-2">
              <input
                type="text"
                value={nuovoPromemoria}
                onChange={(e) => setNuovoPromemoria(e.target.value)}
                placeholder="Aggiungi un promemoria…"
                className="flex-1 rounded-xl border border-hairline bg-canvas-parchment px-3 py-2 text-[13px] text-ink outline-none transition-colors focus:border-[#A67C3D]"
              />
              <button
                type="submit"
                aria-label="Aggiungi"
                style={{ backgroundColor: ORO }}
                className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl text-white transition-all hover:brightness-110"
              >
                <Icon name="add" className="text-[19px]" />
              </button>
            </form>

            {promemoria.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-ink-muted-48">Nessun promemoria.</p>
            ) : (
              <ul className="max-h-[240px] space-y-1.5 overflow-y-auto">
                {promemoria.map((p) => (
                  <li
                    key={p.id}
                    className="group flex items-center gap-2.5 rounded-xl border border-hairline bg-canvas-parchment px-3 py-2.5"
                  >
                    <button
                      type="button"
                      onClick={() => alternaPromemoria(p)}
                      aria-label={p.fatto ? 'Segna da fare' : 'Segna come fatto'}
                      className="shrink-0"
                    >
                      <Icon
                        name={p.fatto ? 'check_circle' : 'radio_button_unchecked'}
                        filled={p.fatto}
                        className="text-[19px]"
                        style={{ color: p.fatto ? ORO : 'var(--color-ink-muted-48)' }}
                      />
                    </button>
                    <span
                      className={`flex-1 text-[13px] ${
                        p.fatto ? 'text-ink-muted-48 line-through' : 'text-ink'
                      }`}
                    >
                      {p.testo}
                    </span>
                    <button
                      type="button"
                      onClick={() => eliminaPromemoria(p)}
                      aria-label="Elimina"
                      className="shrink-0 text-ink-muted-48 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                    >
                      <Icon name="close" className="text-[16px]" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </AdminLayout>
  )
}
