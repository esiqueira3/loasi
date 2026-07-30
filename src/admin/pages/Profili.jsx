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
  SetupPanel,
  inputClass,
} from '../components/ui'
import { ACCENT, LIVELLI, MODULI, PALETTE_CATEGORIE, tabellaMancante } from '../theme'

const ROSA = ACCENT.utenti

const permessiVuoti = () => Object.fromEntries(MODULI.map((m) => [m.nome, m.nome === 'Home' ? 'completo' : 'nessuno']))

const vuoto = { nome: '', descrizione: '', colore: ROSA, permessi: permessiVuoti() }

export default function Profili() {
  const confirm = useConfirm()

  const [profili, setProfili] = useState([])
  const [conteggi, setConteggi] = useState({})
  const [loading, setLoading] = useState(true)
  const [setupNeeded, setSetupNeeded] = useState(false)

  const [modale, setModale] = useState(false)
  const [inModifica, setInModifica] = useState(null)
  const [form, setForm] = useState(vuoto)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    carica()
  }, [])

  async function carica() {
    setLoading(true)

    const { data, error } = await supabase.from('profili').select('*').order('sistema', { ascending: false }).order('nome')

    if (error) {
      if (tabellaMancante(error)) setSetupNeeded(true)
      else toast.error(`Errore nel caricamento: ${error.message}`)
      setProfili([])
      setLoading(false)
      return
    }

    setSetupNeeded(false)
    setProfili(data || [])

    const { data: utenti } = await supabase.from('utenti').select('profilo_id')
    const mappa = {}
    ;(utenti || []).forEach((u) => {
      if (u.profilo_id) mappa[u.profilo_id] = (mappa[u.profilo_id] || 0) + 1
    })
    setConteggi(mappa)
    setLoading(false)
  }

  const apriNuovo = () => {
    setInModifica(null)
    setForm(vuoto)
    setModale(true)
  }

  const apriModifica = (p) => {
    setInModifica(p)
    setForm({
      nome: p.nome || '',
      descrizione: p.descrizione || '',
      colore: p.colore || ROSA,
      permessi: { ...permessiVuoti(), ...(p.permessi || {}) },
    })
    setModale(true)
  }

  const salva = async (e) => {
    e.preventDefault()
    if (!form.nome.trim()) return toast.error('Indica il nome del profilo.')

    setSalvando(true)
    const payload = {
      nome: form.nome.trim(),
      descrizione: form.descrizione.trim() || null,
      colore: form.colore,
      permessi: form.permessi,
      updated_at: new Date().toISOString(),
    }

    const { error } = inModifica
      ? await supabase.from('profili').update(payload).eq('id', inModifica.id)
      : await supabase.from('profili').insert([payload])

    setSalvando(false)
    if (error) {
      const messaggio = error.message?.includes('duplicate')
        ? 'Esiste già un profilo con questo nome.'
        : `Errore nel salvataggio: ${error.message}`
      return toast.error(messaggio)
    }

    toast.success(inModifica ? 'Profilo aggiornato.' : 'Profilo creato.')
    setModale(false)
    carica()
  }

  const elimina = async (p) => {
    const inUso = conteggi[p.id] || 0
    const ok = await confirm({
      titolo: 'Eliminare il profilo?',
      messaggio: inUso
        ? `"${p.nome}" è assegnato a ${inUso} ${inUso === 1 ? 'utente' : 'utenti'}. Eliminandolo, ${
            inUso === 1 ? 'quella persona resterà' : 'quelle persone resteranno'
          } senza profilo e — finché non gliene assegni un altro — con accesso completo.`
        : `"${p.nome}" sarà rimosso definitivamente.`,
      testoConferma: 'Sì, elimina',
      intent: 'danger',
    })
    if (!ok) return

    const { error } = await supabase.from('profili').delete().eq('id', p.id)
    if (error) return toast.error(`Errore: ${error.message}`)
    toast.success('Profilo eliminato.')
    carica()
  }

  const setLivello = (modulo, livello) =>
    setForm((f) => ({ ...f, permessi: { ...f.permessi, [modulo]: livello } }))

  const applicaATutti = (livello) =>
    setForm((f) => ({ ...f, permessi: Object.fromEntries(MODULI.map((m) => [m.nome, livello])) }))

  const riepilogo = (p) => {
    const perm = p.permessi || {}
    if (p.sistema) return { completo: MODULI.length, lettura: 0, nessuno: 0 }
    return MODULI.reduce(
      (acc, m) => {
        const l = perm[m.nome] || 'nessuno'
        acc[l] = (acc[l] || 0) + 1
        return acc
      },
      { completo: 0, lettura: 0, nessuno: 0 }
    )
  }

  return (
    <AdminLayout modulo="Utenti" titolo="Profili di accesso" icona="shield_person" accent={ROSA}>
      <div className="mx-auto max-w-[1200px]">
        <PageTitle
          titolo="Profili di accesso"
          sottotitolo="Definisci che cosa può vedere e modificare ogni tipo di utente, sezione per sezione."
        >
          {!setupNeeded && !loading && (
            <BtnPrimary accent={ROSA} onClick={apriNuovo}>
              <Icon name="add" className="text-[18px]" />
              Nuovo profilo
            </BtnPrimary>
          )}
        </PageTitle>

        {/* Nota onesta su cosa protegge davvero */}
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-50 p-4">
          <Icon name="info" className="mt-0.5 shrink-0 text-[20px] text-amber-600" />
          <p className="text-[13px] leading-relaxed text-amber-900">
            I profili governano <strong>ciò che si vede nel gestionale</strong>: voci di menu e pulsanti di modifica.
            Non sono ancora una barriera a livello di database, dove ogni persona autenticata può comunque leggere i
            dati. Usali per organizzare il lavoro fra collaboratori di fiducia.
          </p>
        </div>

        {loading ? (
          <Loading testo="Caricamento profili…" accent={ROSA} />
        ) : setupNeeded ? (
          <SetupPanel tabelle={['profili', 'utenti']} script="supabase_utenti.sql" />
        ) : profili.length === 0 ? (
          <Panel padding={false}>
            <EmptyState icona="shield_person" titolo="Nessun profilo" testo="Crea il primo profilo di accesso.">
              <BtnPrimary accent={ROSA} onClick={apriNuovo}>
                <Icon name="add" className="text-[18px]" />
                Crea profilo
              </BtnPrimary>
            </EmptyState>
          </Panel>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {profili.map((p) => {
              const r = riepilogo(p)
              const nUtenti = conteggi[p.id] || 0
              return (
                <article
                  key={p.id}
                  className="overflow-hidden rounded-2xl border border-hairline bg-surface-pearl shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3 border-b border-hairline p-5">
                    <div className="flex min-w-0 items-start gap-3.5">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
                        style={{ backgroundColor: p.colore || ROSA }}
                      >
                        <Icon name={p.sistema ? 'workspace_premium' : 'shield_person'} className="text-[22px]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[17px] font-bold text-ink">{p.nome}</h3>
                          {p.sistema && (
                            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-widest text-amber-700">
                              Sistema
                            </span>
                          )}
                        </div>
                        {p.descrizione && (
                          <p className="mt-1 text-[12.5px] leading-snug text-ink-muted-80">{p.descrizione}</p>
                        )}
                        <p className="mt-1.5 flex items-center gap-1 text-[11.5px] font-semibold text-ink-muted-48">
                          <Icon name="group" className="text-[14px]" />
                          {nUtenti} {nUtenti === 1 ? 'utente' : 'utenti'}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => apriModifica(p)}
                        aria-label="Modifica"
                        title={p.sistema ? 'Il profilo di sistema vede tutto' : 'Modifica'}
                        className="rounded-lg border border-hairline p-2 text-ink-muted-80 transition-all hover:bg-canvas-parchment hover:text-ink"
                      >
                        <Icon name="edit" className="text-[16px]" />
                      </button>
                      {!p.sistema && (
                        <button
                          type="button"
                          onClick={() => elimina(p)}
                          aria-label="Elimina"
                          title="Elimina"
                          className="rounded-lg border border-red-500/30 p-2 text-red-500 transition-all hover:bg-red-500/10"
                        >
                          <Icon name="delete" className="text-[16px]" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Riepilogo dei livelli */}
                  <div className="flex flex-wrap gap-2 border-b border-hairline px-5 py-3">
                    {LIVELLI.map((l) => (
                      <span
                        key={l.key}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold"
                        style={{ color: l.colore, backgroundColor: `${l.colore}12` }}
                      >
                        <Icon name={l.icona} className="text-[13px]" />
                        {r[l.key] || 0}
                      </span>
                    ))}
                  </div>

                  <ul className="divide-y divide-hairline">
                    {MODULI.map((m) => {
                      const livello = p.sistema ? 'completo' : p.permessi?.[m.nome] || 'nessuno'
                      const meta = LIVELLI.find((l) => l.key === livello)
                      return (
                        <li key={m.nome} className="flex items-center justify-between gap-3 px-5 py-2.5">
                          <span className="flex items-center gap-2.5 text-[13px] font-semibold text-ink">
                            <Icon name={m.icona} className="text-[17px] text-ink-muted-48" />
                            {m.nome}
                          </span>
                          <span
                            className="flex shrink-0 items-center gap-1.5 text-[11.5px] font-bold"
                            style={{ color: meta.colore }}
                          >
                            <Icon name={meta.icona} className="text-[14px]" />
                            {meta.label}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {modale && (
        <Modal
          onClose={() => setModale(false)}
          larghezza="max-w-2xl"
          titolo={inModifica ? `Modifica ${inModifica.nome}` : 'Nuovo profilo'}
          sottotitolo="Livello di accesso per ogni sezione del gestionale"
          icona="shield_person"
          accent={ROSA}
        >
          <form onSubmit={salva} className="flex flex-col gap-4">
            {inModifica?.sistema && (
              <div className="rounded-xl border-l-4 border-amber-500 bg-amber-50 p-3 text-[12.5px] font-semibold text-amber-800">
                Questo è il profilo di sistema: vede sempre tutto, indipendentemente da ciò che imposti qui.
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome del profilo" obbligatorio>
                <input
                  type="text"
                  required
                  autoFocus
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Es.: Segreteria, Tesoriere…"
                  className={inputClass}
                />
              </Field>
              <Field label="Colore">
                <div className="flex flex-wrap items-center gap-2 pt-1.5">
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
            </div>

            <Field label="Descrizione">
              <input
                type="text"
                value={form.descrizione}
                onChange={(e) => setForm((f) => ({ ...f, descrizione: e.target.value }))}
                placeholder="A chi è destinato questo profilo"
                className={inputClass}
              />
            </Field>

            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <label className="text-[12px] font-bold text-ink-muted-80">Permessi per sezione</label>
                <div className="flex gap-1.5">
                  {LIVELLI.map((l) => (
                    <button
                      key={l.key}
                      type="button"
                      onClick={() => applicaATutti(l.key)}
                      className="rounded-lg border border-hairline px-2.5 py-1 text-[10.5px] font-bold text-ink-muted-48 transition-colors hover:text-ink"
                      title={`Applica "${l.label}" a tutte le sezioni`}
                    >
                      Tutto: {l.label.split(' ')[0].toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {MODULI.map((m) => {
                  const livello = form.permessi[m.nome] || 'nessuno'
                  return (
                    <div
                      key={m.nome}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-canvas-parchment p-3"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Icon name={m.icona} className="shrink-0 text-[19px] text-ink-muted-48" />
                        <div className="min-w-0">
                          <div className="text-[13.5px] font-bold text-ink">{m.nome}</div>
                          <div className="truncate text-[11.5px] text-ink-muted-48">{m.descrizione}</div>
                        </div>
                      </div>

                      <div className="flex rounded-lg border border-hairline bg-surface-pearl p-0.5">
                        {LIVELLI.map((l) => {
                          const attivo = livello === l.key
                          return (
                            <button
                              key={l.key}
                              type="button"
                              onClick={() => setLivello(m.nome, l.key)}
                              title={l.label}
                              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-bold transition-all ${
                                attivo ? 'text-white' : 'text-ink-muted-48 hover:text-ink'
                              }`}
                              style={attivo ? { backgroundColor: l.colore } : undefined}
                            >
                              <Icon name={l.icona} className="text-[14px]" />
                              <span className="hidden sm:inline">{l.label.split(' ')[0]}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-2 flex justify-end gap-2 border-t border-hairline pt-3">
              <BtnGhost type="button" onClick={() => setModale(false)}>
                Annulla
              </BtnGhost>
              <button
                type="submit"
                disabled={salvando}
                style={{ backgroundColor: ROSA }}
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
