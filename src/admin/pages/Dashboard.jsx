import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { supabase } from '../../lib/supabase'
import { eliminaPerId } from '../lib/db'
import Icon from '../../components/Icon'
import AdminLayout, { PageTitle } from '../components/AdminLayout'
import { toast } from '../components/Toast'
import { BtnGhost, BtnPrimary, EmptyState, Kpi, Loading, Modal, Panel, PanelTitle } from '../components/ui'
import { ACCENT, MESI, OGGI, monthLabel, saluto, tabellaMancante } from '../theme'

const ORO = ACCENT.dashboard

/* ------------------------------------------------------------------ */
/* Utilità                                                             */
/* ------------------------------------------------------------------ */

const fmtDataEstesa = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const giornoMese = (iso) => {
  if (!iso) return null
  const [, m, g] = String(iso).slice(0, 10).split('-')
  return { mese: Number(m), giorno: Number(g) }
}

const eta = (iso) => {
  if (!iso) return null
  const n = new Date(`${String(iso).slice(0, 10)}T12:00:00`)
  const oggi = new Date()
  let a = oggi.getFullYear() - n.getFullYear()
  const m = oggi.getMonth() - n.getMonth()
  if (m < 0 || (m === 0 && oggi.getDate() < n.getDate())) a--
  return a >= 0 ? a : null
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
  const [eventoSelezionato, setEventoSelezionato] = useState(null)
  const [membroCompleanno, setMembroCompleanno] = useState(null)
  const [dipartimentoSelezionato, setDipartimentoSelezionato] = useState(null)

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
      dipartimenti.map((d) => {
        const membriDip = membri.filter((m) => m.dipartimento_id === d.id)
        const percentuale = membri.length > 0 ? Math.round((membriDip.length / membri.length) * 100) : 0
        return {
          ...d,
          listaMembri: membriDip,
          membri: membriDip.length,
          percentuale,
        }
      }),
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
    const { error } = await eliminaPerId('promemoria', p.id)
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
            <div className="p-4 lg:p-6 border-b border-hairline/60">
              <PanelTitle titolo="Prossimi eventi" nota="Clicca su un evento per vederne i dettagli" />
            </div>
            {eventi.length === 0 ? (
              <EmptyState
                icona="event_busy"
                titolo="Nessun evento in programma"
                testo="Gli eventi pubblicati compaiono qui e anche sul sito pubblico."
              />
            ) : (
              <div className="p-3 space-y-2.5">
                {eventi.map((ev) => {
                  const d = ev.data_evento ? new Date(ev.data_evento) : null
                  const orario = ev.hora || (d ? d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : '')

                  return (
                    <div
                      key={ev.id}
                      onClick={() => setEventoSelezionato(ev)}
                      className="group flex cursor-pointer items-center justify-between gap-3.5 rounded-2xl border border-hairline/80 bg-surface-pearl p-3.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C8A165]/40 hover:bg-canvas-parchment/80 hover:shadow-md active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Immagine di copertina o Badge Data stilizzato */}
                        {ev.imagem_url ? (
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-hairline bg-canvas-parchment shadow-inner">
                            <img
                              src={ev.imagem_url}
                              alt={ev.titulo}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
                              {d ? d.getDate() : '—'} {d ? MESI[d.getMonth()].slice(0, 3) : ''}
                            </div>
                          </div>
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-[#C8A165]/20 bg-gradient-to-br from-[#C8A165]/12 to-[#C8A165]/5 text-center shadow-xs transition-colors group-hover:border-[#C8A165]/40 group-hover:bg-[#C8A165]/20">
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#C8A165]">
                              {d ? MESI[d.getMonth()].slice(0, 3) : '—'}
                            </span>
                            <span className="font-display-lg text-[20px] font-bold leading-none text-ink">
                              {d ? d.getDate() : '—'}
                            </span>
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-[15px] font-bold text-ink transition-colors group-hover:text-[#A67C3D]">
                            {ev.titulo}
                          </h4>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-muted-48">
                            {orario && (
                              <span className="flex items-center gap-1 font-medium text-ink-muted-80">
                                <Icon name="schedule" className="text-[13.5px] text-[#C8A165]" />
                                {orario}
                              </span>
                            )}
                            {ev.local && (
                              <span className="flex items-center gap-1 truncate font-medium">
                                <Icon name="location_on" className="text-[13.5px] text-ink-muted-48" />
                                {ev.local}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-gold-500/20 bg-gold-500/10 px-2.5 py-1 text-[11px] font-bold text-gold-700 opacity-0 transition-opacity group-hover:opacity-100">
                          Vedi dettagli
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-canvas-parchment text-ink-muted-48 transition-colors group-hover:bg-[#C8A165]/15 group-hover:text-ink">
                          <Icon name="chevron_right" className="text-[18px] transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Panel>

          {/* --- Compleanni --- */}
          <Panel padding={false} className="overflow-hidden border border-hairline bg-surface-card shadow-soft">
            <div className="flex items-center justify-between border-b border-hairline bg-gradient-to-r from-pink-500/5 via-rose-500/5 to-amber-500/5 p-4 lg:p-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500/15 text-pink-600 shadow-xs">
                  <Icon name="cake" className="text-[20px]" />
                </div>
                <div>
                  <h3 className="font-headline text-[15px] font-bold text-ink">Compleanni</h3>
                  <p className="text-[11px] font-medium text-ink-muted-48">
                    Fino a fine {MESI[OGGI.getMonth()].toLowerCase()}
                  </p>
                </div>
              </div>
              {compleanni.length > 0 && (
                <span className="rounded-full bg-pink-500/15 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-pink-700 border border-pink-500/20">
                  {compleanni.length} {compleanni.length === 1 ? 'membro' : 'membri'}
                </span>
              )}
            </div>

            {compleanni.length === 0 ? (
              <div className="py-10 text-center text-ink-muted-48">
                <Icon name="cake" className="mx-auto text-[32px] opacity-30 mb-1 text-pink-500" />
                <p className="text-[13px] font-medium">Nessun compleanno in arrivo questo mese.</p>
              </div>
            ) : (
              <div className="divide-y divide-hairline">
                {compleanni.map((m) => {
                  const d = giornoMese(m.data_nascita)
                  const eOggi = d && d.giorno === OGGI.getDate() && d.mese === (OGGI.getMonth() + 1)
                  const waPhone = m.telefono ? m.telefono.replace(/[^0-9]/g, '') : null
                  const waText = encodeURIComponent(`Tanti auguri di buon compleanno, ${m.nome_completo}! 🎉🎂 Dio ti benedica. Chiesa L'Oasi.`)
                  const waUrl = waPhone ? `https://wa.me/${waPhone}?text=${waText}` : null

                  return (
                    <div
                      key={m.id}
                      onClick={() => setMembroCompleanno(m)}
                      className={`group flex items-center justify-between gap-3 p-3.5 lg:px-5 cursor-pointer transition-all ${
                        eOggi
                          ? 'bg-gradient-to-r from-pink-500/10 via-rose-500/5 to-transparent hover:from-pink-500/15'
                          : 'hover:bg-surface-pearl'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-bold shadow-xs transition-transform group-hover:scale-105 ${
                            eOggi
                              ? 'bg-gradient-to-tr from-pink-500 to-rose-400 text-white ring-2 ring-pink-400/40 ring-offset-1'
                              : 'bg-pink-500/12 text-pink-700'
                          }`}
                        >
                          {iniziali(m.nome_completo)}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-[13.5px] font-bold text-ink group-hover:text-pink-600 transition-colors">
                              {m.nome_completo}
                            </p>
                            {eOggi && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-pink-500 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-widest text-white shadow-xs animate-pulse">
                                🎉 OGGI!
                              </span>
                            )}
                          </div>
                          <p className="text-[12px] text-ink-muted-48 truncate">
                            {m.telefono ? m.telefono : m.ruolo || 'Membro'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`rounded-xl px-2.5 py-1 text-[11.5px] font-bold tracking-tight border ${
                            eOggi
                              ? 'bg-pink-500 text-white border-pink-400 shadow-xs'
                              : 'bg-surface-pearl text-ink-muted-80 border-hairline'
                          }`}
                        >
                          {d.giorno}/{String(d.mese).padStart(2, '0')}
                        </span>

                        {waUrl && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title={`Invia auguri su WhatsApp a ${m.nome_completo}`}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 transition-all hover:bg-emerald-500 hover:text-white active:scale-95 border border-emerald-500/20"
                          >
                            <Icon name="chat" className="text-[16px]" />
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Panel>

          {/* --- Dipartimenti --- */}
          <Panel className="lg:col-span-2 overflow-hidden border border-hairline bg-surface-card shadow-soft" padding={false}>
            <div className="flex items-center justify-between border-b border-hairline bg-gradient-to-r from-violet-500/5 via-purple-500/5 to-indigo-500/5 p-4 lg:p-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600 shadow-xs">
                  <Icon name="diversity_3" className="text-[20px]" />
                </div>
                <div>
                  <h3 className="font-headline text-[15px] font-bold text-ink">Dipartimenti</h3>
                  <p className="text-[11px] font-medium text-ink-muted-48">Membri e reparti di servizio</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-block rounded-full bg-violet-500/15 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-violet-700 border border-violet-500/20">
                  {dipartimentiConta.length} {dipartimentiConta.length === 1 ? 'dipartimento' : 'dipartimenti'}
                </span>
                <Link
                  to="/admin/dipartimenti"
                  className="flex items-center gap-1 rounded-xl border border-hairline bg-surface-pearl px-3 py-1.5 text-[12px] font-bold text-ink-muted-80 transition-all hover:bg-canvas-parchment hover:text-ink active:scale-95 shadow-xs"
                >
                  <Icon name="edit" className="text-[14px]" />
                  Gestisci
                </Link>
              </div>
            </div>

            {dipartimentiConta.length === 0 ? (
              <EmptyState icona="diversity_3" titolo="Nessun dipartimento" testo="Crea i dipartimenti della chiesa per organizzare i servizi." />
            ) : (
              <div className="grid gap-3.5 p-4 lg:p-5 sm:grid-cols-2">
                {dipartimentiConta.map((d) => {
                  const colore = d.colore || '#8B5CF6'
                  return (
                    <div
                      key={d.id}
                      onClick={() => setDipartimentoSelezionato(d)}
                      className="group flex flex-col justify-between rounded-2xl border border-hairline bg-surface-pearl p-4 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-400/40 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-xs transition-transform group-hover:scale-105"
                            style={{ backgroundColor: colore }}
                          >
                            <Icon name="diversity_3" className="text-[20px]" />
                          </span>
                          <div className="min-w-0">
                            <h4 className="truncate text-[14px] font-bold text-ink group-hover:text-violet-600 transition-colors">
                              {d.nome}
                            </h4>
                            {d.responsavel ? (
                              <p className="truncate text-[11.5px] font-medium text-ink-muted-48">
                                Resp.: {d.responsavel}
                              </p>
                            ) : (
                              <p className="text-[11.5px] font-medium text-ink-muted-48">Clicca per i membri</p>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className="text-lg font-black text-ink">{d.membri}</span>
                          <span className="ml-1 text-[11px] font-bold text-ink-muted-48">
                            {d.membri === 1 ? 'membro' : 'membri'}
                          </span>
                        </div>
                      </div>

                      {/* Barra proporzionale membri */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[10.5px] font-bold text-ink-muted-48 mb-1">
                          <span>Percentuale chiesa</span>
                          <span>{d.percentuale}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-hairline">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(d.percentuale, 4)}%`, backgroundColor: colore }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
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

      {/* --- Modal Dettagli Evento --- */}
      {eventoSelezionato && (
        <Modal
          onClose={() => setEventoSelezionato(null)}
          titolo={eventoSelezionato.titulo}
          sottotitolo="Dettagli dell'appuntamento"
          icona="event"
          accent="#C8A165"
          larghezza="max-w-xl"
        >
          <div className="flex flex-col gap-4">
            {eventoSelezionato.imagem_url && (
              <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-hairline bg-canvas-parchment shadow-sm">
                <img
                  src={eventoSelezionato.imagem_url}
                  alt={eventoSelezionato.titulo}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-xl border border-hairline bg-surface-pearl p-3.5 shadow-xs">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C8A165]/15 text-[#C8A165]">
                  <Icon name="calendar_month" className="text-[20px]" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted-48">Data e ora</div>
                  <div className="mt-0.5 text-[13.5px] font-bold text-ink capitalize">
                    {fmtDataEstesa(eventoSelezionato.data_evento)}
                  </div>
                  {(eventoSelezionato.hora || eventoSelezionato.data_evento) && (
                    <div className="mt-0.5 text-[12px] font-semibold text-[#C8A165]">
                      ore {eventoSelezionato.hora || new Date(eventoSelezionato.data_evento).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-hairline bg-surface-pearl p-3.5 shadow-xs">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-700">
                  <Icon name="location_on" className="text-[20px]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted-48">Luogo</div>
                  <div className="mt-0.5 text-[13.5px] font-bold text-ink truncate">
                    {eventoSelezionato.local || 'Comunità L’Oasi'}
                  </div>
                </div>
              </div>
            </div>

            {eventoSelezionato.descricao && (
              <div className="rounded-xl border border-hairline bg-surface-pearl p-4 shadow-xs">
                <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-muted-48">
                  Descrizione dell'evento
                </div>
                <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-ink-muted-80">
                  {eventoSelezionato.descricao}
                </p>
              </div>
            )}

            {eventoSelezionato.link_inscricao && (
              <a
                href={eventoSelezionato.link_inscricao}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#C8A165] px-4 py-2.5 text-[13px] font-bold text-ink-950 transition-all hover:brightness-110 shadow-sm"
              >
                <Icon name="open_in_new" className="text-[17px]" />
                Apri link di iscrizione
              </a>
            )}

            <div className="mt-2 flex items-center justify-between border-t border-hairline pt-3">
              <Link
                to="/admin/eventi"
                className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-muted-80 hover:text-ink transition-colors"
              >
                <Icon name="edit" className="text-[16px]" />
                Gestisci eventi
              </Link>
              <BtnGhost type="button" onClick={() => setEventoSelezionato(null)}>
                Chiudi
              </BtnGhost>
            </div>
          </div>
        </Modal>
      )}

      {/* --- Modal Dettagli Compleanno Membro --- */}
      {membroCompleanno && (
        <Modal
          onClose={() => setMembroCompleanno(null)}
          titolo={membroCompleanno.nome_completo}
          sottotitolo="Scheda compleanno e contatti del membro"
          icona="cake"
          accent="#EC4899"
          larghezza="max-w-lg"
        >
          <div className="flex flex-col gap-4">
            {/* Header del Membro */}
            <div className="flex items-center gap-4 rounded-2xl border border-pink-500/20 bg-gradient-to-r from-pink-500/10 via-rose-500/5 to-amber-500/10 p-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 font-headline text-xl font-bold text-white shadow-md">
                {iniziali(membroCompleanno.nome_completo)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-headline text-lg font-bold text-ink">{membroCompleanno.nome_completo}</h4>
                  {giornoMese(membroCompleanno.data_nascita)?.giorno === OGGI.getDate() &&
                    giornoMese(membroCompleanno.data_nascita)?.mese === (OGGI.getMonth() + 1) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-pink-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-white shadow-xs animate-pulse">
                        🎉 OGGI!
                      </span>
                    )}
                </div>
                <p className="mt-0.5 text-[13px] font-semibold text-pink-700">
                  {membroCompleanno.ruolo || 'Membro della chiesa'}
                </p>
                {membroCompleanno.fascia_eta && (
                  <span className="mt-1.5 inline-block rounded-md bg-white/75 px-2 py-0.5 text-[11px] font-bold text-ink-muted-80">
                    Fascia: {membroCompleanno.fascia_eta}
                  </span>
                )}
              </div>
            </div>

            {/* Dettagli in Griglia */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-xl border border-hairline bg-surface-pearl p-3.5 shadow-xs">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-500/15 text-pink-600">
                  <Icon name="cake" className="text-[20px]" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted-48">Data di nascita</div>
                  <div className="mt-0.5 text-[13.5px] font-bold text-ink">
                    {membroCompleanno.data_nascita
                      ? new Date(`${membroCompleanno.data_nascita}T12:00:00`).toLocaleDateString('it-IT', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '—'}
                  </div>
                  {membroCompleanno.data_nascita && (
                    <div className="mt-0.5 text-[11.5px] font-semibold text-pink-600">
                      Compie {eta(membroCompleanno.data_nascita)} anni
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-hairline bg-surface-pearl p-3.5 shadow-xs">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700">
                  <Icon name="call" className="text-[20px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted-48">Telefono / WhatsApp</div>
                  <div className="mt-0.5 text-[13.5px] font-bold text-ink truncate">
                    {membroCompleanno.telefono || 'Non specificato'}
                  </div>
                </div>
              </div>
            </div>

            {/* Email & Stato Civile */}
            <div className="grid gap-3 sm:grid-cols-2">
              {membroCompleanno.email && (
                <div className="flex items-start gap-3 rounded-xl border border-hairline bg-surface-pearl p-3.5 shadow-xs">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600">
                    <Icon name="mail" className="text-[20px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted-48">E-mail</div>
                    <a href={`mailto:${membroCompleanno.email}`} className="mt-0.5 block text-[13px] font-semibold text-blue-600 hover:underline truncate">
                      {membroCompleanno.email}
                    </a>
                  </div>
                </div>
              )}

              {membroCompleanno.stato_civile && (
                <div className="flex items-start gap-3 rounded-xl border border-hairline bg-surface-pearl p-3.5 shadow-xs">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700">
                    <Icon name="family_restroom" className="text-[20px]" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted-48">Stato Civile</div>
                    <div className="mt-0.5 text-[13.5px] font-bold text-ink">{membroCompleanno.stato_civile}</div>
                  </div>
                </div>
              )}
            </div>

            {membroCompleanno.note && (
              <div className="rounded-xl border border-hairline bg-surface-pearl p-3.5 text-[13px] text-ink-muted-80">
                <span className="font-bold text-ink">Note: </span>
                {membroCompleanno.note}
              </div>
            )}

            {/* Botão WhatsApp di Destaque */}
            {membroCompleanno.telefono ? (
              <a
                href={`https://wa.me/${membroCompleanno.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `Tanti auguri di buon compleanno, ${membroCompleanno.nome_completo}! 🎉🎂 Benedizioni da parte della Chiesa L'Oasi!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 px-5 py-3 text-[14px] font-bold text-white transition-all hover:bg-emerald-500 shadow-md active:scale-95"
              >
                <Icon name="chat" className="text-[20px]" />
                Invia auguri su WhatsApp
              </a>
            ) : (
              <div className="rounded-xl border border-dashed border-hairline p-3 text-center text-[12.5px] text-ink-muted-48">
                Nessun numero di telefono inserito per questo membro.
              </div>
            )}

            <div className="mt-2 flex items-center justify-between border-t border-hairline pt-3">
              <Link
                to="/admin/membri"
                className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-muted-80 hover:text-ink transition-colors"
              >
                <Icon name="badge" className="text-[16px]" />
                Gestisci membri
              </Link>
              <BtnGhost type="button" onClick={() => setMembroCompleanno(null)}>
                Chiudi
              </BtnGhost>
            </div>
          </div>
        </Modal>
      )}

      {/* --- Modal Dettagli Dipartimento --- */}
      {dipartimentoSelezionato && (
        <Modal
          onClose={() => setDipartimentoSelezionato(null)}
          titolo={dipartimentoSelezionato.nome}
          sottotitolo="Membri afferenti e informazioni del dipartimento"
          icona="diversity_3"
          accent={dipartimentoSelezionato.colore || '#8B5CF6'}
          larghezza="max-w-xl"
        >
          <div className="flex flex-col gap-4">
            {/* Banner Dipartimento */}
            <div
              className="flex items-center justify-between rounded-2xl p-5 shadow-sm text-white"
              style={{
                backgroundColor: dipartimentoSelezionato.colore || '#8B5CF6',
              }}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                  <Icon name="diversity_3" className="text-[26px]" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-headline text-lg font-bold truncate">{dipartimentoSelezionato.nome}</h4>
                  {dipartimentoSelezionato.responsavel && (
                    <p className="text-[12px] opacity-90 truncate">
                      Responsabile: <span className="font-bold">{dipartimentoSelezionato.responsavel}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="text-2xl font-black">{dipartimentoSelezionato.membri}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                  {dipartimentoSelezionato.membri === 1 ? 'Membro' : 'Membri'}
                </div>
              </div>
            </div>

            {dipartimentoSelezionato.descricao && (
              <div className="rounded-xl border border-hairline bg-surface-pearl p-3.5 text-[13px] text-ink-muted-80">
                <span className="font-bold text-ink">Descrizione: </span>
                {dipartimentoSelezionato.descricao}
              </div>
            )}

            {/* Lista Membri del Dipartimento */}
            <div>
              <h5 className="mb-2 text-[12px] font-bold uppercase tracking-wider text-ink-muted-48 flex items-center gap-1.5">
                <Icon name="groups" className="text-[16px]" />
                Membri del dipartimento ({dipartimentoSelezionato.listaMembri?.length || 0})
              </h5>

              {!dipartimentoSelezionato.listaMembri || dipartimentoSelezionato.listaMembri.length === 0 ? (
                <div className="rounded-xl border border-dashed border-hairline p-6 text-center text-ink-muted-48">
                  <p className="text-[13px]">Nessun membro collegato a questo dipartimento.</p>
                </div>
              ) : (
                <div className="max-h-[260px] space-y-2 overflow-y-auto pr-1">
                  {dipartimentoSelezionato.listaMembri.map((m) => {
                    const waPhone = m.telefono ? m.telefono.replace(/[^0-9]/g, '') : null
                    const waUrl = waPhone ? `https://wa.me/${waPhone}` : null

                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-surface-pearl p-3 shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-[12px] font-bold text-violet-700">
                            {iniziali(m.nome_completo)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[13.5px] font-bold text-ink">{m.nome_completo}</p>
                            <p className="text-[11.5px] font-medium text-ink-muted-48 truncate">
                              {m.ruolo || m.telefono || 'Membro'}
                            </p>
                          </div>
                        </div>

                        {waUrl && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 transition-colors hover:bg-emerald-500 hover:text-white"
                            title={`Contatta ${m.nome_completo} su WhatsApp`}
                          >
                            <Icon name="chat" className="text-[16px]" />
                          </a>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-hairline pt-3">
              <Link
                to="/admin/dipartimenti"
                className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-muted-80 hover:text-ink transition-colors"
              >
                <Icon name="edit" className="text-[16px]" />
                Gestisci dipartimenti
              </Link>
              <BtnGhost type="button" onClick={() => setDipartimentoSelezionato(null)}>
                Chiudi
              </BtnGhost>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  )
}
