import { useEffect, useMemo, useState } from 'react'
import Icon from '../../../components/Icon'
import { EmptyState, Pagination, Panel, PanelTitle, Pill, Segmented } from '../../components/ui'
import {
  COLORI_GRAFICO,
  MESI,
  OGGI,
  addDays,
  fmtAsse,
  fmtData,
  fmtMoney,
  monthKey,
  monthLabel,
  niceCeil,
  pctLabel,
  toDate,
} from '../../theme'
import { TIPI, isEntrata, rataScaduta, statoRata, statoTitolo } from '../../hooks/useFinanze'

const VERDE = '#107C42'
const ROSSO = '#EF4444'

/* ================================================================== */
/* FLUSSO DI CASSA · grafico giornaliero                               */
/* ================================================================== */

function FlussoGrafico({ rate, mese }) {
  const dati = useMemo(() => {
    const anno = mese.getFullYear()
    const m = mese.getMonth()
    const inizioMese = new Date(anno, m, 1)
    const giorniNelMese = new Date(anno, m + 1, 0).getDate()

    let saldoIniziale = 0
    rate.forEach((r) => {
      if (toDate(r.scadenza) < inizioMese) saldoIniziale += isEntrata(r.titolo) ? r.importo : -r.importo
    })

    const entrate = Array(giorniNelMese + 1).fill(0)
    const uscite = Array(giorniNelMese + 1).fill(0)
    rate.forEach((r) => {
      const d = toDate(r.scadenza)
      if (d && d.getFullYear() === anno && d.getMonth() === m) {
        if (isEntrata(r.titolo)) entrate[d.getDate()] += r.importo
        else uscite[d.getDate()] += r.importo
      }
    })

    let corrente = saldoIniziale
    const saldo = []
    for (let g = 1; g <= giorniNelMese; g++) {
      corrente += entrate[g] - uscite[g]
      saldo.push(corrente)
    }
    return { giorniNelMese, saldoIniziale, entrate, uscite, saldo }
  }, [rate, mese])

  const { giorniNelMese, entrate, uscite, saldo, saldoIniziale } = dati

  const eMeseCorrente = mese.getFullYear() === OGGI.getFullYear() && mese.getMonth() === OGGI.getMonth()
  const mesePassato = mese < new Date(OGGI.getFullYear(), OGGI.getMonth(), 1)
  const idxOggi = eMeseCorrente ? Math.min(OGGI.getDate(), giorniNelMese) : mesePassato ? giorniNelMese : 0

  const maxMov = Math.max(0, ...entrate, ...uscite)
  const maxSaldo = Math.max(0, saldoIniziale, ...saldo)
  const yMax = niceCeil(Math.max(maxMov, maxSaldo, 10))

  const W = 1200
  const H = 380
  const padL = 62
  const padR = 24
  const padT = 26
  const padB = 30
  const innerW = W - padL - padR
  const innerH = H - padT - padB
  const banda = innerW / giorniNelMese
  const baseline = padT + innerH
  const yPer = (v) => padT + innerH - (v / yMax) * innerH
  const xCentro = (g) => padL + banda * (g - 1) + banda / 2
  const barW = Math.max(2, Math.min(7, banda * 0.28))
  const tacche = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * yMax))

  const punti = saldo.map((v, i) => ({ x: xCentro(i + 1), y: yPer(v) }))
  const pieni = idxOggi > 0 ? punti.slice(0, idxOggi) : []
  const tratteggiati = idxOggi > 0 ? punti.slice(Math.max(0, idxOggi - 1)) : punti
  const toPath = (pts) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const areaPath = pieni.length
    ? `${toPath(pieni)} L ${pieni[pieni.length - 1].x.toFixed(1)} ${baseline} L ${pieni[0].x.toFixed(1)} ${baseline} Z`
    : ''

  const etichetteGiorni = []
  for (let g = 1; g <= giorniNelMese; g += 3) etichetteGiorni.push(g)
  if (etichetteGiorni[etichetteGiorni.length - 1] !== giorniNelMese) etichetteGiorni.push(giorniNelMese)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet" className="block min-w-[680px]">
      <defs>
        <linearGradient id="areaFlusso" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={VERDE} stopOpacity="0.25" />
          <stop offset="100%" stopColor={VERDE} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {tacche.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={yPer(t)} x2={W - padR} y2={yPer(t)} stroke="var(--color-hairline)" strokeWidth="1" />
          <text
            x={padL - 10}
            y={yPer(t) + 4}
            textAnchor="end"
            fontSize="11"
            fontWeight="600"
            fill="var(--color-ink-muted-48)"
          >
            {fmtAsse(t)}
          </text>
        </g>
      ))}

      {areaPath && <path d={areaPath} fill="url(#areaFlusso)" />}
      {pieni.length > 1 && (
        <path d={toPath(pieni)} fill="none" stroke={VERDE} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      )}
      {tratteggiati.length > 1 && (
        <path
          d={toPath(tratteggiati)}
          fill="none"
          stroke={VERDE}
          strokeWidth="2.5"
          strokeDasharray="6 5"
          strokeLinecap="round"
          opacity="0.65"
        />
      )}

      {Array.from({ length: giorniNelMese }, (_, i) => i + 1).map((g) => {
        const cx = xCentro(g)
        return (
          <g key={g}>
            {entrate[g] > 0 && (
              <rect
                x={cx - barW - 1}
                y={yPer(entrate[g])}
                width={barW}
                height={Math.max(2, baseline - yPer(entrate[g]))}
                rx="2"
                fill={VERDE}
              >
                <title>{`${g} — entrate ${fmtMoney(entrate[g])}`}</title>
              </rect>
            )}
            {uscite[g] > 0 && (
              <rect
                x={cx + 1}
                y={yPer(uscite[g])}
                width={barW}
                height={Math.max(2, baseline - yPer(uscite[g]))}
                rx="2"
                fill={ROSSO}
              >
                <title>{`${g} — uscite ${fmtMoney(uscite[g])}`}</title>
              </rect>
            )}
          </g>
        )
      })}

      {etichetteGiorni.map((g) => (
        <text
          key={g}
          x={xCentro(g)}
          y={H - 8}
          textAnchor="middle"
          fontSize="10.5"
          fontWeight="600"
          fill="var(--color-ink-muted-48)"
        >
          {g}
        </text>
      ))}
    </svg>
  )
}

/* ================================================================== */
/* FLUSSO DI CASSA · proiezione mensile                                */
/* ================================================================== */

function FlussoMensile({ rate }) {
  const flusso = useMemo(() => {
    if (!rate.length) return { mesi: [], saldoFinale: 0 }
    const date = rate.map((r) => toDate(r.scadenza)?.getTime() || OGGI.getTime())
    const inizio = new Date(Math.min(...date, OGGI.getTime()))
    inizio.setDate(1)
    const fine = new Date(Math.max(...date, addDays(OGGI, 60).getTime()))
    fine.setDate(1)

    const mesi = []
    const cursore = new Date(inizio)
    let guardia = 0
    while (cursore <= fine && guardia < 36) {
      const key = monthKey(cursore)
      const delMese = rate.filter((r) => monthKey(toDate(r.scadenza)) === key)
      const entrata = delMese.filter((r) => isEntrata(r.titolo)).reduce((a, r) => a + r.importo, 0)
      const uscita = delMese.filter((r) => !isEntrata(r.titolo)).reduce((a, r) => a + r.importo, 0)
      mesi.push({ key, entrata, uscita, netto: entrata - uscita })
      cursore.setMonth(cursore.getMonth() + 1)
      guardia++
    }

    let acc = 0
    mesi.forEach((m) => {
      acc += m.netto
      m.accumulato = acc
    })
    return { mesi, saldoFinale: acc }
  }, [rate])

  if (!flusso.mesi.length) {
    return <div className="p-12 text-center text-ink-muted-48">Nessuna rata da proiettare.</div>
  }

  const maxBar = Math.max(...flusso.mesi.map((m) => Math.max(m.entrata, m.uscita)), 1)

  return (
    <div className="mt-2 space-y-4">
      {flusso.mesi.map((m) => {
        const corrente = m.key === monthKey(OGGI)
        return (
          <div key={m.key} className="grid grid-cols-[64px_1fr_120px] items-center gap-3 lg:grid-cols-[72px_1fr_140px]">
            <div
              className={`text-[12px] font-bold uppercase tracking-wider ${
                corrente ? 'text-[#107C42]' : 'text-ink-muted-80'
              }`}
            >
              {monthLabel(m.key)}
              {corrente ? ' •' : ''}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-canvas-parchment">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#107C42] to-emerald-400"
                    style={{ width: `${(m.entrata / maxBar) * 100}%` }}
                  />
                </div>
                <span className="min-w-[84px] text-right text-[11.5px] font-bold text-[#107C42]">
                  {m.entrata ? fmtMoney(m.entrata) : '—'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-canvas-parchment">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400"
                    style={{ width: `${(m.uscita / maxBar) * 100}%` }}
                  />
                </div>
                <span className="min-w-[84px] text-right text-[11.5px] font-bold text-red-500">
                  {m.uscita ? `-${fmtMoney(m.uscita)}` : '—'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[9.5px] font-bold uppercase tracking-wider text-ink-muted-48">Accumulato</div>
              <div className={`text-[14px] font-bold ${m.accumulato >= 0 ? 'text-ink' : 'text-red-500'}`}>
                {fmtMoney(m.accumulato)}
              </div>
            </div>
          </div>
        )
      })}

      <div className="mt-6 flex items-center justify-end border-t border-hairline pt-4">
        <div className="text-[13px] font-medium text-ink-muted-80">
          Saldo previsto a fine orizzonte:{' '}
          <strong className={`text-[15px] ${flusso.saldoFinale >= 0 ? 'text-[#107C42]' : 'text-red-500'}`}>
            {fmtMoney(flusso.saldoFinale)}
          </strong>
        </div>
      </div>
    </div>
  )
}

export function FlussoView({ rate }) {
  const [modo, setModo] = useState('grafico')
  const [mese, setMese] = useState(() => new Date(OGGI.getFullYear(), OGGI.getMonth(), 1))
  const etichettaMese = mese.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
  const sposta = (n) => setMese((m) => new Date(m.getFullYear(), m.getMonth() + n, 1))

  return (
    <Panel>
      <PanelTitle
        titolo={modo === 'grafico' ? 'Movimenti giornalieri × saldo accumulato' : 'Proiezione mensile di cassa'}
        nota={
          modo === 'grafico'
            ? `${etichettaMese} · realizzato + previsto`
            : 'Entrate × uscite per mese di scadenza'
        }
      >
        {modo === 'grafico' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => sposta(-1)}
              aria-label="Mese precedente"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline text-ink-muted-80 transition-colors hover:bg-canvas-parchment hover:text-ink"
            >
              <Icon name="chevron_left" className="text-[16px]" />
            </button>
            <span className="min-w-[120px] text-center text-[12.5px] font-bold capitalize text-ink-muted-80">
              {etichettaMese}
            </span>
            <button
              type="button"
              onClick={() => sposta(1)}
              aria-label="Mese successivo"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline text-ink-muted-80 transition-colors hover:bg-canvas-parchment hover:text-ink"
            >
              <Icon name="chevron_right" className="text-[16px]" />
            </button>
          </div>
        )}

        <Segmented
          compact
          value={modo}
          onChange={setModo}
          accent={VERDE}
          options={[
            { value: 'grafico', label: 'Grafico', icon: 'show_chart' },
            { value: 'mensile', label: 'Mensile', icon: 'bar_chart' },
          ]}
        />
      </PanelTitle>

      {modo === 'grafico' && (
        <div className="mb-2 flex flex-wrap justify-end gap-4 text-[11px] font-bold uppercase tracking-wider text-ink-muted-48">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-[#107C42]" /> Entrate
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-red-500" /> Uscite
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1 w-4 rounded bg-[#107C42]" /> Saldo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 border-t-2 border-dashed border-[#107C42]" /> Proiezione
          </span>
        </div>
      )}

      {modo === 'grafico' ? (
        <div className="overflow-x-auto pb-1">
          <FlussoGrafico rate={rate} mese={mese} />
        </div>
      ) : (
        <FlussoMensile rate={rate} />
      )}
    </Panel>
  )
}

/* ================================================================== */
/* Riga rata                                                           */
/* ================================================================== */

export function RataRow({ rata, titolo, onSalda, onStorna, mostraTitolo }) {
  const st = statoRata(rata)
  const entrata = isEntrata(titolo)

  return (
    <div className="flex items-center gap-3 rounded-xl border border-hairline bg-surface-pearl p-3 shadow-sm transition-all hover:border-ink-muted-48/30">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold"
        style={{ backgroundColor: `${st.color}15`, color: st.color }}
      >
        {rata.numero}/{rata.totale_rate}
      </div>

      <div className="min-w-0 flex-1">
        {mostraTitolo && <div className="truncate text-[13px] font-bold text-ink">{titolo.descrizione}</div>}
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink-muted-48">
          <span className="flex items-center gap-1">
            <Icon name="event" className="text-[13px]" /> Scade il {fmtData(rata.scadenza)}
          </span>
          {rata.stato === 'saldata' && rata.saldata_il && (
            <span className="font-bold text-[#107C42]">· saldata il {fmtData(rata.saldata_il)}</span>
          )}
        </div>
      </div>

      <Pill label={st.label} color={st.color} bg={st.bg} />

      <div className="min-w-[96px] text-right">
        <div className={`text-[14px] font-bold ${entrata ? 'text-ink' : 'text-red-500'}`}>
          {entrata ? '' : '-'}
          {fmtMoney(rata.importo)}
        </div>
      </div>

      <div className="flex shrink-0 gap-1.5">
        {rata.stato === 'saldata' ? (
          <button
            type="button"
            onClick={() => onStorna(rata)}
            title="Annulla il saldo"
            className="flex items-center gap-1 rounded-lg border border-hairline px-2.5 py-1.5 text-[12px] font-bold text-ink-muted-80 transition-all hover:bg-canvas-parchment hover:text-ink"
          >
            <Icon name="undo" className="text-[14px]" /> Storna
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onSalda(rata, titolo)}
            title={entrata ? 'Registra incasso' : 'Registra pagamento'}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-bold transition-all"
            style={{
              backgroundColor: entrata ? 'rgba(16,124,66,0.15)' : 'rgba(239,68,68,0.15)',
              color: entrata ? VERDE : ROSSO,
            }}
          >
            <Icon name="check_circle" className="text-[14px]" /> {entrata ? 'Incassa' : 'Paga'}
          </button>
        )}
      </div>
    </div>
  )
}

/* ================================================================== */
/* TITOLI                                                              */
/* ================================================================== */

export function TitoliView({ titoli, onSalda, onStorna, onRiprogramma, onElimina }) {
  const [aperto, setAperto] = useState(null)

  if (!titoli.length) {
    return (
      <Panel padding={false}>
        <EmptyState
          icona="receipt_long"
          titolo="Nessun movimento registrato"
          testo="Aggiungi il primo movimento per iniziare a tenere la contabilità della chiesa."
        />
      </Panel>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {titoli.map((t) => {
        const st = statoTitolo(t)
        const meta = TIPI[t.tipo] || TIPI.entrata
        const entrata = isEntrata(t)
        const espanso = aperto === t.id
        const rate = t.rate || []
        const saldato = rate
          .filter((r) => r.stato === 'saldata')
          .reduce((a, r) => a + (r.importo_saldato ?? r.importo), 0)
        const haSaldi = rate.some((r) => r.stato === 'saldata')

        return (
          <div
            key={t.id}
            className="overflow-hidden rounded-2xl border border-hairline bg-surface-pearl shadow-sm transition-shadow hover:shadow-md"
          >
            <div
              onClick={() => setAperto(espanso ? null : t.id)}
              className="flex cursor-pointer items-center gap-3.5 p-4 transition-colors hover:bg-canvas-parchment/50 lg:px-6"
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${meta.colore}15`, color: meta.colore }}
              >
                <Icon name={meta.icona} className="text-[20px]" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] font-bold text-ink">{t.descrizione}</span>
                  {t.categoria && (
                    <span
                      className="flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold"
                      style={{
                        color: t.categoria.colore || VERDE,
                        backgroundColor: `${t.categoria.colore || VERDE}15`,
                        borderColor: `${t.categoria.colore || VERDE}33`,
                      }}
                    >
                      <Icon name="sell" className="text-[11px]" /> {t.categoria.nome}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-[12px] text-ink-muted-48">
                  {meta.label} · {rate.length}
                  {rate.length === 1 ? ' rata' : ' rate'}
                </div>
              </div>

              <Pill label={st.label} color={st.color} bg={st.bg} />

              <div className="min-w-[112px] text-right">
                <div className={`text-[17px] font-bold ${entrata ? 'text-ink' : 'text-red-500'}`}>
                  {entrata ? '' : '-'}
                  {fmtMoney(t.importo_totale)}
                </div>
                {haSaldi && (
                  <div className="text-[11px] font-bold text-[#107C42]">
                    {fmtMoney(saldato)} {entrata ? 'incassato' : 'pagato'}
                  </div>
                )}
              </div>

              <Icon
                name={espanso ? 'expand_less' : 'chevron_right'}
                className="text-[18px] text-ink-muted-48"
              />
            </div>

            {espanso && (
              <div className="border-t border-hairline bg-canvas-parchment/60 p-4 lg:px-6">
                {t.note && (
                  <p className="mb-3 rounded-xl border border-hairline bg-surface-pearl p-3 text-[13px] text-ink-muted-80">
                    {t.note}
                  </p>
                )}

                <div className="mb-3 flex flex-col gap-2">
                  {rate.map((r) => (
                    <RataRow key={r.id} rata={r} titolo={t} onSalda={onSalda} onStorna={onStorna} />
                  ))}
                </div>

                <div className="flex flex-wrap justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => onRiprogramma(t)}
                    disabled={haSaldi}
                    title={haSaldi ? 'Storna i saldi per riprogrammare' : 'Riprogramma le rate'}
                    className="flex items-center gap-1.5 rounded-lg border border-hairline bg-surface-pearl px-3 py-1.5 text-[13px] font-semibold text-ink-muted-80 transition-all hover:bg-canvas-parchment hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Icon name="layers" className="text-[15px]" /> Riprogramma
                  </button>
                  <button
                    type="button"
                    onClick={() => onElimina(t)}
                    className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[13px] font-semibold text-red-500 transition-all hover:bg-red-500/20"
                  >
                    <Icon name="delete" className="text-[15px]" /> Elimina
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ================================================================== */
/* AGENDA                                                              */
/* ================================================================== */

const PER_PAGINA = 12

export function AgendaView({ rate, onSalda, onStorna }) {
  const ordinate = useMemo(
    () => [...rate].sort((a, b) => toDate(a.scadenza) - toDate(b.scadenza)),
    [rate]
  )
  const [pagina, setPagina] = useState(1)
  const totalePagine = Math.max(1, Math.ceil(ordinate.length / PER_PAGINA))

  useEffect(() => {
    setPagina((p) => Math.min(p, totalePagine))
  }, [totalePagine])

  if (!ordinate.length) {
    return (
      <Panel padding={false}>
        <EmptyState icona="event_busy" titolo="Nessuna rata in agenda" />
      </Panel>
    )
  }

  const inizio = (pagina - 1) * PER_PAGINA
  const visibili = ordinate.slice(inizio, inizio + PER_PAGINA)

  return (
    <>
      <Panel>
        <div className="flex flex-col gap-2">
          {visibili.map((r) => (
            <RataRow key={r.id} rata={r} titolo={r.titolo} onSalda={onSalda} onStorna={onStorna} mostraTitolo />
          ))}
        </div>
        <div className="mt-4 border-t border-hairline pt-3 text-center text-[12px] font-medium text-ink-muted-48">
          {inizio + 1}–{Math.min(inizio + PER_PAGINA, ordinate.length)} di {ordinate.length} rate
        </div>
      </Panel>
      <Pagination currentPage={pagina} totalPages={totalePagine} onPageChange={setPagina} />
    </>
  )
}

/* ================================================================== */
/* SPESE PER CATEGORIA                                                 */
/* ================================================================== */

export function SpeseView({ titoli }) {
  const [periodo, setPeriodo] = useState('mese')
  const [meseRif, setMeseRif] = useState(OGGI.getMonth())
  const [annoRif, setAnnoRif] = useState(OGGI.getFullYear())

  const spostaMese = (d) => {
    const nuovo = new Date(annoRif, meseRif + d, 1)
    setMeseRif(nuovo.getMonth())
    setAnnoRif(nuovo.getFullYear())
  }

  const dati = useMemo(() => {
    const mappa = new Map()
    let totale = 0
    let conteggio = 0

    titoli
      .filter((t) => !isEntrata(t))
      .forEach((t) => {
        const cat = t.categoria?.nome || 'Senza categoria'
        let valore = 0
        let n = 0
        const rate = t.rate || []

        if (periodo === 'tutto') {
          valore = Number(t.importo_totale) || 0
          n = rate.length || 1
        } else {
          rate.forEach((r) => {
            const d = toDate(r.scadenza)
            if (!d) return
            const okAnno = d.getFullYear() === annoRif
            const okMese = periodo === 'anno' || d.getMonth() === meseRif
            if (okAnno && okMese) {
              valore += r.importo
              n += 1
            }
          })
        }

        if (valore > 0) {
          const cur = mappa.get(cat) || { categoria: cat, totale: 0, conteggio: 0 }
          cur.totale += valore
          cur.conteggio += n
          mappa.set(cat, cur)
          totale += valore
          conteggio += n
        }
      })

    const lista = [...mappa.values()].sort((a, b) => b.totale - a.totale)
    lista.forEach((c, i) => {
      c.pct = totale > 0 ? (c.totale / totale) * 100 : 0
      c.colore = COLORI_GRAFICO[i % COLORI_GRAFICO.length]
    })
    return { lista, totale, conteggio }
  }, [titoli, periodo, meseRif, annoRif])

  const { lista, totale, conteggio } = dati
  const maggiore = lista[0] || null
  const maxTotale = maggiore?.totale || 1
  const top = lista.slice(0, 6)

  const etichettaPeriodo =
    periodo === 'mese'
      ? `${MESI[meseRif]} ${annoRif}`
      : periodo === 'anno'
        ? `Anno ${annoRif}`
        : 'Tutto il periodo'

  return (
    <Panel padding={false}>
      {/* Intestazione a gradiente */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-rose-700 p-5 text-white lg:p-7">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <Icon name="pie_chart" className="text-[22px]" />
            </div>
            <div>
              <div className="text-[16px] font-bold uppercase tracking-wider">Uscite per categoria</div>
              <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wider opacity-90">
                {etichettaPeriodo}
              </div>
            </div>
          </div>
          <div className="text-left lg:text-right">
            <div className="text-[26px] font-bold leading-none tracking-tight lg:text-[30px]">{fmtMoney(totale)}</div>
            <div className="mt-1 text-[11.5px] font-medium opacity-85">
              {conteggio} {conteggio === 1 ? 'voce nel periodo' : 'voci nel periodo'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/20 pt-3">
          <div className="flex rounded-xl border border-white/10 bg-black/25 p-1 text-[12px] font-bold backdrop-blur-md">
            {[
              { v: 'mese', l: 'Mese' },
              { v: 'anno', l: 'Anno' },
              { v: 'tutto', l: 'Tutto' },
            ].map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setPeriodo(o.v)}
                className={`rounded-lg px-3 py-1.5 transition-all ${
                  periodo === o.v ? 'bg-white font-bold text-red-700 shadow' : 'text-white/80 hover:text-white'
                }`}
              >
                {o.l}
              </button>
            ))}
          </div>

          {periodo !== 'tutto' && (
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-2.5 py-1 text-[13px] font-bold">
              <button
                type="button"
                onClick={() => (periodo === 'mese' ? spostaMese(-1) : setAnnoRif((a) => a - 1))}
                aria-label="Periodo precedente"
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-white/15"
              >
                <Icon name="chevron_left" className="text-[16px]" />
              </button>
              <span className="min-w-[110px] text-center capitalize">
                {periodo === 'mese' ? `${MESI[meseRif]} ${annoRif}` : annoRif}
              </span>
              <button
                type="button"
                onClick={() => (periodo === 'mese' ? spostaMese(1) : setAnnoRif((a) => a + 1))}
                aria-label="Periodo successivo"
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-white/15"
              >
                <Icon name="chevron_right" className="text-[16px]" />
              </button>
            </div>
          )}
        </div>
      </div>

      {!lista.length ? (
        <div className="p-12 text-center text-ink-muted-48">
          Nessuna uscita registrata per {etichettaPeriodo.toLowerCase()}.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr]">
          <div className="border-b border-hairline p-5 lg:border-b-0 lg:border-r lg:p-7">
            <div className="flex flex-col gap-5">
              {top.map((c, i) => (
                <div key={c.categoria} className="flex items-center gap-3.5">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[12.5px] font-bold"
                    style={{ backgroundColor: `${c.colore}15`, color: c.colore }}
                  >
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="truncate text-[13.5px] font-semibold text-ink">{c.categoria}</span>
                      <span className="flex shrink-0 items-center gap-2.5">
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                          style={{ color: c.colore, backgroundColor: `${c.colore}15` }}
                        >
                          {pctLabel(c.pct)}
                        </span>
                        <span className="min-w-[86px] text-right text-[14px] font-bold text-ink">
                          {fmtMoney(c.totale)}
                        </span>
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-canvas-parchment">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.max(4, (c.totale / maxTotale) * 100)}%`, backgroundColor: c.colore }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 lg:p-7">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-muted-48">
              Composizione delle uscite
            </div>

            <div className="mb-4 flex h-3.5 gap-0.5 overflow-hidden rounded-full">
              {lista.map((c) => (
                <div
                  key={c.categoria}
                  title={`${c.categoria} · ${pctLabel(c.pct)}`}
                  style={{ width: `${c.pct}%`, minWidth: c.pct > 0 ? '3px' : 0, backgroundColor: c.colore }}
                />
              ))}
            </div>

            <div className="flex flex-col gap-2.5">
              {lista.map((c) => (
                <div key={c.categoria} className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.colore }} />
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-muted-80">{c.categoria}</span>
                  <span className="min-w-[48px] text-right text-[12px] font-bold" style={{ color: c.colore }}>
                    {pctLabel(c.pct)}
                  </span>
                  <span className="min-w-[86px] text-right text-[12px] font-semibold text-ink-muted-48">
                    {fmtMoney(c.totale)}
                  </span>
                </div>
              ))}
            </div>

            {maggiore && (
              <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-500">
                  <Icon name="trending_up" className="text-[14px]" /> Uscita maggiore
                </div>
                <div className="mt-1 text-[17px] font-bold uppercase text-ink">{maggiore.categoria}</div>
                <div className="mt-0.5 text-[13px] font-medium text-ink-muted-80">
                  {fmtMoney(maggiore.totale)} · {maggiore.conteggio}{' '}
                  {maggiore.conteggio === 1 ? 'voce' : 'voci'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Panel>
  )
}

export { rataScaduta }
