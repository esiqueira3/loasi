import { useMemo, useState } from 'react'
import Icon from '../../components/Icon'
import AdminLayout, { PageTitle } from '../components/AdminLayout'
import { toast } from '../components/Toast'
import { useConfirm } from '../components/Confirm'
import { BtnPrimary, CustomSelect, Kpi, Loading, Segmented, SetupPanel } from '../components/ui'
import { ACCENT, OGGI, addDays, fmtMoney, toDate } from '../theme'
import { isEntrata, rataScaduta, statoTitolo, useFinanze } from '../hooks/useFinanze'
import { AgendaView, FlussoView, SpeseView, TitoliView } from './finanze/viste'
import { NuovoMovimentoModal, RiprogrammaModal, SaldaRataModal } from './finanze/modali'

const VERDE = ACCENT.finanze

const VISTE = [
  { value: 'flusso', label: 'Flusso di cassa', icon: 'show_chart' },
  { value: 'titoli', label: 'Movimenti', icon: 'receipt_long' },
  { value: 'agenda', label: 'Agenda rate', icon: 'event' },
  { value: 'spese', label: 'Uscite', icon: 'pie_chart' },
]

export default function Finanze() {
  const confirm = useConfirm()
  const {
    titoli,
    categorie,
    chiese,
    loading,
    setupNeeded,
    creaTitolo,
    saldaRata,
    stornaRata,
    eliminaTitolo,
    riprogrammaTitolo,
  } = useFinanze()

  const [chiesaAttiva, setChiesaAttiva] = useState('tutte')
  const [vista, setVista] = useState('flusso')
  const [filtroTipo, setFiltroTipo] = useState('tutti')
  const [filtroStato, setFiltroStato] = useState('tutti')

  const [creando, setCreando] = useState(false)
  const [saldando, setSaldando] = useState(null)
  const [riprogrammando, setRiprogrammando] = useState(null)

  /* --- Tutto parte dalla comunità selezionata --- */
  const titoliChiesa = useMemo(() => {
    if (chiesaAttiva === 'tutte') return titoli
    if (chiesaAttiva === 'generale') return titoli.filter((t) => !t.igreja_id)
    return titoli.filter((t) => t.igreja_id === chiesaAttiva)
  }, [titoli, chiesaAttiva])

  const rateChiesa = useMemo(
    () => titoliChiesa.flatMap((t) => (t.rate || []).map((r) => ({ ...r, titolo: t }))),
    [titoliChiesa]
  )

  /* --- Filtri --- */
  const titoliFiltrati = useMemo(() => {
    let lista = titoliChiesa
    if (filtroTipo === 'entrate') lista = lista.filter(isEntrata)
    else if (filtroTipo === 'uscite') lista = lista.filter((t) => !isEntrata(t))
    if (filtroStato !== 'tutti') lista = lista.filter((t) => statoTitolo(t).key === filtroStato)
    return lista
  }, [titoliChiesa, filtroTipo, filtroStato])

  const rateFiltrate = useMemo(
    () => titoliFiltrati.flatMap((t) => (t.rate || []).map((r) => ({ ...r, titolo: t }))),
    [titoliFiltrati]
  )

  /* --- Riepilogo per comunità (saldo realizzato) --- */
  const riepilogoChiese = useMemo(() => {
    const saldoDi = (lista) => {
      const rate = lista.flatMap((t) => (t.rate || []).map((r) => ({ ...r, titolo: t })))
      const saldate = rate.filter((r) => r.stato === 'saldata')
      const inc = saldate
        .filter((r) => isEntrata(r.titolo))
        .reduce((a, r) => a + (r.importo_saldato ?? r.importo), 0)
      const pag = saldate
        .filter((r) => !isEntrata(r.titolo))
        .reduce((a, r) => a + (r.importo_saldato ?? r.importo), 0)
      return { incassato: inc, pagato: pag, saldo: inc - pag, movimenti: lista.length }
    }

    const voci = chiese.map((c) => ({
      key: c.id,
      label: c.cidade,
      ...saldoDi(titoli.filter((t) => t.igreja_id === c.id)),
    }))

    const generali = titoli.filter((t) => !t.igreja_id)
    if (generali.length) {
      voci.push({ key: 'generale', label: 'Generale', ...saldoDi(generali) })
    }
    return voci
  }, [titoli, chiese])

  /* --- KPI (della comunità selezionata) --- */
  const kpi = useMemo(() => {
    const rate = rateChiesa
    const entrate = rate.filter((r) => isEntrata(r.titolo))
    const uscite = rate.filter((r) => !isEntrata(r.titolo))
    const aperte = (arr) => arr.filter((r) => r.stato === 'aperta')

    const daIncassare = aperte(entrate).reduce((a, r) => a + r.importo, 0)
    const daPagare = aperte(uscite).reduce((a, r) => a + r.importo, 0)
    const incassato = entrate
      .filter((r) => r.stato === 'saldata')
      .reduce((a, r) => a + (r.importo_saldato ?? r.importo), 0)
    const scaduto = aperte(entrate).filter(rataScaduta).reduce((a, r) => a + r.importo, 0)

    const limite = addDays(OGGI, 30)
    const prossimi30 = aperte(entrate)
      .filter((r) => {
        const d = toDate(r.scadenza)
        return d && d >= OGGI && d <= limite
      })
      .reduce((a, r) => a + r.importo, 0)

    return { daIncassare, daPagare, incassato, scaduto, prossimi30, saldoPrevisto: daIncassare - daPagare }
  }, [rateChiesa])

  /* --- Azioni --- */
  const handleStorna = async (rata) => {
    const ok = await confirm({
      titolo: 'Stornare il saldo?',
      messaggio: 'La rata tornerà nello stato "aperta" e uscirà dal saldo di cassa.',
      testoConferma: 'Sì, storna',
    })
    if (!ok) return
    const res = await stornaRata(rata)
    if (res?.error) toast.error('Errore nello storno.')
    else toast.success('Saldo stornato.')
  }

  const handleElimina = async (titolo) => {
    const ok = await confirm({
      titolo: 'Eliminare il movimento?',
      messaggio: `"${titolo.descrizione}" e tutte le sue rate saranno eliminati definitivamente.`,
      testoConferma: 'Sì, elimina',
      intent: 'danger',
    })
    if (!ok) return
    const res = await eliminaTitolo(titolo.id)
    if (res?.error) toast.error(`Errore: ${res.error.message}`)
    else toast.success('Movimento eliminato.')
  }

  const handleSalda = async (rata, dati) => {
    const res = await saldaRata(rata, dati)
    if (res?.error) toast.error(`Errore: ${res.error.message}`)
    else toast.success('Movimento registrato.')
    return res
  }

  const handleCrea = async (dati) => {
    const res = await creaTitolo(dati)
    if (!res?.error) toast.success('Movimento registrato.')
    return res
  }

  const handleRiprogramma = async (titolo, dati) => {
    const res = await riprogrammaTitolo(titolo, dati)
    if (!res?.error) toast.success('Rate riprogrammate.')
    return res
  }

  return (
    <AdminLayout modulo="Finanze" titolo="Gestione finanziaria" icona="payments" accent={VERDE}>
      <div className="mx-auto max-w-[1600px]">
        <PageTitle
          titolo="Finanze"
          sottotitolo="Entrate, uscite, scadenze e flusso di cassa della chiesa in un unico pannello."
        >
          {!setupNeeded && !loading && (
            <BtnPrimary onClick={() => setCreando(true)}>
              <Icon name="add" className="text-[18px]" />
              Nuovo movimento
            </BtnPrimary>
          )}
        </PageTitle>

        {loading ? (
          <Loading testo="Caricamento dati finanziari…" />
        ) : setupNeeded ? (
          <SetupPanel
            tabelle={['titoli_finanziari', 'rate_finanziarie', 'categorie_finanziarie']}
            script="supabase_gestionale.sql"
          />
        ) : (
          <>
            {/* --- Selettore di comunità --- */}
            <div className="mb-6 overflow-hidden rounded-2xl border border-hairline bg-surface-pearl shadow-sm">
              <div className="flex items-center gap-2 overflow-x-auto border-b border-hairline p-3 no-scrollbar">
                <span className="mr-1 flex shrink-0 items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-ink-muted-48">
                  <Icon name="church" className="text-[16px]" />
                  Comunità
                </span>

                {[
                  { key: 'tutte', label: 'Tutte' },
                  ...chiese.map((c) => ({ key: c.id, label: c.cidade })),
                  ...(titoli.some((t) => !t.igreja_id) ? [{ key: 'generale', label: 'Generale' }] : []),
                ].map((o) => {
                  const attiva = chiesaAttiva === o.key
                  return (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() => setChiesaAttiva(o.key)}
                      className={`shrink-0 rounded-xl px-3.5 py-1.5 text-[12px] font-bold transition-all sm:px-4 sm:py-2 sm:text-[12.5px] ${
                        attiva ? 'text-white shadow-md' : 'text-ink-muted-80 hover:bg-canvas-parchment hover:text-ink'
                      }`}
                      style={attiva ? { backgroundColor: VERDE } : undefined}
                    >
                      {o.label}
                    </button>
                  )
                })}
              </div>

              {/* Saldo realizzato per comunità */}
              {riepilogoChiese.length > 0 && (
                <div
                  className={`grid gap-px bg-hairline ${
                    riepilogoChiese.length === 1
                      ? 'grid-cols-1'
                      : riepilogoChiese.length === 2
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : riepilogoChiese.length === 3
                      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                  }`}
                >
                  {riepilogoChiese.map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => setChiesaAttiva(r.key)}
                      className={`bg-surface-pearl p-3.5 sm:p-4 text-left transition-colors hover:bg-canvas-parchment/60 ${
                        chiesaAttiva === r.key ? 'bg-canvas-parchment/70' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[11px] sm:text-[12px] font-bold uppercase tracking-wider text-ink-muted-48">
                          {r.label}
                        </span>
                        <span className="shrink-0 text-[10px] sm:text-[10.5px] font-semibold text-ink-muted-48">
                          {r.movimenti} mov.
                        </span>
                      </div>
                      <div
                        className={`mt-1 text-[16px] sm:text-[17px] font-bold tracking-tight ${
                          r.saldo >= 0 ? 'text-ink' : 'text-red-500'
                        }`}
                      >
                        {fmtMoney(r.saldo)}
                      </div>
                      <div className="mt-1 flex items-center gap-2.5 text-[10.5px] sm:text-[11px] font-semibold">
                        <span className="text-[#107C42]">+{fmtMoney(r.incassato)}</span>
                        <span className="text-red-500">−{fmtMoney(r.pagato)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* --- KPI --- */}
            <div className="mb-6 grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-6 lg:gap-4">
              <Kpi icona="savings" tint={VERDE} valore={fmtMoney(kpi.daIncassare)} etichetta="Da incassare" nota="Entrate aperte" />
              <Kpi icona="check_circle" tint={VERDE} valore={fmtMoney(kpi.incassato)} etichetta="Incassato" nota="Già in cassa" />
              <Kpi icona="schedule" tint="#0891B2" valore={fmtMoney(kpi.prossimi30)} etichetta="Prossimi 30 giorni" nota="Entrate in scadenza" />
              <Kpi icona="warning" tint="#EF4444" valore={fmtMoney(kpi.scaduto)} etichetta="Scaduto" nota="In ritardo" />
              <Kpi icona="arrow_downward" tint="#F59E0B" valore={fmtMoney(kpi.daPagare)} etichetta="Da pagare" nota="Uscite aperte" />
              <Kpi icona="account_balance_wallet" tint="#3B82F6" valore={fmtMoney(kpi.saldoPrevisto)} etichetta="Saldo previsto" nota="Entrate − uscite" />
            </div>

            {/* --- Selettore vista + filtri --- */}
            <div className="mb-6 flex flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-between">
              <div className="w-full overflow-x-auto no-scrollbar md:w-auto">
                <Segmented value={vista} onChange={setVista} options={VISTE} accent={VERDE} />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {vista !== 'spese' && (
                  <div className="w-full sm:w-40">
                    <CustomSelect
                      value={filtroTipo}
                      onChange={setFiltroTipo}
                      accent={VERDE}
                      options={[
                        { value: 'tutti', label: 'Tutti i tipi' },
                        { value: 'entrate', label: 'Entrate' },
                        { value: 'uscite', label: 'Uscite' },
                      ]}
                    />
                  </div>
                )}
                {vista === 'titoli' && (
                  <div className="w-full sm:w-44">
                    <CustomSelect
                      value={filtroStato}
                      onChange={setFiltroStato}
                      accent={VERDE}
                      options={[
                        { value: 'tutti', label: 'Tutti gli stati' },
                        { value: 'aperto', label: 'Da saldare' },
                        { value: 'parziale', label: 'Parziale' },
                        { value: 'scaduto', label: 'Scaduto' },
                        { value: 'saldato', label: 'Saldato' },
                      ]}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* --- Vista attiva --- */}
            {vista === 'flusso' && <FlussoView rate={rateFiltrate} />}
            {vista === 'titoli' && (
              <TitoliView
                titoli={titoliFiltrati}
                onSalda={(rata, titolo) => setSaldando({ rata, titolo })}
                onStorna={handleStorna}
                onRiprogramma={setRiprogrammando}
                onElimina={handleElimina}
              />
            )}
            {vista === 'agenda' && (
              <AgendaView
                rate={rateFiltrate}
                onSalda={(rata, titolo) => setSaldando({ rata, titolo })}
                onStorna={handleStorna}
              />
            )}
            {vista === 'spese' && <SpeseView titoli={titoliChiesa} />}
          </>
        )}
      </div>

      {creando && (
        <NuovoMovimentoModal
          onClose={() => setCreando(false)}
          onSave={handleCrea}
          categorie={categorie}
          chiese={chiese}
          /* se stai già guardando una comunità, il modulo parte da quella */
          chiesaPredefinita={chiesaAttiva === 'tutte' ? '' : chiesaAttiva}
        />
      )}
      {saldando && (
        <SaldaRataModal
          rata={saldando.rata}
          titolo={saldando.titolo}
          onClose={() => setSaldando(null)}
          onConfirm={handleSalda}
        />
      )}
      {riprogrammando && (
        <RiprogrammaModal
          titolo={riprogrammando}
          onClose={() => setRiprogrammando(null)}
          onConfirm={handleRiprogramma}
        />
      )}
    </AdminLayout>
  )
}
