import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { eliminaPerId } from '../lib/db'
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
import { ACCENT, fmtData, tabellaMancante } from '../theme'

const BLU = ACCENT.membri
const PER_PAGINA = 12

const FASCE = ['Bambino', 'Adolescente', 'Giovane', 'Adulto', 'Anziano']
const STATI_CIVILI = ['Celibe/Nubile', 'Coniugato/a', 'Vedovo/a', 'Separato/a', 'Divorziato/a']

const vuoto = {
  nome_completo: '',
  sesso: '',
  data_nascita: '',
  fascia_eta: 'Adulto',
  telefono: '',
  email: '',
  indirizzo: '',
  stato_civile: '',
  ruolo: '',
  data_battesimo: '',
  note: '',
  dipartimento_id: '',
  igreja_id: '',
  attivo: true,
}

const iniziali = (nome = '') =>
  nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase() || '··'

/** Età compiuta a partire dalla data di nascita. */
const eta = (iso) => {
  if (!iso) return null
  const n = new Date(`${String(iso).slice(0, 10)}T12:00:00`)
  const oggi = new Date()
  let a = oggi.getFullYear() - n.getFullYear()
  const m = oggi.getMonth() - n.getMonth()
  if (m < 0 || (m === 0 && oggi.getDate() < n.getDate())) a--
  return a >= 0 ? a : null
}

export default function Membri() {
  const confirm = useConfirm()

  const [righe, setRighe] = useState([])
  const [dipartimenti, setDipartimenti] = useState([])
  const [chiese, setChiese] = useState([])
  const [loading, setLoading] = useState(true)
  const [setupNeeded, setSetupNeeded] = useState(false)

  const [cerca, setCerca] = useState('')
  const [filtroFascia, setFiltroFascia] = useState('')
  const [filtroDipartimento, setFiltroDipartimento] = useState('')
  const [filtroStato, setFiltroStato] = useState('')
  const [filtriAperti, setFiltriAperti] = useState(false)
  const [vista, setVista] = useState(() => localStorage.getItem('loasi.membri.vista') || 'lista')
  const [pagina, setPagina] = useState(1)

  const [modale, setModale] = useState(false)
  const [inModifica, setInModifica] = useState(null)
  const [form, setForm] = useState(vuoto)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    localStorage.setItem('loasi.membri.vista', vista)
  }, [vista])

  useEffect(() => {
    setPagina(1)
  }, [cerca, filtroFascia, filtroDipartimento, filtroStato])

  useEffect(() => {
    carica()
  }, [])

  async function carica() {
    setLoading(true)

    const { data, error } = await supabase
      .from('membri')
      .select('*, dipartimento:dipartimenti(id, nome, colore), chiesa:igrejas(id, cidade)')
      .order('nome_completo')

    if (error) {
      if (tabellaMancante(error)) setSetupNeeded(true)
      else toast.error(`Errore nel caricamento: ${error.message}`)
      setRighe([])
    } else {
      setSetupNeeded(false)
      setRighe(data || [])
    }

    const [{ data: dip }, { data: ch }] = await Promise.all([
      supabase.from('dipartimenti').select('id, nome, colore').order('nome'),
      supabase.from('igrejas').select('id, cidade').order('cidade'),
    ])
    setDipartimenti(dip || [])
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
      nome_completo: r.nome_completo || '',
      sesso: r.sesso || '',
      data_nascita: r.data_nascita || '',
      fascia_eta: r.fascia_eta || 'Adulto',
      telefono: r.telefono || '',
      email: r.email || '',
      indirizzo: r.indirizzo || '',
      stato_civile: r.stato_civile || '',
      ruolo: r.ruolo || '',
      data_battesimo: r.data_battesimo || '',
      note: r.note || '',
      dipartimento_id: r.dipartimento_id || '',
      igreja_id: r.igreja_id || '',
      attivo: r.attivo !== false,
    })
    setModale(true)
  }

  const salva = async (e) => {
    e.preventDefault()
    if (!form.nome_completo.trim()) return toast.error('Indica il nome completo.')

    setSalvando(true)
    const payload = {
      nome_completo: form.nome_completo.trim(),
      sesso: form.sesso || null,
      data_nascita: form.data_nascita || null,
      fascia_eta: form.fascia_eta || null,
      telefono: form.telefono.trim() || null,
      email: form.email.trim() || null,
      indirizzo: form.indirizzo.trim() || null,
      stato_civile: form.stato_civile || null,
      ruolo: form.ruolo.trim() || null,
      data_battesimo: form.data_battesimo || null,
      note: form.note.trim() || null,
      dipartimento_id: form.dipartimento_id || null,
      igreja_id: form.igreja_id || null,
      attivo: form.attivo,
    }

    const { error } = inModifica
      ? await supabase.from('membri').update(payload).eq('id', inModifica.id)
      : await supabase.from('membri').insert([payload])

    setSalvando(false)
    if (error) return toast.error(`Errore nel salvataggio: ${error.message}`)

    toast.success(inModifica ? 'Membro aggiornato.' : 'Membro registrato.')
    setModale(false)
    carica()
  }

  const elimina = async (r) => {
    const ok = await confirm({
      titolo: 'Eliminare il membro?',
      messaggio: `La scheda di ${r.nome_completo} sarà rimossa definitivamente. Se vuoi solo toglierlo dagli attivi, usa l'interruttore di stato.`,
      testoConferma: 'Sì, elimina',
      intent: 'danger',
    })
    if (!ok) return

    const { error } = await eliminaPerId('membri', r.id)
    if (error) return toast.error(`Errore: ${error.message}`)
    toast.success('Membro eliminato.')
    setRighe((prev) => prev.filter((x) => x.id !== r.id))
  }

  const alternaStato = async (r) => {
    const nuovo = r.attivo === false
    const { error } = await supabase.from('membri').update({ attivo: nuovo }).eq('id', r.id)
    if (error) return toast.error(`Errore: ${error.message}`)
    setRighe((prev) => prev.map((x) => (x.id === r.id ? { ...x, attivo: nuovo } : x)))
  }

  const filtrate = useMemo(() => {
    const q = cerca.trim().toLowerCase()
    return righe.filter((r) => {
      const okCerca =
        !q ||
        r.nome_completo?.toLowerCase().includes(q) ||
        r.telefono?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.ruolo?.toLowerCase().includes(q)
      const okFascia = !filtroFascia || r.fascia_eta === filtroFascia
      const okDip = !filtroDipartimento || r.dipartimento_id === filtroDipartimento
      const okStato =
        !filtroStato || (filtroStato === 'attivi' ? r.attivo !== false : r.attivo === false)
      return okCerca && okFascia && okDip && okStato
    })
  }, [righe, cerca, filtroFascia, filtroDipartimento, filtroStato])

  const totalePagine = Math.max(1, Math.ceil(filtrate.length / PER_PAGINA))
  const visibili = filtrate.slice((pagina - 1) * PER_PAGINA, pagina * PER_PAGINA)

  const filtriAttivi = filtroFascia || filtroDipartimento || filtroStato

  const colonne = [
    {
      key: 'nome_completo',
      label: 'Nome',
      render: (r) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/12 text-[11px] font-bold text-blue-700">
            {iniziali(r.nome_completo)}
          </span>
          <div className="min-w-0">
            <div className="truncate font-bold text-ink">{r.nome_completo}</div>
            {r.ruolo && <div className="truncate text-[12px] text-ink-muted-48">{r.ruolo}</div>}
          </div>
        </div>
      ),
    },
    {
      key: 'fascia_eta',
      label: 'Profilo',
      render: (r) => {
        const a = eta(r.data_nascita)
        return (
          <span className="text-[12.5px] text-ink-muted-80">
            {r.fascia_eta || '—'}
            {a != null && <span className="text-ink-muted-48"> · {a} anni</span>}
          </span>
        )
      },
    },
    {
      key: 'dipartimento',
      label: 'Dipartimento',
      render: (r) =>
        r.dipartimento ? (
          <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-muted-80">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: r.dipartimento.colore || BLU }}
            />
            {r.dipartimento.nome}
          </span>
        ) : (
          '—'
        ),
    },
    { key: 'chiesa', label: 'Comunità', render: (r) => r.chiesa?.cidade || '—' },
    { key: 'telefono', label: 'Contatto', render: (r) => r.telefono || r.email || '—' },
    {
      key: 'attivo',
      label: 'Stato',
      render: (r) => <StatusToggle attivo={r.attivo !== false} onToggle={() => alternaStato(r)} />,
    },
  ]

  return (
    <AdminLayout modulo="Membri" titolo="Membri" icona="badge" accent={BLU}>
      <div className="mx-auto max-w-[1500px]">
        <PageTitle
          titolo="Membri"
          sottotitolo="Anagrafica dei membri, contatti e appartenenza ai dipartimenti."
        >
          {!setupNeeded && !loading && (
            <BtnPrimary onClick={apriNuovo}>
              <Icon name="add" className="text-[18px]" />
              Nuovo membro
            </BtnPrimary>
          )}
        </PageTitle>

        {loading ? (
          <Loading testo="Caricamento membri…" accent={BLU} />
        ) : setupNeeded ? (
          <SetupPanel tabelle={['membri']} script="supabase_gestionale.sql" />
        ) : (
          <>
            <ControlBar
              valore={cerca}
              onCerca={setCerca}
              placeholder="Cerca per nome, telefono, e-mail o ruolo…"
              vista={vista}
              onVista={setVista}
              conteggio={filtrate.length}
              etichettaConteggio={filtrate.length === 1 ? 'membro' : 'membri'}
              accent={BLU}
            >
              <button
                type="button"
                onClick={() => setFiltriAperti((v) => !v)}
                className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[12.5px] font-semibold transition-all ${
                  filtriAttivi
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-hairline bg-surface-pearl text-ink-muted-80 hover:text-ink'
                }`}
              >
                <Icon name="filter_alt" className="text-[17px]" />
                Filtri
              </button>
            </ControlBar>

            {filtriAperti && (
              <Panel className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-ink">
                    <Icon name="filter_alt" className="text-[16px]" style={{ color: BLU }} />
                    Filtri
                  </h4>
                  {filtriAttivi && (
                    <button
                      type="button"
                      onClick={() => {
                        setFiltroFascia('')
                        setFiltroDipartimento('')
                        setFiltroStato('')
                      }}
                      className="text-[10px] font-black uppercase tracking-widest text-red-500 transition-colors hover:text-red-700"
                    >
                      Azzera
                    </button>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Fascia d'età">
                    <CustomSelect
                      value={filtroFascia}
                      onChange={setFiltroFascia}
                      accent={BLU}
                      options={[{ value: '', label: 'Tutte' }, ...FASCE.map((f) => ({ value: f, label: f }))]}
                    />
                  </Field>
                  <Field label="Dipartimento">
                    <CustomSelect
                      value={filtroDipartimento}
                      onChange={setFiltroDipartimento}
                      accent={BLU}
                      options={[
                        { value: '', label: 'Tutti' },
                        ...dipartimenti.map((d) => ({ value: d.id, label: d.nome, color: d.colore })),
                      ]}
                    />
                  </Field>
                  <Field label="Stato">
                    <CustomSelect
                      value={filtroStato}
                      onChange={setFiltroStato}
                      accent={BLU}
                      options={[
                        { value: '', label: 'Tutti' },
                        { value: 'attivi', label: 'Attivi' },
                        { value: 'inattivi', label: 'Non attivi' },
                      ]}
                    />
                  </Field>
                </div>
              </Panel>
            )}

            {filtrate.length === 0 ? (
              <Panel padding={false}>
                <EmptyState
                  icona="badge"
                  titolo={cerca || filtriAttivi ? 'Nessun risultato' : 'Nessun membro registrato'}
                  testo={
                    cerca || filtriAttivi
                      ? 'Prova a cambiare la ricerca o azzerare i filtri.'
                      : 'Registra il primo membro per iniziare a costruire l’anagrafica della chiesa.'
                  }
                >
                  {!cerca && !filtriAttivi && (
                    <BtnPrimary onClick={apriNuovo}>
                      <Icon name="add" className="text-[18px]" />
                      Registra membro
                    </BtnPrimary>
                  )}
                </EmptyState>
              </Panel>
            ) : vista === 'lista' ? (
              <>
                <Table colonne={colonne} righe={visibili} onModifica={apriModifica} onElimina={elimina} />
                <Pagination currentPage={pagina} totalPages={totalePagine} onPageChange={setPagina} />
              </>
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {visibili.map((r) => {
                    const a = eta(r.data_nascita)
                    return (
                      <article
                        key={r.id}
                        className="group relative overflow-hidden rounded-2xl border border-hairline bg-surface-pearl p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                      >
                        <div className="flex items-start justify-between">
                          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/12 text-[16px] font-bold text-blue-700">
                            {iniziali(r.nome_completo)}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => apriModifica(r)}
                              aria-label="Modifica"
                              title="Modifica"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline text-ink-muted-80 transition-all hover:bg-canvas-parchment hover:text-ink active:scale-90"
                            >
                              <Icon name="edit" className="text-[16px]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => elimina(r)}
                              aria-label="Elimina"
                              title="Elimina"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/30 text-red-500 transition-all hover:bg-red-500/10 active:scale-90"
                            >
                              <Icon name="delete" className="text-[16px]" />
                            </button>
                          </div>
                        </div>

                        <h3 className="mt-4 truncate text-[16px] font-bold text-ink" title={r.nome_completo}>
                          {r.nome_completo}
                        </h3>
                        <p className="mt-0.5 truncate text-[12.5px] text-ink-muted-48">
                          {r.ruolo || r.fascia_eta || 'Membro'}
                          {a != null && ` · ${a} anni`}
                        </p>

                        <div className="mt-4 space-y-2 border-t border-hairline pt-4 text-[12.5px] text-ink-muted-80">
                          {r.dipartimento && (
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: r.dipartimento.colore || BLU }}
                              />
                              <span className="truncate">{r.dipartimento.nome}</span>
                            </div>
                          )}
                          {r.telefono && (
                            <div className="flex items-center gap-2">
                              <Icon name="call" className="text-[15px] opacity-60" />
                              <span className="truncate">{r.telefono}</span>
                            </div>
                          )}
                          {r.chiesa?.cidade && (
                            <div className="flex items-center gap-2">
                              <Icon name="church" className="text-[15px] opacity-60" />
                              <span className="truncate">{r.chiesa.cidade}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-4">
                          <StatusToggle attivo={r.attivo !== false} onToggle={() => alternaStato(r)} />
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
          larghezza="max-w-2xl"
          titolo={inModifica ? 'Modifica membro' : 'Nuovo membro'}
          sottotitolo="Dati anagrafici, contatti e appartenenza"
          icona="badge"
          accent={BLU}
        >
          <form onSubmit={salva} className="flex flex-col gap-4">
            <div className="max-h-[65vh] overflow-y-auto pr-1 space-y-4">
              <Field label="Nome completo" obbligatorio>
                <input
                  type="text"
                  required
                  autoFocus
                  value={form.nome_completo}
                  onChange={(e) => setForm((f) => ({ ...f, nome_completo: e.target.value }))}
                  placeholder="Nome e cognome"
                  className={inputClass}
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Sesso">
                  <CustomSelect
                    value={form.sesso}
                    onChange={(v) => setForm((f) => ({ ...f, sesso: v }))}
                    accent={BLU}
                    options={[
                      { value: '', label: 'Non specificato' },
                      { value: 'M', label: 'Uomo (M)' },
                      { value: 'F', label: 'Donna (F)' },
                    ]}
                  />
                </Field>

                <Field label="Fascia d'età">
                  <CustomSelect
                    value={form.fascia_eta}
                    onChange={(v) => setForm((f) => ({ ...f, fascia_eta: v }))}
                    accent={BLU}
                    options={[
                      { value: '', label: 'Tutte le età' },
                      ...FASCE.map((f) => ({ value: f, label: f })),
                    ]}
                  />
                </Field>

                <Field label="Data di nascita">
                  <input
                    type="date"
                    value={form.data_nascita}
                    onChange={(e) => setForm((f) => ({ ...f, data_nascita: e.target.value }))}
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Comunità">
                  <CustomSelect
                    value={form.igreja_id}
                    onChange={(v) => setForm((f) => ({ ...f, igreja_id: v }))}
                    accent={BLU}
                    options={[
                      { value: '', label: 'Seleziona comunità…' },
                      ...chiese.map((c) => ({ value: c.id, label: c.cidade })),
                    ]}
                  />
                </Field>

                <Field label="Dipartimento principale">
                  <CustomSelect
                    value={form.dipartimento_id}
                    onChange={(v) => setForm((f) => ({ ...f, dipartimento_id: v }))}
                    accent={BLU}
                    options={[
                      { value: '', label: 'Nessun dipartimento' },
                      ...dipartimenti.map((d) => ({ value: d.id, label: d.nome, color: d.colore })),
                    ]}
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Telefono">
                  <input
                    type="tel"
                    value={form.telefono}
                    onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                    placeholder="+39 347 000 0000"
                    className={inputClass}
                  />
                </Field>
                <Field label="E-mail">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="nome@esempio.it"
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Indirizzo">
                <input
                  type="text"
                  value={form.indirizzo}
                  onChange={(e) => setForm((f) => ({ ...f, indirizzo: e.target.value }))}
                  placeholder="Via, numero, città"
                  className={inputClass}
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Stato civile">
                  <CustomSelect
                    value={form.stato_civile}
                    onChange={(v) => setForm((f) => ({ ...f, stato_civile: v }))}
                    accent={BLU}
                    options={[
                      { value: '', label: 'Non specificato' },
                      ...STATI_CIVILI.map((s) => ({ value: s, label: s })),
                    ]}
                  />
                </Field>

                <Field label="Ruolo / Servizio nella chiesa">
                  <input
                    type="text"
                    value={form.ruolo}
                    onChange={(e) => setForm((f) => ({ ...f, ruolo: e.target.value }))}
                    placeholder="Es.: Diacono, Musicista, Insegnante…"
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Data battesimo in acqua">
                  <input
                    type="date"
                    value={form.data_battesimo}
                    onChange={(e) => setForm((f) => ({ ...f, data_battesimo: e.target.value }))}
                    className={inputClass}
                  />
                </Field>

                <Field label="URL Foto di profilo">
                  <input
                    type="text"
                    value={form.foto_url}
                    onChange={(e) => setForm((f) => ({ ...f, foto_url: e.target.value }))}
                    placeholder="https://… o /images/…"
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Note e informazioni riservate">
                <textarea
                  rows={2}
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="Visibili solo agli utenti abilitati del gestionale"
                  className={`${inputClass} resize-none`}
                />
              </Field>

              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={form.attivo}
                  onChange={(e) => setForm((f) => ({ ...f, attivo: e.target.checked }))}
                  className="h-4 w-4 accent-[#2563EB]"
                />
                <span className="text-[13px] font-semibold text-ink">Membro attivo</span>
              </label>

              {inModifica?.created_at && (
                <p className="text-[11px] text-ink-muted-48">
                  Registrato il {fmtData(inModifica.created_at)}
                </p>
              )}
            </div>

            <div className="mt-2 flex justify-end gap-2 border-t border-hairline pt-3">
              <BtnGhost type="button" onClick={() => setModale(false)}>
                Annulla
              </BtnGhost>
              <button
                type="submit"
                disabled={salvando}
                style={{ backgroundColor: BLU }}
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
