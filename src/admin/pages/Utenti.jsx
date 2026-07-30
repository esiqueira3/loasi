import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
  Panel,
  SetupPanel,
  StatusToggle,
  Table,
  inputClass,
} from '../components/ui'
import { ACCENT, LIVELLI, MODULI, fmtData, tabellaMancante } from '../theme'

const ROSA = ACCENT.utenti

const vuoto = { nome: '', email: '', telefono: '', profilo_id: '', attivo: true }

const iniziali = (nome = '') =>
  nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase() || '··'

const fmtAccesso = (iso) => {
  if (!iso) return 'Mai entrato'
  const d = new Date(iso)
  return `${d.toLocaleDateString('it-IT')} alle ${d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`
}

export default function Utenti() {
  const confirm = useConfirm()

  const [utenti, setUtenti] = useState([])
  const [profili, setProfili] = useState([])
  const [loading, setLoading] = useState(true)
  const [setupNeeded, setSetupNeeded] = useState(false)

  const [cerca, setCerca] = useState('')
  const [vista, setVista] = useState(() => localStorage.getItem('loasi.utenti.vista') || 'lista')

  const [modale, setModale] = useState(false)
  const [inModifica, setInModifica] = useState(null)
  const [form, setForm] = useState(vuoto)
  const [salvando, setSalvando] = useState(false)
  const [invitando, setInvitando] = useState(null)

  useEffect(() => {
    localStorage.setItem('loasi.utenti.vista', vista)
  }, [vista])

  useEffect(() => {
    carica()
  }, [])

  async function carica() {
    setLoading(true)

    const { data, error } = await supabase
      .from('utenti')
      .select('*, profilo:profili(id, nome, colore, permessi, sistema)')
      .order('nome')

    if (error) {
      if (tabellaMancante(error)) setSetupNeeded(true)
      else toast.error(`Errore nel caricamento: ${error.message}`)
      setUtenti([])
      setLoading(false)
      return
    }

    setSetupNeeded(false)
    setUtenti(data || [])

    const { data: prof } = await supabase.from('profili').select('id, nome, colore, sistema').order('nome')
    setProfili(prof || [])
    setLoading(false)
  }

  const apriNuovo = () => {
    setInModifica(null)
    setForm({ ...vuoto, profilo_id: profili.find((p) => !p.sistema)?.id || '' })
    setModale(true)
  }

  const apriModifica = (u) => {
    setInModifica(u)
    setForm({
      nome: u.nome || '',
      email: u.email || '',
      telefono: u.telefono || '',
      profilo_id: u.profilo_id || '',
      attivo: u.attivo !== false,
    })
    setModale(true)
  }

  const salva = async (e) => {
    e.preventDefault()
    if (!form.nome.trim()) return toast.error('Indica il nome della persona.')
    if (!form.email.trim()) return toast.error("Indica l'e-mail: è la chiave dell'accesso.")

    setSalvando(true)
    const payload = {
      nome: form.nome.trim(),
      email: form.email.trim().toLowerCase(),
      telefono: form.telefono.trim() || null,
      profilo_id: form.profilo_id || null,
      attivo: form.attivo,
      updated_at: new Date().toISOString(),
    }

    const { error } = inModifica
      ? await supabase.from('utenti').update(payload).eq('id', inModifica.id)
      : await supabase.from('utenti').insert([payload])

    setSalvando(false)
    if (error) {
      const messaggio = error.message?.includes('duplicate')
        ? 'Esiste già un utente con questa e-mail.'
        : `Errore nel salvataggio: ${error.message}`
      return toast.error(messaggio)
    }

    toast.success(inModifica ? 'Utente aggiornato.' : 'Utente registrato. Ora puoi inviargli l’invito.')
    setModale(false)
    carica()
  }

  const elimina = async (u) => {
    const ok = await confirm({
      titolo: 'Rimuovere l’utente?',
      messaggio: `${u.nome} non comparirà più qui. Attenzione: se ha già un account Supabase, questo resta attivo — per bloccarlo del tutto vai su Authentication → Users nel pannello Supabase. Per togliergli solo l’accesso alle sezioni, usa l’interruttore di stato.`,
      testoConferma: 'Sì, rimuovi',
      intent: 'danger',
    })
    if (!ok) return

    const { error } = await supabase.from('utenti').delete().eq('id', u.id)
    if (error) return toast.error(`Errore: ${error.message}`)
    toast.success('Utente rimosso.')
    setUtenti((prev) => prev.filter((x) => x.id !== u.id))
  }

  const alternaStato = async (u) => {
    const nuovo = u.attivo === false
    const { error } = await supabase.from('utenti').update({ attivo: nuovo }).eq('id', u.id)
    if (error) return toast.error(`Errore: ${error.message}`)
    setUtenti((prev) => prev.map((x) => (x.id === u.id ? { ...x, attivo: nuovo } : x)))
  }

  /**
   * Invito via e-mail.
   *
   * Non si possono creare account dal browser: servirebbe la service_role key,
   * che non deve mai stare nel codice pubblico. Con `signInWithOtp` Supabase
   * crea l'account (se non esiste) e manda un link d'accesso alla persona,
   * senza toccare la sessione di chi sta invitando.
   */
  const invita = async (u) => {
    const ok = await confirm({
      titolo: 'Inviare l’invito?',
      messaggio: `Sarà inviata un’e-mail a ${u.email} con un link per entrare nel gestionale. Il link vale per un accesso e scade dopo poco tempo.`,
      testoConferma: 'Sì, invia',
    })
    if (!ok) return

    setInvitando(u.id)
    const { error } = await supabase.auth.signInWithOtp({
      email: u.email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/admin/dashboard`,
      },
    })
    setInvitando(null)

    if (error) {
      const messaggio = error.message?.includes('Signups not allowed')
        ? 'Le registrazioni sono disattivate nel pannello Supabase (Authentication → Providers → Email).'
        : error.message?.includes('rate')
          ? 'Troppe richieste: riprova tra qualche minuto.'
          : error.message
      return toast.error(`Invito non inviato: ${messaggio}`)
    }

    toast.success(`Invito inviato a ${u.email}.`)
  }

  const filtrati = useMemo(() => {
    const q = cerca.trim().toLowerCase()
    if (!q) return utenti
    return utenti.filter(
      (u) =>
        u.nome?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.profilo?.nome?.toLowerCase().includes(q)
    )
  }, [utenti, cerca])

  const colonne = [
    {
      key: 'nome',
      label: 'Persona',
      render: (u) => (
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
            style={{ backgroundColor: u.profilo?.colore || '#7D8496' }}
          >
            {iniziali(u.nome)}
          </span>
          <div className="min-w-0">
            <div className="truncate font-bold text-ink">{u.nome}</div>
            <div className="truncate text-[12px] text-ink-muted-48">{u.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'profilo',
      label: 'Profilo',
      render: (u) =>
        u.profilo ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11.5px] font-bold"
            style={{ color: u.profilo.colore, backgroundColor: `${u.profilo.colore}15` }}
          >
            <Icon name={u.profilo.sistema ? 'workspace_premium' : 'shield_person'} className="text-[13px]" />
            {u.profilo.nome}
          </span>
        ) : (
          <span className="text-[12px] font-semibold text-amber-600">Senza profilo</span>
        ),
    },
    {
      key: 'account',
      label: 'Account',
      render: (u) =>
        u.auth_user_id ? (
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700">
            <Icon name="verified" className="text-[15px]" />
            Attivo
          </span>
        ) : (
          <button
            type="button"
            onClick={() => invita(u)}
            disabled={invitando === u.id}
            className="inline-flex items-center gap-1.5 rounded-lg border border-hairline px-2.5 py-1 text-[11.5px] font-bold text-ink-muted-80 transition-all hover:bg-canvas-parchment hover:text-ink disabled:opacity-50"
          >
            <Icon
              name={invitando === u.id ? 'progress_activity' : 'send'}
              className={`text-[14px] ${invitando === u.id ? 'animate-spin' : ''}`}
            />
            Invia invito
          </button>
        ),
    },
    { key: 'ultimo_accesso', label: 'Ultimo accesso', render: (u) => (
      <span className="text-[12.5px] text-ink-muted-80">{fmtAccesso(u.ultimo_accesso)}</span>
    ) },
    {
      key: 'attivo',
      label: 'Stato',
      render: (u) => <StatusToggle attivo={u.attivo !== false} onToggle={() => alternaStato(u)} />,
    },
  ]

  return (
    <AdminLayout modulo="Utenti" titolo="Utenti" icona="manage_accounts" accent={ROSA}>
      <div className="mx-auto max-w-[1400px]">
        <PageTitle
          titolo="Utenti"
          sottotitolo="Le persone abilitate al gestionale e il profilo di accesso di ciascuna."
        >
          {!setupNeeded && !loading && (
            <BtnPrimary onClick={apriNuovo}>
              <Icon name="add" className="text-[18px]" />
              Nuovo utente
            </BtnPrimary>
          )}
        </PageTitle>

        {/* Come funziona davvero l'accesso */}
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-pink-500/25 bg-pink-50 p-4">
          <Icon name="key" className="mt-0.5 shrink-0 text-[20px] text-pink-700" />
          <div className="text-[13px] leading-relaxed text-pink-900">
            <strong className="font-bold">Come si dà l’accesso.</strong> Registra qui la persona con la sua e-mail e
            scegli il profilo, poi premi <em>Invia invito</em>: riceverà un link per entrare. L’account vero e proprio
            vive in Supabase e non si crea da questa pagina, perché servirebbe una chiave di amministrazione che non
            può stare nel browser.{' '}
            <Link to="/admin/utenti/profili" className="font-bold underline">
              Configura i profili
            </Link>
            .
          </div>
        </div>

        {loading ? (
          <Loading testo="Caricamento utenti…" accent={ROSA} />
        ) : setupNeeded ? (
          <SetupPanel tabelle={['utenti', 'profili']} script="supabase_utenti.sql" />
        ) : (
          <>
            <ControlBar
              valore={cerca}
              onCerca={setCerca}
              placeholder="Cerca per nome, e-mail o profilo…"
              vista={vista}
              onVista={setVista}
              conteggio={filtrati.length}
              etichettaConteggio={filtrati.length === 1 ? 'utente' : 'utenti'}
              accent={ROSA}
            />

            {filtrati.length === 0 ? (
              <Panel padding={false}>
                <EmptyState
                  icona="group"
                  titolo={cerca ? 'Nessun risultato' : 'Nessun utente registrato'}
                  testo={
                    cerca
                      ? 'Prova a cambiare i termini di ricerca.'
                      : 'Registra le persone che devono usare il gestionale.'
                  }
                >
                  {!cerca && (
                    <BtnPrimary onClick={apriNuovo}>
                      <Icon name="add" className="text-[18px]" />
                      Registra utente
                    </BtnPrimary>
                  )}
                </EmptyState>
              </Panel>
            ) : vista === 'lista' ? (
              <Table colonne={colonne} righe={filtrati} onModifica={apriModifica} onElimina={elimina} />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtrati.map((u) => (
                  <article
                    key={u.id}
                    className="overflow-hidden rounded-2xl border border-hairline bg-surface-pearl p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className="flex h-14 w-14 items-center justify-center rounded-2xl text-[16px] font-bold text-white shadow-sm"
                        style={{ backgroundColor: u.profilo?.colore || '#7D8496' }}
                      >
                        {iniziali(u.nome)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => apriModifica(u)}
                          aria-label="Modifica"
                          title="Modifica"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline text-ink-muted-80 transition-all hover:bg-canvas-parchment hover:text-ink active:scale-90"
                        >
                          <Icon name="edit" className="text-[16px]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => elimina(u)}
                          aria-label="Rimuovi"
                          title="Rimuovi"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/30 text-red-500 transition-all hover:bg-red-500/10 active:scale-90"
                        >
                          <Icon name="delete" className="text-[16px]" />
                        </button>
                      </div>
                    </div>

                    <h3 className="mt-4 truncate text-[16px] font-bold text-ink">{u.nome}</h3>
                    <p className="truncate text-[12.5px] text-ink-muted-48">{u.email}</p>

                    <div className="mt-4 space-y-2.5 border-t border-hairline pt-4">
                      {u.profilo ? (
                        <span
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11.5px] font-bold"
                          style={{ color: u.profilo.colore, backgroundColor: `${u.profilo.colore}15` }}
                        >
                          <Icon name="shield_person" className="text-[13px]" />
                          {u.profilo.nome}
                        </span>
                      ) : (
                        <span className="text-[12px] font-semibold text-amber-600">Senza profilo</span>
                      )}

                      <p className="flex items-center gap-2 text-[12px] text-ink-muted-80">
                        <Icon name="schedule" className="text-[15px] opacity-60" />
                        {fmtAccesso(u.ultimo_accesso)}
                      </p>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <StatusToggle attivo={u.attivo !== false} onToggle={() => alternaStato(u)} />
                        {!u.auth_user_id && (
                          <button
                            type="button"
                            onClick={() => invita(u)}
                            disabled={invitando === u.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-hairline px-2.5 py-1 text-[11px] font-bold text-ink-muted-80 transition-all hover:text-ink disabled:opacity-50"
                          >
                            <Icon
                              name={invitando === u.id ? 'progress_activity' : 'send'}
                              className={`text-[14px] ${invitando === u.id ? 'animate-spin' : ''}`}
                            />
                            Invito
                          </button>
                        )}
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
          titolo={inModifica ? `Modifica ${inModifica.nome}` : 'Nuovo utente'}
          sottotitolo="Dati della persona e profilo di accesso"
          icona="person_add"
          accent={ROSA}
        >
          <form onSubmit={salva} className="flex flex-col gap-4">
            <div className="max-h-[65vh] overflow-y-auto pr-1 space-y-4">
              <Field label="Nome e cognome" obbligatorio>
                <input
                  type="text"
                  required
                  autoFocus
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  className={inputClass}
                />
              </Field>

              <Field
                label="E-mail"
                obbligatorio
                hint={
                  inModifica?.auth_user_id
                    ? 'Cambiando l’e-mail il collegamento con l’account esistente si perde.'
                    : 'È con questa e-mail che la persona entrerà nel gestionale.'
                }
              >
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className={inputClass}
                />
              </Field>

              <Field label="Telefono">
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
                  className={inputClass}
                />
              </Field>

              <Field
                label="Profilo di accesso"
                hint={!form.profilo_id ? 'Senza profilo la persona vede tutto il gestionale.' : undefined}
              >
                <CustomSelect
                  value={form.profilo_id}
                  onChange={(v) => setForm((f) => ({ ...f, profilo_id: v }))}
                  placeholder="Scegli un profilo…"
                  accent={ROSA}
                  options={[
                    { value: '', label: 'Senza profilo — accesso completo' },
                    ...profili.map((p) => ({ value: p.id, label: p.nome, color: p.colore })),
                  ]}
                />
              </Field>

              {/* Anteprima di ciò che vedrà */}
              {form.profilo_id && (
                <div className="rounded-xl border border-hairline bg-canvas-parchment p-3">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted-48">
                    Cosa vedrà nel menu
                  </p>
                  <AnteprimaPermessi profiloId={form.profilo_id} />
                </div>
              )}

              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={form.attivo}
                  onChange={(e) => setForm((f) => ({ ...f, attivo: e.target.checked }))}
                  className="h-4 w-4 accent-[#DB2777]"
                />
                <span className="text-[13px] font-semibold text-ink">Utente attivo</span>
              </label>

              {inModifica?.created_at && (
                <p className="text-[11px] text-ink-muted-48">Registrato il {fmtData(inModifica.created_at)}</p>
              )}
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

/* ------------------------------------------------------------------ */
/* Anteprima dei permessi del profilo scelto                           */
/* ------------------------------------------------------------------ */

function AnteprimaPermessi({ profiloId }) {
  const [profilo, setProfilo] = useState(null)

  useEffect(() => {
    let annullato = false
    supabase
      .from('profili')
      .select('permessi, sistema')
      .eq('id', profiloId)
      .maybeSingle()
      .then(({ data }) => {
        if (!annullato) setProfilo(data)
      })
    return () => {
      annullato = true
    }
  }, [profiloId])

  if (!profilo) return <p className="text-[12px] text-ink-muted-48">…</p>

  return (
    <ul className="flex flex-wrap gap-1.5">
      {MODULI.map((m) => {
        const livello = profilo.sistema ? 'completo' : profilo.permessi?.[m.nome] || 'nessuno'
        const meta = LIVELLI.find((l) => l.key === livello)
        return (
          <li
            key={m.nome}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold"
            style={{ color: meta.colore, backgroundColor: `${meta.colore}12` }}
            title={meta.label}
          >
            <Icon name={meta.icona} className="text-[12px]" />
            {m.nome}
          </li>
        )
      })}
    </ul>
  )
}
