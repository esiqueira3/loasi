import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout, { PageTitle } from '../components/AdminLayout'
import {
  Panel,
  BtnPrimary,
  BtnGhost,
  ControlBar,
  Loading,
  EmptyState,
  Modal,
  Field,
} from '../components/ui'
import Icon from '../../components/Icon'
import { RichTextEditor } from '../components/RichTextEditor'
import { toast } from '../components/Toast'
import { useConfirm } from '../components/Confirm'

const ORO = '#C8A165'

const slugify = (s = '') =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

const DEFAULT_MENU = [
  { label: 'Home', slug: 'home', tipo: 'sistema', link: '/', ordem: 0, ativo: true },
  { label: 'Chi Siamo', slug: 'chi-siamo', tipo: 'sistema', link: '/chi-siamo', ordem: 1, ativo: true },
  { label: 'Fede', slug: 'fede', tipo: 'sistema', link: '/fede', ordem: 2, ativo: true },
  {
    label: 'Le Chiese',
    slug: 'chiese',
    tipo: 'sistema',
    link: '/chiese',
    children: [
      { label: "L'Oasi Latina", to: '/chiese/latina' },
      { label: "L'Oasi Terracina", to: '/chiese/terracina' },
      { label: "L'Oasi Gaeta", to: '/chiese/gaeta' },
    ],
    ordem: 3,
    ativo: true,
  },
  {
    label: 'Missione',
    slug: 'missione',
    tipo: 'sistema',
    link: '/#missione',
    children: [
      { label: 'Missione Argentina', to: '/missioni/argentina' },
      { label: 'Missione Cambogia', to: '/missioni/cambogia' },
    ],
    ordem: 4,
    ativo: true,
  },
  { label: 'Media', slug: 'media', tipo: 'link', link: 'https://www.flickr.com/photos/chiesaevangelicaloasi/albums/', ordem: 5, ativo: true },
  { label: 'Eventi', slug: 'eventi', tipo: 'sistema', link: '/#eventi', ordem: 6, ativo: true },
]

export default function MenuPagine() {
  const confirm = useConfirm()
  const [loading, setLoading] = useState(true)
  const [voci, setVoci] = useState([])
  const [cerca, setCerca] = useState('')
  const [modale, setModale] = useState(false)
  const [inModifica, setInModifica] = useState(null)
  const [salvando, setSalvando] = useState(false)

  const [form, setForm] = useState({
    label: '',
    slug: '',
    tipo: 'pagina',
    link: '',
    conteudo: '',
    ativo: true,
  })

  const carica = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('paginas_menu')
      .select('*')
      .order('ordem', { ascending: true })

    if (error) {
      // Fallback a menu predefinito se la tabella non è ancora presente
      setVoci(DEFAULT_MENU)
    } else if (data && data.length > 0) {
      setVoci(data)
    } else {
      // Inizializza tabella con menu predefinito se vuota
      setVoci(DEFAULT_MENU)
    }
    setLoading(false)
  }

  useEffect(() => {
    carica()
  }, [])

  const apriNuova = () => {
    setInModifica(null)
    setForm({
      label: '',
      slug: '',
      tipo: 'pagina',
      link: '',
      conteudo: '',
      ativo: true,
    })
    setModale(true)
  }

  const apriModifica = (v) => {
    setInModifica(v)
    setForm({
      label: v.label || '',
      slug: v.slug || '',
      tipo: v.tipo || 'pagina',
      link: v.link || '',
      conteudo: v.conteudo || '',
      ativo: v.ativo ?? true,
    })
    setModale(true)
  }

  const salva = async (e) => {
    e.preventDefault()
    if (!form.label.trim()) return toast.error('Inserisci il titolo della voce di menu.')

    const slug = (form.slug.trim() || slugify(form.label)).toLowerCase()
    const link = form.tipo === 'pagina' ? `/pagine/${slug}` : form.link.trim()

    setSalvando(true)

    const payload = {
      label: form.label.trim(),
      slug,
      tipo: form.tipo,
      link,
      conteudo: form.tipo === 'pagina' ? form.conteudo : null,
      ativo: form.ativo,
      ordem: inModifica ? inModifica.ordem : voci.length,
      updated_at: new Date().toISOString(),
    }

    let error = null
    if (inModifica && inModifica.id) {
      const res = await supabase.from('paginas_menu').update(payload).eq('id', inModifica.id)
      error = res.error
    } else {
      const res = await supabase.from('paginas_menu').insert([payload])
      error = res.error
    }

    setSalvando(false)

    if (error) {
      toast.error(`Errore nel salvataggio: ${error.message}`)
      return
    }

    toast.success(inModifica ? 'Voce/Pagina aggiornata con successo!' : 'Nuova voce/pagina creata!')
    setModale(false)
    carica()
  }

  const toggleAtivo = async (v) => {
    const nuovoStato = !v.ativo
    setVoci((prev) => prev.map((x) => (x.slug === v.slug ? { ...x, ativo: nuovoStato } : x)))

    if (v.id) {
      const { data, error } = await supabase
        .from('paginas_menu')
        .update({ ativo: nuovoStato })
        .eq('id', v.id)
        .select()
      if (error || !data?.length) {
        toast.error(
          error
            ? `Errore aggiornamento visibilità: ${error.message}`
            : 'Il database ha rifiutato la modifica: esegui supabase_menu_policies.sql.'
        )
        carica()
      } else {
        toast.success(nuovoStato ? 'Voce attivata nel menu' : 'Voce nascosta dal menu')
      }
    }
  }

  const sposta = async (index, direzione) => {
    const nuovoIndex = index + direzione
    if (nuovoIndex < 0 || nuovoIndex >= voci.length) return

    const copia = [...voci]
    const temp = copia[index]
    copia[index] = copia[nuovoIndex]
    copia[nuovoIndex] = temp

    // Aggiorna gli indici ordem
    const aggiornati = copia.map((item, idx) => ({ ...item, ordem: idx }))
    setVoci(aggiornati)

    // Salva l'ordinamento su Supabase se presenti id
    try {
      const promise = aggiornati
        .filter((item) => item.id)
        .map((item) => supabase.from('paginas_menu').update({ ordem: item.ordem }).eq('id', item.id))

      await Promise.all(promise)
      toast.success('Ordine del menu aggiornato!')
    } catch {
      toast.error("Errore nell'aggiornamento dell'ordine")
    }
  }

  const elimina = async (v) => {
    /* Le voci di sistema reggono il menu del sito: non si eliminano.
       Il pulsante è già nascosto, questo è il secondo sbarramento. */
    if (v.tipo === 'sistema') {
      return toast.error('Le voci di sistema non si possono eliminare: puoi solo nasconderle.')
    }

    if (!v.id) {
      return toast.error('Questa voce non è ancora salvata nel database.')
    }

    const ok = await confirm({
      titolo: 'Eliminare la voce / pagina?',
      messaggio: `Sei sicuro di voler eliminare "${v.label}"? Se è una pagina dinamica, il suo contenuto andrà perso.`,
      testoConferma: 'Sì, elimina',
      intent: 'danger',
    })
    if (!ok) return

    /* `.select()` è indispensabile: senza, quando la Row Level Security blocca
       l'operazione Supabase risponde "nessun errore" con zero righe toccate, e
       l'interfaccia festeggia un'eliminazione che non è mai avvenuta. */
    const { data, error } = await supabase.from('paginas_menu').delete().eq('id', v.id).select()

    if (error) {
      return toast.error(`Errore durante l'eliminazione: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return toast.error(
        "Nessuna riga eliminata: il database ha rifiutato l'operazione. Esegui supabase_menu_policies.sql nel SQL Editor di Supabase."
      )
    }

    toast.success('Voce eliminata.')
    setVoci((prev) => prev.filter((x) => x.id !== v.id))
  }

  const filtrate = voci.filter(
    (v) =>
      v.label.toLowerCase().includes(cerca.toLowerCase()) ||
      v.slug.toLowerCase().includes(cerca.toLowerCase())
  )

  return (
    /* Il modulo è "Home", come la voce di menu in theme.js: usare un nome
       assente da MODULI bloccherebbe la pagina a ogni profilo non di sistema. */
    <AdminLayout modulo="Home" titolo="Gestione Menu & Pagine" icona="menu_open" accent={ORO}>
      <PageTitle
        titolo="Menu Navigazione & Pagine"
        sottotitolo="Organizza l'ordine del menu superiore e crea pagine dinamiche per il sito."
      >
        <BtnPrimary onClick={apriNuova} style={{ backgroundColor: ORO }}>
          <Icon name="add" className="text-[19px]" />
          Nuova Voce / Pagina
        </BtnPrimary>
      </PageTitle>

      {/* Avviso pubblico */}
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-cyan-500/25 bg-cyan-50 p-4">
        <Icon name="public" className="mt-0.5 shrink-0 text-[20px] text-cyan-700" />
        <p className="text-[13px] leading-relaxed text-cyan-900">
          <strong className="font-bold">Attenzione:</strong> le voci e l'ordine impostati qui modificano immediatamente
          il menu di navigazione superiore del sito.
        </p>
      </div>

      <ControlBar
        valore={cerca}
        onCerca={setCerca}
        placeholder="Cerca voce o pagina…"
        conteggio={filtrate.length}
        etichettaConteggio={filtrate.length === 1 ? 'voce' : 'voci'}
        accent={ORO}
      />

      {loading ? (
        <Loading testo="Caricamento menu in corso…" accent={ORO} />
      ) : filtrate.length === 0 ? (
        <EmptyState
          icona="menu_book"
          titolo="Nessuna voce trovata"
          testo="Crea una nuova voce di menu o una pagina dinamica per iniziare."
        />
      ) : (
        <Panel padding={false} className="overflow-hidden border border-hairline bg-surface-card shadow-soft">
          <div className="divide-y divide-hairline">
            {filtrate.map((v, idx) => (
              <div
                key={v.slug}
                className="flex flex-wrap items-center justify-between gap-4 p-4 lg:px-6 transition-colors hover:bg-surface-pearl"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Frecce Ordinamento */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => sposta(idx, -1)}
                      disabled={idx === 0}
                      title="Sposta Su"
                      className="flex h-6 w-6 items-center justify-center rounded-md bg-canvas-parchment text-ink-muted-80 hover:bg-gold-400 hover:text-ink-950 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      <Icon name="keyboard_arrow_up" className="text-[16px]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => sposta(idx, 1)}
                      disabled={idx === filtrate.length - 1}
                      title="Sposta Giù"
                      className="flex h-6 w-6 items-center justify-center rounded-md bg-canvas-parchment text-ink-muted-80 hover:bg-gold-400 hover:text-ink-950 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      <Icon name="keyboard_arrow_down" className="text-[16px]" />
                    </button>
                  </div>

                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-400/15 text-gold-700 font-bold text-[14px]">
                    {idx + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="truncate text-[15px] font-bold text-ink">{v.label}</h4>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border ${
                          v.tipo === 'pagina'
                            ? 'bg-purple-500/15 text-purple-700 border-purple-500/20'
                            : v.tipo === 'link'
                            ? 'bg-blue-500/15 text-blue-700 border-blue-500/20'
                            : 'bg-emerald-500/15 text-emerald-700 border-emerald-500/20'
                        }`}
                      >
                        {v.tipo === 'pagina' ? 'Pagina Dinamica' : v.tipo === 'link' ? 'Link Esterno' : 'Sistema'}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[12px] text-ink-muted-48">
                      URL: <code className="rounded bg-canvas-parchment px-1.5 py-0.5 text-gold-700">{v.link || `/${v.slug}`}</code>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleAtivo(v)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95 border ${
                      v.ativo
                        ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-700 border-amber-500/30'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${v.ativo ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {v.ativo ? 'Visibile' : 'Nascosto'}
                  </button>

                  <BtnGhost onClick={() => apriModifica(v)} title="Modifica">
                    <Icon name="edit" className="text-[17px]" />
                  </BtnGhost>

                  {v.tipo !== 'sistema' && (
                    <BtnGhost onClick={() => elimina(v)} title="Elimina" className="text-red-500 hover:bg-red-500/10">
                      <Icon name="delete" className="text-[17px]" />
                    </BtnGhost>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Modale Creazione / Modifica */}
      {modale && (
        <Modal
          onClose={() => setModale(false)}
          titolo={inModifica ? `Modifica "${inModifica.label}"` : 'Nuova Voce / Pagina'}
          sottotitolo="Imposta il titolo, il tipo di rotta e il contenuto della pagina"
          icona="menu_open"
          accent={ORO}
          larghezza="max-w-3xl"
        >
          <form onSubmit={salva} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Titolo Voce Menu *" obbligatorio>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="Es: Orari & Attività"
                  className="w-full rounded-xl border border-hairline bg-canvas-parchment px-3 py-2.5 text-[13.5px] text-ink outline-none focus:border-gold-400"
                />
              </Field>

              <Field label="Tipo di Voce">
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="w-full rounded-xl border border-hairline bg-canvas-parchment px-3 py-2.5 text-[13.5px] text-ink outline-none focus:border-gold-400"
                >
                  <option value="pagina">Pagina Dinamica (Contenuto Ricco)</option>
                  <option value="link">Link Esterno / Sezione (#)</option>
                  <option value="sistema">Sezione di Sistema</option>
                </select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Identificativo Slug (URL)">
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="Es: orari-e-attivita"
                  className="w-full rounded-xl border border-hairline bg-canvas-parchment px-3 py-2.5 text-[13.5px] font-mono text-gold-700 outline-none focus:border-gold-400"
                />
              </Field>

              {form.tipo !== 'pagina' && (
                <Field label="URL / Collegamento">
                  <input
                    type="text"
                    value={form.link}
                    onChange={(e) => setForm({ ...form, link: e.target.value })}
                    placeholder="Es: /#eventi o https://..."
                    className="w-full rounded-xl border border-hairline bg-canvas-parchment px-3 py-2.5 text-[13.5px] text-ink outline-none focus:border-gold-400"
                  />
                </Field>
              )}
            </div>

            {form.tipo === 'pagina' && (
              <Field label="Contenuto della Pagina Dinamica (Editor Ricco)">
                <RichTextEditor
                  value={form.conteudo}
                  onChange={(html) => setForm((f) => ({ ...f, conteudo: html }))}
                  placeholder="Scrivi qui il testo formattato, inserisci immagini e titoli per la pagina pubblica..."
                />
              </Field>
            )}

            <div className="mt-2 flex items-center justify-between border-t border-hairline pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                  className="h-4 w-4 rounded border-hairline text-gold-600 focus:ring-gold-400"
                />
                <span className="text-[13px] font-semibold text-ink">Mostra questa voce nel menu del sito</span>
              </label>

              <div className="flex items-center gap-2">
                <BtnGhost type="button" onClick={() => setModale(false)}>
                  Annulla
                </BtnGhost>
                <BtnPrimary type="submit" disabled={salvando} style={{ backgroundColor: ORO }}>
                  <Icon name={salvando ? 'sync' : 'check'} className={`text-[18px] ${salvando ? 'animate-spin' : ''}`} />
                  {salvando ? 'Salvataggio…' : 'Salva Voce'}
                </BtnPrimary>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </AdminLayout>
  )
}
