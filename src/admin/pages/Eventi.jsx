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

const ORO = ACCENT.eventi || '#EAB308'

const vuoto = {
  titulo: '',
  data_evento: '',
  hora: '',
  local: '',
  imagem_url: '',
  link_inscricao: '',
  descricao: '',
  ativo: true,
}

const MONTHS_IT = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

export default function Eventi() {
  const confirm = useConfirm()

  const [righe, setRighe] = useState([])
  const [chiese, setChiese] = useState([])
  const [loading, setLoading] = useState(true)
  const [cerca, setCerca] = useState('')
  const [vista, setVista] = useState(() => localStorage.getItem('loasi.eventi.vista') || 'griglia')

  const [modale, setModale] = useState(false)
  const [inModifica, setInModifica] = useState(null)
  const [form, setForm] = useState(vuoto)
  const [salvando, setSalvando] = useState(false)
  const [caricandoFoto, setCaricandoFoto] = useState(false)

  useEffect(() => {
    localStorage.setItem('loasi.eventi.vista', vista)
  }, [vista])

  useEffect(() => {
    carica()
  }, [])

  async function carica() {
    setLoading(true)
    const [resEventi, resChiese] = await Promise.all([
      supabase.from('eventos').select('*').order('data_evento', { ascending: true }),
      supabase.from('igrejas').select('*').order('cidade'),
    ])

    if (resEventi.error) toast.error(`Errore nel caricamento eventi: ${resEventi.error.message}`)
    if (resChiese.error) toast.error(`Errore nel caricamento chiese: ${resChiese.error.message}`)

    setRighe(resEventi.data || [])
    setChiese(resChiese.data || [])
    setLoading(false)
  }

  const handleUploadFoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCaricandoFoto(true)
    try {
      const url = await uploadImageToStorage(file, 'eventi')
      setForm((f) => ({ ...f, imagem_url: url }))
      toast.success('Foto caricata su Cloudflare / Storage!')
    } catch (err) {
      toast.error(`Errore caricamento foto: ${err.message}`)
    } finally {
      setCaricandoFoto(false)
    }
  }

  const apriNuova = () => {
    setInModifica(null)
    setForm(vuoto)
    setModale(true)
  }

  const apriModifica = (r) => {
    setInModifica(r)
    setForm({
      titulo: r.titulo || '',
      data_evento: r.data_evento ? String(r.data_evento).slice(0, 10) : '',
      hora: r.hora || '',
      local: r.local || '',
      imagem_url: r.imagem_url || '',
      link_inscricao: r.link_inscricao || '',
      descricao: r.descricao || '',
      ativo: r.ativo !== false,
    })
    setModale(true)
  }

  const salva = async (e) => {
    e.preventDefault()
    if (!form.titulo.trim()) return toast.error('Indica il titolo dell’evento.')
    if (!form.data_evento) return toast.error('Indica la data dell’evento.')

    setSalvando(true)
    const payload = {
      titulo: form.titulo.trim(),
      data_evento: form.data_evento,
      hora: form.hora.trim() || null,
      local: form.local.trim() || null,
      imagem_url: form.imagem_url.trim() || null,
      link_inscricao: form.link_inscricao.trim() || null,
      descricao: form.descricao.trim() || null,
      ativo: form.ativo,
      updated_at: new Date().toISOString(),
    }

    const { error } = inModifica
      ? await supabase.from('eventos').update(payload).eq('id', inModifica.id)
      : await supabase.from('eventos').insert([payload])

    setSalvando(false)

    if (error) {
      return toast.error(`Errore nel salvataggio: ${error.message}`)
    }

    toast.success(inModifica ? 'Evento aggiornato.' : 'Evento salvato con successo!')
    setModale(false)
    carica()
  }

  const toggleAtivo = async (r) => {
    const nuovoStato = !r.ativo
    const { error } = await supabase.from('eventos').update({ ativo: nuovoStato }).eq('id', r.id)
    if (error) return toast.error(`Errore: ${error.message}`)
    toast.success(nuovoStato ? 'Evento pubblicato sul sito.' : 'Evento nascosto dal sito.')
    setRighe((prev) => prev.map((x) => (x.id === r.id ? { ...x, ativo: nuovoStato } : x)))
  }

  const elimina = async (r) => {
    const ok = await confirm({
      titolo: "Eliminare l'evento?",
      sottotitolo: 'Questa azione modifica la home page del sito',
      messaggio: `Sei sicuro di voler eliminare "${r.titulo}"? L'evento sparirà dall'agenda pubblica.`,
      testoConferma: 'Sì, elimina',
      intent: 'danger',
    })
    if (!ok) return

    const { error } = await eliminaPerId('eventos', r.id)
    if (error) return toast.error(`Errore: ${error.message}`)
    toast.success('Evento eliminato.')
    setRighe((prev) => prev.filter((x) => x.id !== r.id))
  }

  const filtrate = useMemo(() => {
    if (!cerca.trim()) return righe
    const q = cerca.toLowerCase()
    return righe.filter(
      (r) =>
        r.titulo?.toLowerCase().includes(q) ||
        r.local?.toLowerCase().includes(q) ||
        r.descricao?.toLowerCase().includes(q)
    )
  }, [righe, cerca])

  return (
    <AdminLayout modulo="Eventi" titolo="Eventi & Agenda" icona="calendar_month" accent={ORO}>
      <PageTitle
        titolo="Eventi & Agenda"
        sottotitolo="Gestisci gli eventi in evidenza pubblicati nella sezione Agenda della Home Page."
      >
        <BtnPrimary onClick={apriNuova}>
          <Icon name="add" className="text-[18px]" />
          Nuovo evento
        </BtnPrimary>
      </PageTitle>

      {/* Avviso: qui si modifica il sito pubblico */}
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-cyan-500/25 bg-cyan-50 p-4">
        <Icon name="public" className="mt-0.5 shrink-0 text-[20px] text-cyan-700" />
        <p className="text-[13px] leading-relaxed text-cyan-900">
          <strong className="font-bold">Attenzione:</strong> queste informazioni sono pubblicate sul sito. Ogni
          modifica salvata qui è visibile subito ai visitatori nelle pagine delle comunità.
        </p>
      </div>

      <ControlBar
        valore={cerca}
        onCerca={setCerca}
        placeholder="Cerca evento per titolo o luogo…"
        vista={vista}
        onVista={setVista}
        conteggio={filtrate.length}
        etichettaConteggio={filtrate.length === 1 ? 'evento' : 'eventi'}
        accent={ORO}
      />

      {loading ? (
        <Loading testo="Caricamento eventi in corso…" accent={ORO} />
      ) : filtrate.length === 0 ? (
        <EmptyState
          icona="event_busy"
          titolo={cerca ? 'Nessun evento corrisponde alla ricerca' : 'Nessun evento in agenda'}
          sottotitolo={
            cerca
              ? 'Provali a cercare con termini diversi'
              : 'Inserisci il primo evento per mostrarlo nella sezione Agenda della Home.'
          }
          azione={
            !cerca && (
              <BtnPrimary onClick={apriNuova}>
                <Icon name="add" className="text-[18px]" />
                Crea primo evento
              </BtnPrimary>
            )
          }
        />
      ) : vista === 'griglia' ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtrate.map((r) => {
            const d = r.data_evento ? new Date(r.data_evento) : null
            const valid = d && !Number.isNaN(d.getTime())

            return (
              <article
                key={r.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-hairline bg-surface-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-gold-400/30 hover:shadow-lift"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-ink-900">
                  <img
                    src={r.imagem_url || '/images/event-1-385x392.jpg'}
                    alt={r.titulo}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />

                  {valid && (
                    <div className="absolute left-3.5 top-3.5 flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-[#C8A165] font-headline text-ink-950 shadow-md">
                      <span className="text-[9px] font-black uppercase tracking-widest">{MONTHS_IT[d.getMonth()]}</span>
                      <span className="text-xl font-bold leading-none">{d.getDate()}</span>
                      <span className="text-[8px] font-bold opacity-75">{d.getFullYear()}</span>
                    </div>
                  )}

                  <div className="absolute right-3.5 top-3.5">
                    <button
                      type="button"
                      onClick={() => toggleAtivo(r)}
                      title={r.ativo ? 'Disattiva (nascondi dal sito)' : 'Attiva (mostra sul sito)'}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur-md transition-all shadow-md active:scale-95 ${
                        r.ativo
                          ? 'bg-emerald-950/85 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-900'
                          : 'bg-amber-950/85 text-amber-300 border border-amber-500/50 hover:bg-amber-900'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${r.ativo ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                      {r.ativo ? 'Pubblicato' : 'Bozza'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-headline text-lg font-bold text-ink">{r.titulo}</h3>

                  <ul className="mt-3 space-y-1.5 text-[13px] text-ink-muted-80">
                    {r.hora && (
                      <li className="flex items-center gap-2">
                        <Icon name="schedule" className="text-[16px] text-gold-600" />
                        <span>{r.hora}</span>
                      </li>
                    )}
                    {r.local && (
                      <li className="flex items-center gap-2">
                        <Icon name="location_on" className="text-[16px] text-gold-600" />
                        <span className="truncate">{r.local}</span>
                      </li>
                    )}
                  </ul>

                  {r.descricao && (
                    <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-ink-muted-48">
                      {r.descricao}
                    </p>
                  )}

                  <div className="mt-5 flex items-center justify-end gap-2 border-t border-hairline pt-3">
                    <BtnGhost onClick={() => apriModifica(r)} title="Modifica">
                      <Icon name="edit" className="text-[17px]" />
                      Modifica
                    </BtnGhost>
                    <BtnGhost onClick={() => elimina(r)} title="Elimina" className="text-red-500 hover:bg-red-500/10">
                      <Icon name="delete" className="text-[17px]" />
                    </BtnGhost>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <Table
          colonne={[
            {
              key: 'imagem_url',
              label: 'Immagine',
              render: (r) => (
                <img
                  src={r.imagem_url || '/images/event-1-385x392.jpg'}
                  alt={r.titulo}
                  className="h-10 w-14 rounded-lg border border-hairline object-cover"
                />
              ),
            },
            {
              key: 'titulo',
              label: 'Titolo',
              render: (r) => (
                <div>
                  <p className="font-bold text-ink">{r.titulo}</p>
                  {r.descricao && <p className="truncate text-[12px] text-ink-muted-48 max-w-xs">{r.descricao}</p>}
                </div>
              ),
            },
            {
              key: 'data_evento',
              label: 'Data & Ora',
              render: (r) => {
                const d = r.data_evento ? new Date(r.data_evento) : null
                const dFormatted = d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('it-IT') : r.data_evento
                return (
                  <div>
                    <p className="text-[13px] font-bold text-ink">{dFormatted}</p>
                    {r.hora && <p className="text-[11px] font-semibold text-gold-600">ore {r.hora}</p>}
                  </div>
                )
              },
            },
            { key: 'local', label: 'Luogo', render: (r) => r.local || '—' },
            {
              key: 'ativo',
              label: 'Stato',
              render: (r) => (
                <button
                  type="button"
                  onClick={() => toggleAtivo(r)}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95 ${
                    r.ativo
                      ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-700 border border-amber-500/30'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${r.ativo ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {r.ativo ? 'Pubblicato' : 'Bozza'}
                </button>
              ),
            },
          ]}
          righe={filtrate}
          onModifica={apriModifica}
          onElimina={elimina}
        />
      )}

      {/* Modale per Creazione / Modifica */}
      {modale && (
        <Modal
          onClose={() => setModale(false)}
          larghezza="max-w-2xl"
          titolo={inModifica ? 'Modifica evento' : 'Nuovo evento'}
          sottotitolo="I dati compaiono sul sito pubblico nella sezione Agenda"
          icona="calendar_month"
          accent={ORO}
        >
          <form onSubmit={salva} className="flex flex-col gap-4">
            <div className="max-h-[65vh] overflow-y-auto pr-1 space-y-4">
              <Field label="Titolo dell'evento" obbligatorio>
                <input
                  type="text"
                  required
                  className={inputClass}
                  placeholder="es. Conferenza Giovanile"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Data dell'evento" obbligatorio>
                  <input
                    type="date"
                    required
                    className={inputClass}
                    value={form.data_evento}
                    onChange={(e) => setForm({ ...form, data_evento: e.target.value })}
                  />
                </Field>
                <Field label="Ora dell'evento" hint="es. 18:30 o 10:00">
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="es. 18:30"
                    value={form.hora}
                    onChange={(e) => setForm({ ...form, hora: e.target.value })}
                  />
                </Field>
              </div>

              <Field label="Luogo / Comunità">
                <select
                  className={inputClass}
                  value={form.local}
                  onChange={(e) => setForm({ ...form, local: e.target.value })}
                >
                  <option value="">Seleziona una comunità / Luogo...</option>
                  {form.local &&
                    !chiese.some(
                      (c) => (c.nome || `Chiesa L'Oasi - ${c.cidade}`) === form.local || c.cidade === form.local
                    ) && <option value={form.local}>{form.local}</option>}
                  {chiese.map((c) => {
                    const nomeFormattato = c.nome || `Chiesa L'Oasi - ${c.cidade}`
                    return (
                      <option key={c.id} value={nomeFormattato}>
                        {nomeFormattato} ({c.cidade})
                      </option>
                    )
                  })}
                </select>
              </Field>

              <Field label="Immagine di copertina">
                {form.imagem_url ? (
                  <div className="relative overflow-hidden rounded-2xl border border-hairline bg-surface-pearl p-3 shadow-xs">
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-hairline bg-canvas-parchment">
                      <img
                        src={form.imagem_url}
                        alt="Foto evento"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-[12px] font-medium text-ink-muted-48">Foto di copertina impostata</span>
                      <div className="flex items-center gap-2">
                        <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[12px] font-bold text-amber-900 transition-all hover:bg-amber-500/20 active:scale-95 shadow-xs">
                          <Icon
                            name={caricandoFoto ? 'progress_activity' : 'cloud_upload'}
                            className={`text-[15px] ${caricandoFoto ? 'animate-spin' : ''}`}
                          />
                          {caricandoFoto ? 'Caricando...' : 'Sostituisci'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleUploadFoto}
                            disabled={caricandoFoto}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            if (form.imagem_url) deleteImageFromStorage(form.imagem_url)
                            setForm((f) => ({ ...f, imagem_url: '' }))
                          }}
                          title="Rimuovi foto"
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <Icon name="delete" className="text-[15px]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 py-3.5 px-4 text-[12.5px] font-bold text-amber-900 transition-all hover:bg-amber-500/20 active:scale-95 shadow-xs">
                    <Icon
                      name={caricandoFoto ? 'progress_activity' : 'cloud_upload'}
                      className={`text-[18px] ${caricandoFoto ? 'animate-spin' : ''}`}
                    />
                    {caricandoFoto ? 'Caricando foto...' : 'Carica la foto'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUploadFoto}
                      disabled={caricandoFoto}
                    />
                  </label>
                )}
              </Field>

              <Field label="Link di iscrizione / approfondimento" hint="Link per WhatsApp o modulo d'iscrizione">
                <input
                  type="text"
                  className={inputClass}
                  placeholder="https://..."
                  value={form.link_inscricao}
                  onChange={(e) => setForm({ ...form, link_inscricao: e.target.value })}
                />
              </Field>

              <Field label="Descrizione dell'evento">
                <textarea
                  rows={3}
                  className={inputClass}
                  placeholder="Breve descrizione delle attività e del programma dell'evento…"
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                />
              </Field>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="chk-ativo"
                  checked={form.ativo}
                  onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                  className="h-4 w-4 rounded border-hairline text-gold-600 focus:ring-gold-500 cursor-pointer"
                />
                <label htmlFor="chk-ativo" className="text-sm font-medium text-ink cursor-pointer">
                  Pubblica questo evento nella Home Page del sito
                </label>
              </div>
            </div>

            <div className="mt-2 flex justify-end gap-2 border-t border-hairline pt-3">
              <BtnGhost type="button" onClick={() => setModale(false)}>
                Annulla
              </BtnGhost>
              <button
                type="submit"
                disabled={salvando}
                style={{ backgroundColor: ORO }}
                className="flex items-center gap-2 rounded-xl px-5 py-2 text-[13px] font-bold text-ink-950 transition-all hover:brightness-110 disabled:opacity-50"
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
    </AdminLayout>
  )
}
