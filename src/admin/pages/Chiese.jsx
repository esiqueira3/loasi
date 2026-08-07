import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { eliminaPerId } from '../lib/db'
import { deleteImageFromStorage, uploadImageToStorage } from '../../lib/r2'
import Icon from '../../components/Icon'
import AdminLayout, { PageTitle } from '../components/AdminLayout'
import { toast } from '../components/Toast'
import { useConfirm } from '../components/Confirm'
import {
  BtnGhost,
  BtnPrimary,
  ControlBar,
  EmptyState,
  Field,
  Loading,
  Modal,
  Panel,
  Table,
  inputClass,
} from '../components/ui'
import { ACCENT } from '../theme'

const AZZURRO = ACCENT.chiese

const vuoto = {
  slug: '',
  nome: '',
  cidade: '',
  referente: '',
  endereco: '',
  telefone: '',
  email: '',
  link_maps: '',
  horarios_culto: '',
  foto_capa_url: '',
}

/** Genera uno slug sicuro per l'URL pubblico: "L'Oasi Gaeta" → "loasi-gaeta". */
const slugify = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export default function Chiese() {
  const confirm = useConfirm()

  const [righe, setRighe] = useState([])
  const [loading, setLoading] = useState(true)
  const [cerca, setCerca] = useState('')
  const [vista, setVista] = useState(() => localStorage.getItem('loasi.chiese.vista') || 'griglia')

  const [modale, setModale] = useState(false)
  const [inModifica, setInModifica] = useState(null)
  const [form, setForm] = useState(vuoto)
  const [salvando, setSalvando] = useState(false)
  const [caricandoCapa, setCaricandoCapa] = useState(false)

  // --- Stato gestione Collaboratori (Diretoria) ---
  const [chiesaCollaboratori, setChiesaCollaboratori] = useState(null)
  const [modaleFormCollab, setModaleFormCollab] = useState(false)
  const [collaboratori, setCollaboratori] = useState([])
  const [loadingCollab, setLoadingCollab] = useState(false)
  const [salvandoCollab, setSalvandoCollab] = useState(false)
  const [caricandoFotoCollab, setCaricandoFotoCollab] = useState(false)
  const [formCollab, setFormCollab] = useState({ id: null, nome: '', cargo: '', foto_url: '', ordem: 0 })

  useEffect(() => {
    localStorage.setItem('loasi.chiese.vista', vista)
  }, [vista])

  useEffect(() => {
    carica()
  }, [])

  async function carica() {
    setLoading(true)
    const { data, error } = await supabase.from('igrejas').select('*').order('cidade')
    if (error) toast.error(`Errore nel caricamento: ${error.message}`)
    setRighe(data || [])
    setLoading(false)
  }

  // --- Upload Foto Copertina Comunità (Cloudflare R2 / Storage) ---
  const handleUploadFotoCapa = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCaricandoCapa(true)
    try {
      const url = await uploadImageToStorage(file, 'chiese')
      setForm((f) => ({ ...f, foto_capa_url: url }))
      toast.success('Foto di copertina caricata su Cloudflare / Storage!')
    } catch (err) {
      toast.error(`Errore nel caricamento: ${err.message}`)
    } finally {
      setCaricandoCapa(false)
    }
  }

  // --- Funzioni Gestione Collaboratori ---
  const apriCollaboratori = async (chiesa) => {
    setChiesaCollaboratori(chiesa)
    setModaleFormCollab(false)
    setFormCollab({ id: null, nome: '', cargo: '', foto_url: '', ordem: 0 })
    await caricaCollaboratori(chiesa.id)
  }

  const caricaCollaboratori = async (igrejaId) => {
    setLoadingCollab(true)
    const { data, error } = await supabase
      .from('diretoria')
      .select('*')
      .eq('igreja_id', igrejaId)
      .order('ordem', { ascending: true })

    if (error) toast.error(`Errore caricamento collaboratori: ${error.message}`)
    setCollaboratori(data || [])
    setLoadingCollab(false)
  }

  const handleUploadFotoCollab = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCaricandoFotoCollab(true)
    try {
      const url = await uploadImageToStorage(file, 'collaboratori')
      setFormCollab((f) => ({ ...f, foto_url: url }))
      toast.success('Foto collaboratore caricata su Cloudflare / Storage!')
    } catch (err) {
      toast.error(`Errore caricamento foto: ${err.message}`)
    } finally {
      setCaricandoFotoCollab(false)
    }
  }

  const apriNuovoCollab = () => {
    setFormCollab({ id: null, nome: '', cargo: '', foto_url: '', ordem: collaboratori.length + 1 })
    setModaleFormCollab(true)
  }

  const apriModificaCollab = (c) => {
    setFormCollab({
      id: c.id,
      nome: c.nome || '',
      cargo: c.cargo || '',
      foto_url: c.foto_url || '',
      ordem: c.ordem ?? 0,
    })
    setModaleFormCollab(true)
  }

  const azzeraFormCollab = () => {
    setFormCollab({ id: null, nome: '', cargo: '', foto_url: '', ordem: 0 })
  }

  const salvaCollaboratore = async (e) => {
    e.preventDefault()
    if (!formCollab.nome.trim()) return toast.error('Indica il nome del collaboratore.')
    if (!formCollab.cargo.trim()) return toast.error('Indica la posizione.')

    setSalvandoCollab(true)
    const payload = {
      igreja_id: chiesaCollaboratori.id,
      nome: formCollab.nome.trim(),
      cargo: formCollab.cargo.trim(),
      foto_url: formCollab.foto_url.trim() || null,
      ordem: Number(formCollab.ordem) || 0,
    }

    const { error } = formCollab.id
      ? await supabase.from('diretoria').update(payload).eq('id', formCollab.id)
      : await supabase.from('diretoria').insert([payload])

    setSalvandoCollab(false)

    if (error) {
      return toast.error(`Errore nel salvataggio: ${error.message}`)
    }

    toast.success(formCollab.id ? 'Collaboratore aggiornato.' : 'Collaboratore aggiunto!')
    setModaleFormCollab(false)
    azzeraFormCollab()
    caricaCollaboratori(chiesaCollaboratori.id)
  }

  const eliminaCollaboratore = async (c) => {
    const ok = await confirm({
      titolo: 'Eliminare collaboratore?',
      messaggio: `Sei sicuro di voler eliminare "${c.nome}"? Non apparirà più nella pagina della comunità.`,
      testoConferma: 'Sì, elimina',
      intent: 'danger',
    })
    if (!ok) return

    const { error } = await eliminaPerId('diretoria', c.id)
    if (error) return toast.error(`Errore: ${error.message}`)

    if (c.foto_url) {
      deleteImageFromStorage(c.foto_url)
    }

    toast.success('Collaboratore ed eventuale foto eliminati.')
    caricaCollaboratori(chiesaCollaboratori.id)
  }

  const apriNuova = () => {
    setInModifica(null)
    setForm(vuoto)
    setModale(true)
  }

  const apriModifica = (r) => {
    setInModifica(r)
    setForm({
      slug: r.slug || '',
      nome: r.nome || '',
      cidade: r.cidade || '',
      referente: r.referente || r.responsavel || '',
      endereco: r.endereco || '',
      telefone: r.telefone || '',
      email: r.email || '',
      link_maps: r.link_maps || '',
      horarios_culto: r.horarios_culto || '',
      foto_capa_url: r.foto_capa_url || '',
    })
    setModale(true)
  }

  const salva = async (e) => {
    e.preventDefault()
    if (!form.nome.trim()) return toast.error('Indica il nome della comunità.')
    if (!form.cidade.trim()) return toast.error('Indica la città.')

    const slug = (form.slug.trim() || slugify(form.cidade)).toLowerCase()
    if (!slug) return toast.error("Indica un identificativo valido per l'indirizzo pubblico.")

    setSalvando(true)
    const payload = {
      slug,
      nome: form.nome.trim(),
      cidade: form.cidade.trim(),
      referente: form.referente.trim() || null,
      responsavel: form.referente.trim() || null,
      endereco: form.endereco.trim(),
      telefone: form.telefone.trim() || null,
      email: form.email.trim() || null,
      link_maps: form.link_maps.trim() || null,
      horarios_culto: form.horarios_culto.trim() || null,
      foto_capa_url: form.foto_capa_url.trim() || null,
      updated_at: new Date().toISOString(),
    }

    let { error } = inModifica
      ? await supabase.from('igrejas').update(payload).eq('id', inModifica.id)
      : await supabase.from('igrejas').insert([payload])

    // Fallback automatico se la colonna referente/responsavel non è ancora nella cache dello schema Supabase
    if (error) {
      const fallbackPayload = { ...payload }
      delete fallbackPayload.referente
      delete fallbackPayload.responsavel

      const resFallback = inModifica
        ? await supabase.from('igrejas').update(fallbackPayload).eq('id', inModifica.id)
        : await supabase.from('igrejas').insert([fallbackPayload])

      if (!resFallback.error) {
        toast.warning("Modifiche salvate! Per abilitare il campo Referente esegui il comando SQL: NOTIFY pgrst, 'reload schema';")
        error = null
      }
    }

    setSalvando(false)

    if (error) {
      const messaggio = error.message?.includes('duplicate')
        ? 'Esiste già una comunità con questo identificativo.'
        : `Errore nel salvataggio: ${error.message}`
      return toast.error(messaggio)
    }

    toast.success(inModifica ? 'Comunità aggiornata: il sito è già allineato.' : 'Comunità creata.')
    setModale(false)
    carica()
  }

  const elimina = async (r) => {
    const ok = await confirm({
      titolo: 'Eliminare la comunità?',
      sottotitolo: 'Questa azione cambia il sito pubblico',
      messaggio: `Eliminando "${r.cidade}" la pagina /chiese/${r.slug} smetterà di mostrare i dati aggiornati e spariranno anche le foto e i collaboratori collegati. Il sito continuerà a funzionare con i contenuti di riserva, ma i dati inseriti andranno persi.`,
      testoConferma: 'Sì, elimina',
      intent: 'danger',
    })
    if (!ok) return

    const { error } = await eliminaPerId('igrejas', r.id)
    if (error) return toast.error(`Errore: ${error.message}`)

    if (r.foto_capa_url) {
      deleteImageFromStorage(r.foto_capa_url)
    }

    toast.success('Comunità ed eventuale foto eliminate.')
    setRighe((prev) => prev.filter((x) => x.id !== r.id))
  }

  const filtrate = useMemo(() => {
    const q = cerca.trim().toLowerCase()
    if (!q) return righe
    return righe.filter(
      (r) =>
        r.cidade?.toLowerCase().includes(q) ||
        r.nome?.toLowerCase().includes(q) ||
        r.endereco?.toLowerCase().includes(q)
    )
  }, [righe, cerca])

  const colonne = [
    {
      key: 'cidade',
      label: 'Comunità',
      render: (r) => (
        <div>
          <div className="font-bold text-ink">{r.cidade}</div>
          <div className="truncate text-[12px] text-ink-muted-48">/chiese/{r.slug}</div>
        </div>
      ),
    },
    { key: 'endereco', label: 'Indirizzo', render: (r) => r.endereco || '—' },
    { key: 'telefone', label: 'Telefono', render: (r) => r.telefone || '—' },
    { key: 'email', label: 'E-mail', render: (r) => r.email || '—' },
    {
      key: 'horarios_culto',
      label: 'Orari',
      render: (r) =>
        r.horarios_culto ? (
          <span className="text-[12.5px] text-ink-muted-80">{r.horarios_culto}</span>
        ) : (
          <span className="text-[12px] text-amber-600">Da compilare</span>
        ),
    },
  ]

  return (
    <AdminLayout modulo="Chiese" titolo="Chiese" icona="church" accent={AZZURRO}>
      <div className="mx-auto max-w-[1400px]">
        <PageTitle
          titolo="Chiese"
          sottotitolo="Anagrafica delle comunità: indirizzi, contatti e orari dei culti."
        >
          {!loading && (
            <BtnPrimary onClick={apriNuova}>
              <Icon name="add" className="text-[18px]" />
              Nuova comunità
            </BtnPrimary>
          )}
        </PageTitle>

        {/* Avviso: qui si modifica il sito pubblico */}
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-cyan-500/25 bg-cyan-50 p-4">
          <Icon name="public" className="mt-0.5 shrink-0 text-[20px] text-cyan-700" />
          <p className="text-[13px] leading-relaxed text-cyan-900">
            <strong className="font-bold">Attenzione:</strong> queste informazioni sono pubblicate sul sito. Ogni
            modifica salvata qui è visibile subito ai visitatori nelle pagine delle comunità e nella sezione
            «I nostri indirizzi».
          </p>
        </div>

        {loading ? (
          <Loading testo="Caricamento comunità…" accent={AZZURRO} />
        ) : (
          <>
            <ControlBar
              valore={cerca}
              onCerca={setCerca}
              placeholder="Cerca per città, nome o indirizzo…"
              vista={vista}
              onVista={setVista}
              conteggio={filtrate.length}
              etichettaConteggio={filtrate.length === 1 ? 'comunità' : 'comunità'}
              accent={AZZURRO}
            />

            {filtrate.length === 0 ? (
              <Panel padding={false}>
                <EmptyState
                  icona="church"
                  titolo={cerca ? 'Nessun risultato' : 'Nessuna comunità'}
                  testo={
                    cerca
                      ? 'Prova a cambiare i termini di ricerca.'
                      : 'Aggiungi la prima comunità: comparirà subito sul sito pubblico.'
                  }
                >
                  {!cerca && (
                    <BtnPrimary onClick={apriNuova}>
                      <Icon name="add" className="text-[18px]" />
                      Aggiungi comunità
                    </BtnPrimary>
                  )}
                </EmptyState>
              </Panel>
            ) : vista === 'lista' ? (
              <Table colonne={colonne} righe={filtrate} onModifica={apriModifica} onElimina={elimina} />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtrate.map((r) => (
                  <article
                    key={r.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-hairline bg-surface-pearl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-canvas-parchment">
                      {r.foto_capa_url ? (
                        <img
                          src={r.foto_capa_url}
                          alt={r.cidade}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-ink-muted-48">
                          <Icon name="image" className="text-[36px] opacity-40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <h3 className="text-[20px] font-bold text-white">{r.cidade}</h3>
                        <p className="text-[11px] font-semibold text-white/70">/chiese/{r.slug}</p>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-2.5 p-5 text-[13px] text-ink-muted-80">
                      {(r.referente || r.responsavel) && (
                        <div className="flex items-center gap-2.5">
                          <Icon name="person" className="shrink-0 text-[16px] text-gold-600" />
                          <span className="font-semibold text-ink">{r.referente || r.responsavel}</span>
                        </div>
                      )}
                      {r.endereco && (
                        <div className="flex items-start gap-2.5">
                          <Icon name="location_on" className="mt-0.5 shrink-0 text-[16px] opacity-60" />
                          <span className="leading-snug">{r.endereco}</span>
                        </div>
                      )}
                      {r.telefone && (
                        <div className="flex items-center gap-2.5">
                          <Icon name="call" className="shrink-0 text-[16px] opacity-60" />
                          <span>{r.telefone}</span>
                        </div>
                      )}
                      {r.email && (
                        <div className="flex items-center gap-2.5">
                          <Icon name="mail" className="shrink-0 text-[16px] opacity-60" />
                          <span className="truncate">{r.email}</span>
                        </div>
                      )}
                      <div className="flex items-start gap-2.5">
                        <Icon name="schedule" className="mt-0.5 shrink-0 text-[16px] opacity-60" />
                        {r.horarios_culto ? (
                          <span className="leading-snug">{r.horarios_culto}</span>
                        ) : (
                          <span className="font-semibold text-amber-600">Orari da compilare</span>
                        )}
                      </div>

                      <div className="mt-auto flex flex-col gap-2 border-t border-hairline pt-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => apriModifica(r)}
                            style={{ backgroundColor: AZZURRO }}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-[12.5px] font-bold text-white transition-all hover:brightness-110 active:scale-95 shadow-sm"
                          >
                            <Icon name="edit" className="text-[16px]" />
                            Modifica
                          </button>
                          <a
                            href={`/chiese/${r.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Vedi la pagina pubblica"
                            title="Vedi la pagina pubblica"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-hairline text-ink-muted-80 transition-all hover:bg-canvas-parchment hover:text-ink"
                          >
                            <Icon name="open_in_new" className="text-[16px]" />
                          </a>
                          <button
                            type="button"
                            onClick={() => elimina(r)}
                            aria-label="Elimina"
                            title="Elimina"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-500/30 text-red-500 transition-all hover:bg-red-500/10"
                          >
                            <Icon name="delete" className="text-[16px]" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => apriCollaboratori(r)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-2 text-[12.5px] font-bold text-cyan-800 transition-all hover:bg-cyan-500/20 active:scale-95 shadow-xs"
                        >
                          <Icon name="group" className="text-[16px]" />
                          Collaboratori
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {modale && (
        <Modal
          onClose={() => setModale(false)}
          larghezza="max-w-2xl"
          titolo={inModifica ? `Modifica ${inModifica.cidade}` : 'Nuova comunità'}
          sottotitolo="I dati compaiono sul sito pubblico"
          icona="church"
          accent={AZZURRO}
        >
          <form onSubmit={salva} className="flex flex-col gap-4">
            <div className="max-h-[65vh] overflow-y-auto pr-1 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Città" obbligatorio>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={form.cidade}
                    onChange={(e) => setForm((f) => ({ ...f, cidade: e.target.value }))}
                    placeholder="Es.: Terracina"
                    className={inputClass}
                  />
                </Field>
                <Field
                  label="Identificativo nell'indirizzo"
                  hint={`Pagina pubblica: /chiese/${form.slug || slugify(form.cidade) || '…'}`}
                >
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                    placeholder={slugify(form.cidade) || 'terracina'}
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Nome completo della comunità" obbligatorio>
                <input
                  type="text"
                  required
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Chiesa Cristiana Evangelica L'Oasi — Terracina"
                  className={inputClass}
                />
              </Field>

              <Field label="Referente / Responsabile" hint="Nome della persona referente (es. Stefano Poldi, Patrizia Ronga, Giovanna Smarrazzo)">
                <input
                  type="text"
                  value={form.referente}
                  onChange={(e) => setForm((f) => ({ ...f, referente: e.target.value }))}
                  placeholder="es. Stefano Poldi"
                  className={inputClass}
                />
              </Field>

              <Field label="Indirizzo">
                <input
                  type="text"
                  value={form.endereco}
                  onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))}
                  placeholder="Via, numero — CAP città (provincia)"
                  className={inputClass}
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Telefono">
                  <input
                    type="tel"
                    value={form.telefone}
                    onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
                    className={inputClass}
                  />
                </Field>
                <Field label="E-mail">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field
                label="Orari dei culti"
                hint="Compare in evidenza sulla pagina della comunità. Vai a capo per separare i giorni."
              >
                <textarea
                  rows={2}
                  value={form.horarios_culto}
                  onChange={(e) => setForm((f) => ({ ...f, horarios_culto: e.target.value }))}
                  placeholder="Domenica: ore 10:30 | Mercoledì: ore 19:30"
                  className={`${inputClass} resize-none`}
                />
              </Field>

              <Field label="Link a Google Maps">
                <input
                  type="url"
                  value={form.link_maps}
                  onChange={(e) => setForm((f) => ({ ...f, link_maps: e.target.value }))}
                  placeholder="https://www.google.com/maps/…"
                  className={inputClass}
                />
              </Field>

              <Field label="Foto di copertina (URL o Carica su Cloudflare)" hint="Immagine mostrata sul sito e in questa scheda.">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={form.foto_capa_url}
                    onChange={(e) => setForm((f) => ({ ...f, foto_capa_url: e.target.value }))}
                    placeholder="/images/home-3-610x458.jpg"
                    className={inputClass}
                  />
                  <label className="flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-hairline bg-surface-pearl px-3.5 py-2.5 text-[12.5px] font-bold text-ink transition-all hover:bg-canvas-parchment">
                    <Icon name={caricandoCapa ? 'progress_activity' : 'cloud_upload'} className={`text-[17px] text-cyan-600 ${caricandoCapa ? 'animate-spin' : ''}`} />
                    {caricandoCapa ? 'Caricando...' : 'Carica foto'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadFotoCapa} disabled={caricandoCapa} />
                  </label>
                </div>
              </Field>

              {form.foto_capa_url && (
                <img
                  src={form.foto_capa_url}
                  alt=""
                  className="h-32 w-full rounded-xl border border-hairline object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
            </div>

            <div className="mt-2 flex justify-end gap-2 border-t border-hairline pt-3">
              <BtnGhost type="button" onClick={() => setModale(false)}>
                Annulla
              </BtnGhost>
              <button
                type="submit"
                disabled={salvando}
                style={{ backgroundColor: AZZURRO }}
                className="flex items-center gap-2 rounded-xl px-5 py-2 text-[13px] font-bold text-white transition-all hover:brightness-110 disabled:opacity-50"
              >
                <Icon
                  name={salvando ? 'progress_activity' : 'check'}
                  className={`text-[16px] ${salvando ? 'animate-spin' : ''}`}
                />
                Salva e pubblica
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* --- Modal 1: Lista Collaboratori Registrati --- */}
      {chiesaCollaboratori && !modaleFormCollab && (
        <Modal
          onClose={() => setChiesaCollaboratori(null)}
          larghezza="max-w-3xl"
          titolo={`Collaboratori — ${chiesaCollaboratori.cidade}`}
          sottotitolo="Gestisci i collaboratori e la leadership della comunità visualizzati sul sito pubblico"
          icona="group"
          accent={AZZURRO}
        >
          <div className="flex flex-col gap-6">
            {/* Action Bar with Nuovo Button */}
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h4 className="text-[13px] font-bold uppercase tracking-wider text-ink flex items-center gap-2">
                <Icon name="people" className="text-[18px] text-cyan-600" />
                Collaboratori registrati ({collaboratori.length})
              </h4>
              <button
                type="button"
                onClick={apriNuovoCollab}
                style={{ backgroundColor: AZZURRO }}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-[12.5px] font-bold text-white transition-all hover:brightness-110 active:scale-95 shadow-sm"
              >
                <Icon name="add" className="text-[17px]" />
                Nuovo
              </button>
            </div>

            {/* List of Registered Collaborators */}
            {loadingCollab ? (
              <Loading testo="Caricamento collaboratori in corso…" accent={AZZURRO} />
            ) : collaboratori.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-hairline p-8 text-center text-ink-muted-48">
                <Icon name="person_off" className="mx-auto text-[32px] opacity-40 mb-2" />
                <p className="text-[13.5px] font-medium">Nessun collaboratore registrato per questa comunità.</p>
                <button
                  type="button"
                  onClick={apriNuovoCollab}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-[12.5px] font-bold text-cyan-800 transition-all hover:bg-cyan-500/20 active:scale-95"
                >
                  <Icon name="add" className="text-[16px]" />
                  Aggiungi collaboratore
                </button>
              </div>
            ) : (
              <div className="grid gap-3.5 sm:grid-cols-2">
                {collaboratori.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-hairline bg-surface-card p-4 shadow-xs transition-all hover:border-cyan-500/30 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {c.foto_url ? (
                        <img
                          src={c.foto_url}
                          alt={c.nome}
                          className="h-12 w-12 shrink-0 rounded-full border border-hairline object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-800 font-bold text-[16px]">
                          {c.nome.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h5 className="font-bold text-[14.5px] text-ink truncate">{c.nome}</h5>
                        <p className="text-[12.5px] font-semibold text-cyan-700 truncate">{c.cargo}</p>
                        {c.ordem !== undefined && (
                          <span className="text-[11px] font-medium text-ink-muted-48">Ordine: {c.ordem}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => apriModificaCollab(c)}
                        title="Modifica"
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-hairline text-ink-muted-80 hover:bg-canvas-parchment hover:text-ink transition-colors"
                      >
                        <Icon name="edit" className="text-[15px]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminaCollaboratore(c)}
                        title="Elimina"
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Icon name="delete" className="text-[15px]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end border-t border-hairline pt-3 mt-2">
              <BtnGhost type="button" onClick={() => setChiesaCollaboratori(null)}>
                Chiudi
              </BtnGhost>
            </div>
          </div>
        </Modal>
      )}

      {/* --- Modal 2: Form Inserimento / Modifica Collaboratore --- */}
      {chiesaCollaboratori && modaleFormCollab && (
        <Modal
          onClose={() => setModaleFormCollab(false)}
          larghezza="max-w-2xl"
          titolo={formCollab.id ? 'Modifica Collaboratore' : 'Nuovo Collaboratore'}
          sottotitolo={`Comunità: ${chiesaCollaboratori.cidade}`}
          icona="group"
          accent={AZZURRO}
        >
          <form onSubmit={salvaCollaboratore} className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome e cognome" obbligatorio>
                <input
                  type="text"
                  required
                  autoFocus
                  value={formCollab.nome}
                  onChange={(e) => setFormCollab((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Es.: Pr. Alessandro Siqueira"
                  className={inputClass}
                />
              </Field>

              <Field label="Posizione" obbligatorio>
                <input
                  type="text"
                  required
                  value={formCollab.cargo}
                  onChange={(e) => setFormCollab((f) => ({ ...f, cargo: e.target.value }))}
                  placeholder="Pastore"
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 items-start">
              <div className="sm:col-span-2">
                <Field label="Foto del collaboratore">
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={formCollab.foto_url}
                      onChange={(e) => setFormCollab((f) => ({ ...f, foto_url: e.target.value }))}
                      placeholder="https://..."
                      className={inputClass}
                    />
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-2.5 text-[12.5px] font-bold text-cyan-800 transition-all hover:bg-cyan-500/20 active:scale-95 shadow-xs">
                      <Icon
                        name={caricandoFotoCollab ? 'progress_activity' : 'cloud_upload'}
                        className={`text-[17px] ${caricandoFotoCollab ? 'animate-spin' : ''}`}
                      />
                      {caricandoFotoCollab ? 'Caricando...' : 'Carica la foto'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUploadFotoCollab}
                        disabled={caricandoFotoCollab}
                      />
                    </label>
                  </div>
                </Field>
              </div>

              <Field label="Ordine visualizzazione">
                <input
                  type="number"
                  value={formCollab.ordem}
                  onChange={(e) => setFormCollab((f) => ({ ...f, ordem: e.target.value }))}
                  placeholder="0"
                  className={inputClass}
                />
              </Field>
            </div>

            {formCollab.foto_url && (
              <div className="flex items-center gap-3 rounded-xl border border-hairline bg-surface-pearl p-2.5">
                <img
                  src={formCollab.foto_url}
                  alt={formCollab.nome}
                  className="h-12 w-12 rounded-full object-cover border border-hairline"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted-48">Anteprima foto</div>
                  <div className="truncate text-[12px] text-ink-muted-80">{formCollab.foto_url}</div>
                </div>
              </div>
            )}

            <div className="mt-2 flex justify-end gap-2 border-t border-hairline pt-3">
              <BtnGhost type="button" onClick={() => setModaleFormCollab(false)}>
                Annulla
              </BtnGhost>
              <button
                type="submit"
                disabled={salvandoCollab}
                style={{ backgroundColor: AZZURRO }}
                className="flex items-center gap-2 rounded-xl px-5 py-2 text-[13px] font-bold text-white transition-all hover:brightness-110 disabled:opacity-50 shadow-sm"
              >
                <Icon
                  name={salvandoCollab ? 'progress_activity' : 'check'}
                  className={`text-[16px] ${salvandoCollab ? 'animate-spin' : ''}`}
                />
                {formCollab.id ? 'Aggiorna collaboratore' : 'Salva collaboratore'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AdminLayout>
  )
}
