import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Icon from '../../components/Icon'
import AdminLayout, { PageTitle } from '../components/AdminLayout'
import { toast } from '../components/Toast'
import { useConfirm } from '../components/Confirm'
import {
  BtnGhost,
  BtnPrimary,
  EmptyState,
  Field,
  Loading,
  Modal,
  Panel,
  Segmented,
  SetupPanel,
  inputClass,
} from '../components/ui'
import { ACCENT, PALETTE_CATEGORIE, tabellaMancante } from '../theme'

const VERDE = ACCENT.finanze

export default function Categorie() {
  const confirm = useConfirm()

  const [categorie, setCategorie] = useState([])
  const [loading, setLoading] = useState(true)
  const [setupNeeded, setSetupNeeded] = useState(false)
  const [filtro, setFiltro] = useState('tutte')

  const [modaleAperta, setModaleAperta] = useState(false)
  const [inModifica, setInModifica] = useState(null)
  const [form, setForm] = useState({ nome: '', tipo: 'uscita', colore: VERDE })
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    carica()
  }, [])

  async function carica() {
    setLoading(true)
    const { data, error } = await supabase
      .from('categorie_finanziarie')
      .select('*')
      .order('tipo', { ascending: true })
      .order('nome', { ascending: true })

    if (error) {
      if (tabellaMancante(error)) setSetupNeeded(true)
      else toast.error(`Errore nel caricamento: ${error.message}`)
      setCategorie([])
    } else {
      setSetupNeeded(false)
      setCategorie(data || [])
    }
    setLoading(false)
  }

  const apriNuova = (tipo = 'uscita') => {
    setInModifica(null)
    setForm({ nome: '', tipo, colore: tipo === 'uscita' ? '#EF4444' : VERDE })
    setModaleAperta(true)
  }

  const apriModifica = (cat) => {
    setInModifica(cat)
    setForm({ nome: cat.nome, tipo: cat.tipo, colore: cat.colore || VERDE })
    setModaleAperta(true)
  }

  const salva = async (e) => {
    e.preventDefault()
    if (!form.nome.trim()) {
      toast.error('Indica il nome della categoria.')
      return
    }

    setSalvando(true)
    const payload = { nome: form.nome.trim(), tipo: form.tipo, colore: form.colore }

    const { error } = inModifica
      ? await supabase.from('categorie_finanziarie').update(payload).eq('id', inModifica.id)
      : await supabase.from('categorie_finanziarie').insert([payload])

    setSalvando(false)

    if (error) {
      toast.error(`Errore nel salvataggio: ${error.message}`)
      return
    }

    toast.success(inModifica ? 'Categoria aggiornata.' : 'Categoria creata.')
    setModaleAperta(false)
    carica()
  }

  const elimina = async (cat) => {
    const ok = await confirm({
      titolo: 'Eliminare la categoria?',
      messaggio: `La categoria "${cat.nome}" sarà rimossa. I movimenti già registrati restano salvati, ma senza categoria.`,
      testoConferma: 'Sì, elimina',
      intent: 'danger',
    })
    if (!ok) return

    const { error } = await supabase.from('categorie_finanziarie').delete().eq('id', cat.id)
    if (error) toast.error(`Errore: ${error.message}`)
    else {
      toast.success('Categoria rimossa.')
      carica()
    }
  }

  const filtrate = useMemo(
    () => (filtro === 'tutte' ? categorie : categorie.filter((c) => c.tipo === filtro)),
    [categorie, filtro]
  )

  const nUscite = categorie.filter((c) => c.tipo === 'uscita').length
  const nEntrate = categorie.filter((c) => c.tipo === 'entrata').length

  return (
    <AdminLayout titolo="Categorie finanziarie" icona="category" accent={VERDE}>
      <div className="mx-auto max-w-[1200px]">
        <PageTitle
          titolo="Categorie"
          sottotitolo="Crea e personalizza le categorie di entrate e uscite del modulo finanziario."
        >
          {!setupNeeded && (
            <BtnPrimary accent={VERDE} onClick={() => apriNuova('uscita')}>
              <Icon name="add" className="text-[18px]" />
              Nuova categoria
            </BtnPrimary>
          )}
        </PageTitle>

        {loading ? (
          <Loading testo="Caricamento categorie…" />
        ) : setupNeeded ? (
          <SetupPanel tabelle={['categorie_finanziarie']} script="supabase_gestionale.sql" />
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <Segmented
                value={filtro}
                onChange={setFiltro}
                accent={VERDE}
                options={[
                  { value: 'tutte', label: `Tutte (${categorie.length})` },
                  { value: 'uscita', label: `Uscite (${nUscite})`, icon: 'arrow_downward' },
                  { value: 'entrata', label: `Entrate (${nEntrate})`, icon: 'arrow_upward' },
                ]}
              />
            </div>

            <Panel padding={false}>
              {filtrate.length === 0 ? (
                <EmptyState
                  icona="sell"
                  titolo="Nessuna categoria trovata"
                  testo="Aggiungi la prima categoria per organizzare entrate e uscite."
                >
                  <BtnPrimary accent={VERDE} onClick={() => apriNuova('uscita')}>
                    <Icon name="add" className="text-[18px]" />
                    Aggiungi categoria
                  </BtnPrimary>
                </EmptyState>
              ) : (
                <div className="divide-y divide-hairline">
                  {filtrate.map((cat) => {
                    const uscita = cat.tipo === 'uscita'
                    return (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-canvas-parchment/60 lg:px-6"
                      >
                        <div className="flex min-w-0 items-center gap-3.5">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                            style={{ backgroundColor: cat.colore || (uscita ? '#EF4444' : VERDE) }}
                          >
                            <Icon name="sell" className="text-[17px]" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-[15px] font-bold text-ink">{cat.nome}</div>
                            <div className="mt-0.5 flex items-center gap-1 text-[12px]">
                              <span
                                className="flex items-center gap-1 font-semibold"
                                style={{ color: uscita ? '#EF4444' : VERDE }}
                              >
                                <Icon
                                  name={uscita ? 'arrow_downward' : 'arrow_upward'}
                                  className="text-[13px]"
                                />
                                {uscita ? 'Uscita' : 'Entrata'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => apriModifica(cat)}
                            title="Modifica categoria"
                            aria-label={`Modifica ${cat.nome}`}
                            className="rounded-lg border border-hairline p-2 text-ink-muted-80 transition-all hover:bg-canvas-parchment hover:text-ink"
                          >
                            <Icon name="edit" className="text-[16px]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => elimina(cat)}
                            title="Elimina categoria"
                            aria-label={`Elimina ${cat.nome}`}
                            className="rounded-lg border border-red-500/30 p-2 text-red-500 transition-all hover:bg-red-500/10"
                          >
                            <Icon name="delete" className="text-[16px]" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Panel>
          </>
        )}
      </div>

      {modaleAperta && (
        <Modal
          onClose={() => setModaleAperta(false)}
          titolo={inModifica ? 'Modifica categoria' : 'Nuova categoria'}
          sottotitolo="Nome, tipo e colore dell'etichetta"
          icona="sell"
          accent={VERDE}
        >
          <form onSubmit={salva} className="flex flex-col gap-4">
            <Field label="Nome della categoria" obbligatorio>
              <input
                type="text"
                required
                autoFocus
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Es.: Decime, Offerte, Affitto, Utenze…"
                className={inputClass}
              />
            </Field>

            <Field label="Tipo di movimento" obbligatorio>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { tipo: 'uscita', label: 'Uscita', icona: 'arrow_downward', colore: '#EF4444' },
                  { tipo: 'entrata', label: 'Entrata', icona: 'arrow_upward', colore: VERDE },
                ].map((o) => {
                  const attivo = form.tipo === o.tipo
                  return (
                    <button
                      key={o.tipo}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, tipo: o.tipo }))}
                      className="flex items-center justify-center gap-1.5 rounded-xl border py-2 text-[13px] font-bold transition-all"
                      style={
                        attivo
                          ? { borderColor: o.colore, backgroundColor: `${o.colore}15`, color: o.colore }
                          : undefined
                      }
                    >
                      <span className={attivo ? '' : 'text-ink-muted-80'}>
                        <Icon name={o.icona} className="text-[15px]" />
                      </span>
                      <span className={attivo ? '' : 'text-ink-muted-80'}>{o.label}</span>
                    </button>
                  )
                })}
              </div>
            </Field>

            <Field label="Colore dell'etichetta">
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

            <div className="mt-4 flex justify-end gap-2 border-t border-hairline pt-3">
              <BtnGhost type="button" onClick={() => setModaleAperta(false)}>
                Annulla
              </BtnGhost>
              <button
                type="submit"
                disabled={salvando}
                style={{ backgroundColor: VERDE }}
                className="flex items-center gap-2 rounded-xl px-5 py-2 text-[13px] font-bold text-white transition-all hover:brightness-110 disabled:opacity-50"
              >
                <Icon name={salvando ? 'progress_activity' : 'check'} className={`text-[16px] ${salvando ? 'animate-spin' : ''}`} />
                Salva
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AdminLayout>
  )
}
