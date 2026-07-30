import { useMemo, useState } from 'react'
import Icon from '../../../components/Icon'
import { BtnGhost, CustomSelect, Field, Modal, inputClass } from '../../components/ui'
import { OGGI, fmtData, fmtMoney, toISO } from '../../theme'
import { costruisciRate, isEntrata } from '../../hooks/useFinanze'

const VERDE = '#107C42'
const ROSSO = '#EF4444'

function BottoneSalva({ inCorso, children = 'Salva', accent = VERDE }) {
  return (
    <button
      type="submit"
      disabled={inCorso}
      style={{ backgroundColor: accent }}
      className="flex items-center gap-2 rounded-xl px-5 py-2 text-[13px] font-bold text-white transition-all hover:brightness-110 disabled:opacity-50"
    >
      <Icon
        name={inCorso ? 'progress_activity' : 'check'}
        className={`text-[16px] ${inCorso ? 'animate-spin' : ''}`}
      />
      {children}
    </button>
  )
}

/* ================================================================== */
/* Nuovo movimento                                                     */
/* ================================================================== */

export function NuovoMovimentoModal({ onClose, onSave, categorie, chiese = [], chiesaPredefinita = '' }) {
  const [form, setForm] = useState({
    descrizione: '',
    tipo: 'entrata',
    categoria_id: '',
    igreja_id: chiesaPredefinita,
    importo: '',
    numero_rate: 1,
    prima_scadenza: toISO(OGGI),
    note: '',
  })
  const [salvando, setSalvando] = useState(false)
  const [errore, setErrore] = useState(null)

  const opzioniCategoria = useMemo(
    () =>
      categorie
        .filter((c) => c.tipo === form.tipo)
        .map((c) => ({ value: c.id, label: c.nome, color: c.colore })),
    [categorie, form.tipo]
  )

  const anteprima = useMemo(() => {
    const importo = Number(form.importo)
    if (!importo || importo <= 0) return []
    return costruisciRate({
      totale: importo,
      numero: form.numero_rate,
      primaScadenza: form.prima_scadenza,
    })
  }, [form.importo, form.numero_rate, form.prima_scadenza])

  const accent = form.tipo === 'entrata' ? VERDE : ROSSO

  const submit = async (e) => {
    e.preventDefault()
    setErrore(null)

    const importo = Number(form.importo)
    if (!form.descrizione.trim()) return setErrore('Indica una descrizione.')
    if (!form.igreja_id) return setErrore('Indica a quale comunità appartiene il movimento.')
    if (!importo || importo <= 0) return setErrore("Indica un importo maggiore di zero.")
    if (!form.prima_scadenza) return setErrore('Indica la data della prima scadenza.')

    setSalvando(true)
    // "generale" non è una comunità: in banca dati resta NULL.
    const res = await onSave({
      ...form,
      importo,
      igreja_id: form.igreja_id === 'generale' ? null : form.igreja_id,
    })
    setSalvando(false)

    if (res?.error) setErrore(res.error.message)
    else onClose()
  }

  return (
    <Modal
      onClose={onClose}
      larghezza="max-w-lg"
      titolo="Nuovo movimento"
      sottotitolo="Entrata o uscita, con una o più rate"
      icona="add_card"
      accent={accent}
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        {errore && (
          <div className="flex items-center gap-2 rounded-xl border-l-4 border-amber-500 bg-amber-50 p-3 text-[12.5px] font-semibold text-amber-800">
            <Icon name="info" className="text-[18px]" />
            {errore}
          </div>
        )}

        <Field label="Tipo di movimento" obbligatorio>
          <div className="grid grid-cols-2 gap-2">
            {[
              { tipo: 'entrata', label: 'Entrata', icona: 'arrow_upward', colore: VERDE },
              { tipo: 'uscita', label: 'Uscita', icona: 'arrow_downward', colore: ROSSO },
            ].map((o) => {
              const attivo = form.tipo === o.tipo
              return (
                <button
                  key={o.tipo}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, tipo: o.tipo, categoria_id: '' }))}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[13px] font-bold transition-all ${
                    attivo ? '' : 'border-hairline text-ink-muted-80'
                  }`}
                  style={
                    attivo
                      ? { borderColor: o.colore, backgroundColor: `${o.colore}15`, color: o.colore }
                      : undefined
                  }
                >
                  <Icon name={o.icona} className="text-[15px]" />
                  {o.label}
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="Descrizione" obbligatorio>
          <input
            type="text"
            required
            autoFocus
            value={form.descrizione}
            onChange={(e) => setForm((f) => ({ ...f, descrizione: e.target.value }))}
            placeholder={form.tipo === 'entrata' ? 'Es.: Offerte del culto domenicale' : 'Es.: Affitto locale — marzo'}
            className={inputClass}
          />
        </Field>

        <Field label="Comunità" obbligatorio hint="Serve per la vista per comunità e i totali separati.">
          <CustomSelect
            value={form.igreja_id}
            onChange={(v) => setForm((f) => ({ ...f, igreja_id: v }))}
            placeholder="Scegli la comunità…"
            options={[
              ...chiese.map((c) => ({ value: c.id, label: c.cidade })),
              { value: 'generale', label: 'Generale — tutte le comunità' },
            ]}
            accent={accent}
          />
        </Field>

        <Field
          label="Categoria"
          hint={opzioniCategoria.length === 0 ? 'Nessuna categoria di questo tipo: creale nella pagina Categorie.' : undefined}
        >
          <CustomSelect
            value={form.categoria_id}
            onChange={(v) => setForm((f) => ({ ...f, categoria_id: v }))}
            options={[{ value: '', label: 'Senza categoria' }, ...opzioniCategoria]}
            accent={accent}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Importo totale (€)" obbligatorio>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={form.importo}
              onChange={(e) => setForm((f) => ({ ...f, importo: e.target.value }))}
              placeholder="0,00"
              className={inputClass}
            />
          </Field>

          <Field label="Numero di rate" obbligatorio>
            <input
              type="number"
              required
              min="1"
              max="60"
              value={form.numero_rate}
              onChange={(e) => setForm((f) => ({ ...f, numero_rate: Math.max(1, Number(e.target.value) || 1) }))}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Prima scadenza" obbligatorio>
          <input
            type="date"
            required
            value={form.prima_scadenza}
            onChange={(e) => setForm((f) => ({ ...f, prima_scadenza: e.target.value }))}
            className={inputClass}
          />
        </Field>

        <Field label="Note">
          <textarea
            rows={2}
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            placeholder="Facoltativo"
            className={`${inputClass} resize-none`}
          />
        </Field>

        {anteprima.length > 1 && (
          <div className="rounded-xl border border-hairline bg-canvas-parchment p-3">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted-48">
              Anteprima delle rate
            </p>
            <ul className="max-h-32 space-y-1 overflow-y-auto">
              {anteprima.map((r) => (
                <li key={r.numero} className="flex justify-between text-[12.5px] text-ink-muted-80">
                  <span>
                    Rata {r.numero}/{r.totale_rate} · {fmtData(r.scadenza)}
                  </span>
                  <span className="font-bold text-ink">{fmtMoney(r.importo)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-2 flex justify-end gap-2 border-t border-hairline pt-3">
          <BtnGhost type="button" onClick={onClose}>
            Annulla
          </BtnGhost>
          <BottoneSalva inCorso={salvando} accent={accent}>
            Registra movimento
          </BottoneSalva>
        </div>
      </form>
    </Modal>
  )
}

/* ================================================================== */
/* Saldo di una rata                                                   */
/* ================================================================== */

const MODALITA = ['Contanti', 'Bonifico', 'Carta', 'Assegno', 'Altro']

export function SaldaRataModal({ rata, titolo, onClose, onConfirm }) {
  const entrata = isEntrata(titolo)
  const [form, setForm] = useState({
    data: toISO(OGGI),
    importo: String(rata.importo),
    modalita: 'Bonifico',
  })
  const [salvando, setSalvando] = useState(false)
  const [errore, setErrore] = useState(null)

  const accent = entrata ? VERDE : ROSSO

  const submit = async (e) => {
    e.preventDefault()
    setErrore(null)
    const importo = Number(form.importo)
    if (!importo || importo <= 0) return setErrore("Indica l'importo saldato.")

    setSalvando(true)
    const res = await onConfirm(rata, { ...form, importo })
    setSalvando(false)
    if (res?.error) setErrore(res.error.message)
    else onClose()
  }

  return (
    <Modal
      onClose={onClose}
      titolo={entrata ? 'Registra incasso' : 'Registra pagamento'}
      sottotitolo={`${titolo.descrizione} · rata ${rata.numero}/${rata.totale_rate}`}
      icona={entrata ? 'savings' : 'payments'}
      accent={accent}
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        {errore && (
          <div className="rounded-xl border-l-4 border-amber-500 bg-amber-50 p-3 text-[12.5px] font-semibold text-amber-800">
            {errore}
          </div>
        )}

        <div className="rounded-xl border border-hairline bg-canvas-parchment p-3 text-[13px]">
          <div className="flex justify-between">
            <span className="text-ink-muted-80">Importo previsto</span>
            <span className="font-bold text-ink">{fmtMoney(rata.importo)}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-ink-muted-80">Scadenza</span>
            <span className="font-semibold text-ink">{fmtData(rata.scadenza)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={entrata ? 'Data incasso' : 'Data pagamento'} obbligatorio>
            <input
              type="date"
              required
              value={form.data}
              onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
              className={inputClass}
            />
          </Field>
          <Field label="Importo saldato (€)" obbligatorio>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={form.importo}
              onChange={(e) => setForm((f) => ({ ...f, importo: e.target.value }))}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Modalità">
          <CustomSelect
            value={form.modalita}
            onChange={(v) => setForm((f) => ({ ...f, modalita: v }))}
            options={MODALITA.map((m) => ({ value: m, label: m }))}
            accent={accent}
          />
        </Field>

        <div className="mt-2 flex justify-end gap-2 border-t border-hairline pt-3">
          <BtnGhost type="button" onClick={onClose}>
            Annulla
          </BtnGhost>
          <BottoneSalva inCorso={salvando} accent={accent}>
            Conferma
          </BottoneSalva>
        </div>
      </form>
    </Modal>
  )
}

/* ================================================================== */
/* Riprogrammazione rate                                               */
/* ================================================================== */

export function RiprogrammaModal({ titolo, onClose, onConfirm }) {
  const [form, setForm] = useState({
    numero_rate: (titolo.rate || []).length || 1,
    prima_scadenza: titolo.rate?.[0]?.scadenza || toISO(OGGI),
  })
  const [salvando, setSalvando] = useState(false)
  const [errore, setErrore] = useState(null)

  const anteprima = useMemo(
    () =>
      costruisciRate({
        totale: titolo.importo_totale,
        numero: form.numero_rate,
        primaScadenza: form.prima_scadenza,
      }),
    [titolo.importo_totale, form.numero_rate, form.prima_scadenza]
  )

  const submit = async (e) => {
    e.preventDefault()
    setErrore(null)
    setSalvando(true)
    const res = await onConfirm(titolo, form)
    setSalvando(false)
    if (res?.error) setErrore(res.error.message)
    else onClose()
  }

  return (
    <Modal
      onClose={onClose}
      titolo="Riprogramma le rate"
      sottotitolo={`${titolo.descrizione} · ${fmtMoney(titolo.importo_totale)}`}
      icona="layers"
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        {errore && (
          <div className="rounded-xl border-l-4 border-amber-500 bg-amber-50 p-3 text-[12.5px] font-semibold text-amber-800">
            {errore}
          </div>
        )}

        <p className="text-[13px] leading-relaxed text-ink-muted-80">
          Le rate attuali saranno sostituite. L'importo totale non cambia: viene ridiviso sul nuovo numero di rate.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Numero di rate" obbligatorio>
            <input
              type="number"
              required
              min="1"
              max="60"
              value={form.numero_rate}
              onChange={(e) => setForm((f) => ({ ...f, numero_rate: Math.max(1, Number(e.target.value) || 1) }))}
              className={inputClass}
            />
          </Field>
          <Field label="Prima scadenza" obbligatorio>
            <input
              type="date"
              required
              value={form.prima_scadenza}
              onChange={(e) => setForm((f) => ({ ...f, prima_scadenza: e.target.value }))}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="rounded-xl border border-hairline bg-canvas-parchment p-3">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted-48">Nuovo piano</p>
          <ul className="max-h-40 space-y-1 overflow-y-auto">
            {anteprima.map((r) => (
              <li key={r.numero} className="flex justify-between text-[12.5px] text-ink-muted-80">
                <span>
                  Rata {r.numero}/{r.totale_rate} · {fmtData(r.scadenza)}
                </span>
                <span className="font-bold text-ink">{fmtMoney(r.importo)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-2 flex justify-end gap-2 border-t border-hairline pt-3">
          <BtnGhost type="button" onClick={onClose}>
            Annulla
          </BtnGhost>
          <BottoneSalva inCorso={salvando}>Riprogramma</BottoneSalva>
        </div>
      </form>
    </Modal>
  )
}
