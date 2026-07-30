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

    // Fallback automatico se a coluna referente/responsavel ainda não existir no Supabase
    if (error && (error.message?.includes('referente') || error.message?.includes('responsavel') || error.message?.includes('column') || error.code === 'PGRST204')) {
      const fallbackPayload = { ...payload }
      delete fallbackPayload.referente
      delete fallbackPayload.responsavel

      const resFallback = inModifica
        ? await supabase.from('igrejas').update(fallbackPayload).eq('id', inModifica.id)
        : await supabase.from('igrejas').insert([fallbackPayload])

      if (!resFallback.error) {
        toast.warning('Modifiche salvate! Esegui lo script SQL nel Supabase Editor per abilitare il campo Referente.')
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

    const { error } = await supabase.from('igrejas').delete().eq('id', r.id)
    if (error) return toast.error(`Errore: ${error.message}`)
    toast.success('Comunità eliminata.')
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

                      <div className="mt-auto flex items-center gap-2 border-t border-hairline pt-4">
                        <button
                          type="button"
                          onClick={() => apriModifica(r)}
                          style={{ backgroundColor: AZZURRO }}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-[12.5px] font-bold text-white transition-all hover:brightness-110 active:scale-95"
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
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-hairline text-ink-muted-80 transition-all hover:bg-canvas-parchment hover:text-ink"
                        >
                          <Icon name="open_in_new" className="text-[16px]" />
                        </a>
                        <button
                          type="button"
                          onClick={() => elimina(r)}
                          aria-label="Elimina"
                          title="Elimina"
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/30 text-red-500 transition-all hover:bg-red-500/10"
                        >
                          <Icon name="delete" className="text-[16px]" />
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

            <Field label="Foto di copertina (URL)" hint="Immagine mostrata sul sito e in questa scheda.">
              <input
                type="text"
                value={form.foto_capa_url}
                onChange={(e) => setForm((f) => ({ ...f, foto_capa_url: e.target.value }))}
                placeholder="/images/home-3-610x458.jpg"
                className={inputClass}
              />
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
    </AdminLayout>
  )
}
