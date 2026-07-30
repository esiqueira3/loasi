import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Icon from '../../components/Icon'
import AdminLayout, { PageTitle } from '../components/AdminLayout'
import { toast } from '../components/Toast'
import { useConfirm } from '../components/Confirm'
import {
  BtnGhost,
  BtnPrimary,
  ControlBar,
  CustomSelect,
  EmptyState,
  Field,
  Loading,
  Modal,
  Pagination,
  Panel,
  SetupPanel,
  StatusToggle,
  Table,
  inputClass,
} from '../components/ui'
import { ACCENT, PALETTE_CATEGORIE, tabellaMancante } from '../theme'

const VIOLA = ACCENT.dipartimenti
const PER_PAGINA = 9

const vuoto = { nome: '', descrizione: '', responsabile: '', colore: VIOLA, igreja_id: '', attivo: true }

export default function Dipartimenti() {
  const confirm = useConfirm()

  const [righe, setRighe] = useState([])
  const [chiese, setChiese] = useState([])
  const [loading, setLoading] = useState(true)
  const [setupNeeded, setSetupNeeded] = useState(false)

  const [cerca, setCerca] = useState('')
  const [vista, setVista] = useState(() => localStorage.getItem('loasi.dipartimenti.vista') || 'griglia')
  const [pagina, setPagina] = useState(1)

  const [modale, setModale] = useState(false)
  const [inModifica, setInModifica] = useState(null)
  const [form, setForm] = useState(vuoto)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    localStorage.setItem('loasi.dipartimenti.vista', vista)
  }, [vista])

  useEffect(() => {
    setPagina(1)
  }, [cerca])

  useEffect(() => {
    carica()
  }, [])

  async function carica() {
    setLoading(true)

    const { data, error } = await supabase
      .from('dipartimenti')
      .select('*, chiesa:igrejas(id, cidade)')
      .order('nome')

    if (error) {
      if (tabellaMancante(error)) setSetupNeeded(true)
      else toast.error(`Errore nel caricamento: ${error.message}`)
      setRighe([])
    } else {
      setSetupNeeded(false)
      setRighe(data || [])
    }

    const { data: ch } = await supabase.from('igrejas').select('id, cidade').order('cidade')
    setChiese(ch || [])
    setLoading(false)
  }

  const apriNuovo = () => {
    setInModifica(null)
    setForm(vuoto)
    setModale(true)
  }

  const apriModifica = (r) => {
    setInModifica(r)
    setForm({
      nome: r.nome || '',
      descrizione: r.descrizione || '',
      responsabile: r.responsabile || '',
      colore: r.colore || VIOLA,
      igreja_id: r.igreja_id || '',
      attivo: r.attivo !== false,
    })
    setModale(true)
  }

  const salva = async (e) => {
    e.preventDefault()
    if (!form.nome.trim()) return toast.error('Indica il nome del dipartimento.')

    setSalvando(true)
    const payload = {
      nome: form.nome.trim(),
      descrizione: form.descrizione.trim() || null,
      responsabile: form.responsabile.trim() || null,
      colore: form.colore,
      igreja_id: form.igreja_id || null,
      attivo: form.attivo,
    }

    const { error } = inModifica
      ? await supabase.from('dipartimenti').update(payload).eq('id', inModifica.id)
      : await supabase.from('dipartimenti').insert([payload])

    setSalvando(false)
    if (error) return toast.error(`Errore nel salvataggio: ${error.message}`)

    toast.success(inModifica ? 'Dipartimento aggiornato.' : 'Dipartimento creato.')
    setModale(false)
    carica()
  }

  const elimina = async (r) => {
    const ok = await confirm({
      titolo: 'Eliminare il dipartimento?',
      messaggio: `"${r.nome}" sarà rimosso. I membri collegati restano registrati, ma senza dipartimento.`,
      testoConferma: 'Sì, elimina',
      intent: 'danger',
    })
    if (!ok) return

    const { error } = await supabase.from('dipartimenti').delete().eq('id', r.id)
    if (error) return toast.error(`Errore: ${error.message}`)
    toast.success('Dipartimento eliminato.')
    setRighe((prev) => prev.filter((x) => x.id !== r.id))
  }

  const alternaStato = async (r) => {
    const nuovo = r.attivo === false
    const { error } = await supabase.from('dipartimenti').update({ attivo: nuovo }).eq('id', r.id)
    if (error) return toast.error(`Errore: ${error.message}`)
    setRighe((prev) => prev.map((x) => (x.id === r.id ? { ...x, attivo: nuovo } : x)))
  }

  const filtrate = useMemo(() => {
    const q = cerca.trim().toLowerCase()
    if (!q) return righe
    return righe.filter(
      (r) =>
        r.nome?.toLowerCase().includes(q) ||
        r.responsabile?.toLowerCase().includes(q) ||
        r.descrizione?.toLowerCase().includes(q)
    )
  }, [righe, cerca])

  const totalePagine = Math.max(1, Math.ceil(filtrate.length / PER_PAGINA))
  const visibili =
    vista === 'griglia' ? filtrate.slice((pagina - 1) * PER_PAGINA, pagina * PER_PAGINA) : filtrate

  const colonne = [
    {
      key: 'nome',
      label: 'Nome',
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: r.colore || VIOLA }} />
          <span className="font-bold text-ink">{r.nome}</span>
        </div>
      ),
    },
    { key: 'responsabile', label: 'Responsabile', render: (r) => r.responsabile || '—' },
    { key: 'chiesa', label: 'Comunità', render: (r) => r.chiesa?.cidade || 'Tutte' },
    {
      key: 'attivo',
      label: 'Stato',
      render: (r) => <StatusToggle attivo={r.attivo !== false} onToggle={() => alternaStato(r)} />,
    },
  ]

  return (
    <AdminLayout modulo="Dipartimenti" titolo="Dipartimenti" icona="diversity_3" accent={VIOLA}>
      <div className="mx-auto max-w-[1400px]">
        <PageTitle
          titolo="Dipartimenti"
          sottotitolo="Gruppi, ministeri e servizi della chiesa, con i rispettivi responsabili."
        >
          {!setupNeeded && !loading && (
            <BtnPrimary onClick={apriNuovo}>
              <Icon name="add" className="text-[18px]" />
              Nuovo dipartimento
            </BtnPrimary>
          )}
        </PageTitle>

        {loading ? (
          <Loading testo="Caricamento dipartimenti…" accent={VIOLA} />
        ) : setupNeeded ? (
          <SetupPanel tabelle={['dipartimenti']} script="supabase_gestionale.sql" />
        ) : (
          <>
            <ControlBar
              valore={cerca}
              onCerca={setCerca}
              placeholder="Cerca per nome, responsabile o descrizione…"
              vista={vista}
              onVista={setVista}
              conteggio={filtrate.length}
              etichettaConteggio={filtrate.length === 1 ? 'dipartimento' : 'dipartimenti'}
              accent={VIOLA}
            />

            {filtrate.length === 0 ? (
              <Panel padding={false}>
                <EmptyState
                  icona="diversity_3"
                  titolo={cerca ? 'Nessun risultato' : 'Nessun dipartimento'}
                  testo={
                    cerca
                      ? 'Prova a cambiare i termini di ricerca.'
                      : 'Crea i dipartimenti della chiesa per organizzare i servizi e le persone.'
                  }
                >
                  {!cerca && (
                    <BtnPrimary onClick={apriNuovo}>
                      <Icon name="add" className="text-[18px]" />
                      Crea dipartimento
                    </BtnPrimary>
                  )}
                </EmptyState>
              </Panel>
            ) : vista === 'lista' ? (
              <Table colonne={colonne} righe={filtrate} onModifica={apriModifica} onElimina={elimina} />
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {visibili.map((r) => {
                    const colore = r.colore || VIOLA
                    return (
                      <article
                        key={r.id}
                        className="group relative overflow-hidden rounded-2xl border border-hairline bg-surface-pearl p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                      >
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20"
                          style={{ backgroundColor: colore }}
                        />

                        <div className="relative">
                          <div className="flex items-start justify-between">
                            <div
                              className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg"
                              style={{ background: `linear-gradient(135deg, ${colore}, ${colore}CC)` }}
                            >
                              <Icon name="hub" className="text-[28px]" />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => apriModifica(r)}
                                aria-label="Modifica"
                                title="Modifica"
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-hairline text-ink-muted-80 transition-all hover:bg-canvas-parchment hover:text-ink active:scale-90"
                              >
                                <Icon name="edit" className="text-[17px]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => elimina(r)}
                                aria-label="Elimina"
                                title="Elimina"
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/30 text-red-500 transition-all hover:bg-red-500/10 active:scale-90"
                              >
                                <Icon name="delete" className="text-[17px]" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-5">
                            <span className="mb-1 block text-[9.5px] font-black uppercase tracking-widest text-ink-muted-48">
                              {r.chiesa?.cidade || 'Tutte le comunità'}
                            </span>
                            <h3 className="text-[19px] font-bold leading-tight text-ink">{r.nome}</h3>
                            {r.descrizione && (
                              <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink-muted-80">
                                {r.descrizione}
                              </p>
                            )}
                          </div>

                          <div className="mt-5 space-y-3 border-t border-hairline pt-4">
                            <div className="flex items-center gap-2 text-ink-muted-80">
                              <Icon name="person" className="text-[17px] opacity-60" />
                              <span className="truncate text-[12.5px] font-semibold">
                                {r.responsabile || 'Nessun responsabile'}
                              </span>
                            </div>
                            <StatusToggle attivo={r.attivo !== false} onToggle={() => alternaStato(r)} />
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>

                <Pagination currentPage={pagina} totalPages={totalePagine} onPageChange={setPagina} />
              </>
            )}
          </>
        )}
      </div>

      {modale && (
        <Modal
          onClose={() => setModale(false)}
          titolo={inModifica ? 'Modifica dipartimento' : 'Nuovo dipartimento'}
          sottotitolo="Nome, responsabile e comunità di riferimento"
          icona="diversity_3"
          accent={VIOLA}
        >
          <form onSubmit={salva} className="flex flex-col gap-4">
            <div className="max-h-[65vh] overflow-y-auto pr-1 space-y-4">
              <Field label="Nome del dipartimento" obbligatorio>
                <input
                  type="text"
                  required
                  autoFocus
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Es.: Corale, Scuola domenicale, Gruppo giovani…"
                  className={inputClass}
                />
              </Field>

              <Field label="Descrizione">
                <textarea
                  rows={2}
                  value={form.descrizione}
                  onChange={(e) => setForm((f) => ({ ...f, descrizione: e.target.value }))}
                  placeholder="A cosa serve questo dipartimento"
                  className={`${inputClass} resize-none`}
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Responsabile">
                  <input
                    type="text"
                    value={form.responsabile}
                    onChange={(e) => setForm((f) => ({ ...f, responsabile: e.target.value }))}
                    placeholder="Nome e cognome"
                    className={inputClass}
                  />
                </Field>

                <Field label="Comunità">
                  <CustomSelect
                    value={form.igreja_id}
                    onChange={(v) => setForm((f) => ({ ...f, igreja_id: v }))}
                    accent={VIOLA}
                    options={[
                      { value: '', label: 'Tutte le comunità' },
                      ...chiese.map((c) => ({ value: c.id, label: c.cidade })),
                    ]}
                  />
                </Field>
              </div>

              <Field label="Colore">
                <div className="flex flex-wrap items-center gap-2">
                  {PALETTE_CATEGORIE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, colore: c }))}
                      aria-label={`Colore ${c}`}
                      className="flex h-7 w-7 items-center justify-center rounded-lg transition-transform hover:scale-110"
                      style={{ backgroundColor: c }}
                    >
                      {form.colore === c && <Icon name="check" className="text-[14px] text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </Field>

              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={form.attivo}
                  onChange={(e) => setForm((f) => ({ ...f, attivo: e.target.checked }))}
                  className="h-4 w-4 accent-[#7C3AED]"
                />
                <span className="text-[13px] font-semibold text-ink">Dipartimento attivo</span>
              </label>
            </div>

            <div className="mt-2 flex justify-end gap-2 border-t border-hairline pt-3">
              <BtnGhost type="button" onClick={() => setModale(false)}>
                Annulla
              </BtnGhost>
              <button
                type="submit"
                disabled={salvando}
                style={{ backgroundColor: VIOLA }}
                className="flex items-center gap-2 rounded-xl px-5 py-2 text-[13px] font-bold text-white transition-all hover:brightness-110 disabled:opacity-50"
              >
                <Icon
                  name={salvando ? 'progress_activity' : 'check'}
                  className={`text-[16px] ${salvando ? 'animate-spin' : ''}`}
                />
                Salva
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AdminLayout>
  )
}
