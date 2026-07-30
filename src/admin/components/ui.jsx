import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from '../../components/Icon'

/* ================================================================== */
/* Card KPI                                                            */
/* ================================================================== */

export function Kpi({ icona, tint = '#107C42', valore, etichetta, nota }) {
  return (
    <div className="relative flex min-h-[112px] flex-col justify-between overflow-hidden rounded-2xl border border-hairline bg-surface-pearl p-4 shadow-sm transition-shadow hover:shadow-md">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, ${tint}, transparent)` }}
      />
      <div className="flex items-start justify-between gap-1">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${tint}15`, color: tint }}
        >
          <Icon name={icona} className="text-[20px]" />
        </div>
        {nota && (
          <span className="max-w-[130px] truncate text-right text-[10.5px] font-medium leading-tight text-ink-muted-48">
            {nota}
          </span>
        )}
      </div>
      <div>
        <div className="mt-1.5 truncate text-[18px] font-bold leading-tight tracking-tight text-ink" title={String(valore)}>
          {valore}
        </div>
        <div className="mt-1 truncate text-[10.5px] font-bold uppercase tracking-wider text-ink-muted-80">
          {etichetta}
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/* Contenitore pannello                                                */
/* ================================================================== */

export function Panel({ children, className = '', padding = true }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-hairline bg-surface-pearl shadow-sm ${
        padding ? 'p-4 lg:p-6' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}

export function PanelTitle({ titolo, nota, children }) {
  return (
    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-[13px] font-bold uppercase tracking-wider text-ink">{titolo}</h3>
        {nota && (
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-ink-muted-48">{nota}</p>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </div>
  )
}

/* ================================================================== */
/* Segmented control                                                   */
/* ================================================================== */

export function Segmented({ value, onChange, options, accent = '#107C42', compact = false }) {
  return (
    <div className="flex rounded-xl border border-hairline bg-surface-pearl p-1 text-[13px] font-bold shadow-sm">
      {options.map((o) => {
        const active = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg transition-all md:flex-none ${
              compact ? 'px-3 py-1.5' : 'px-4 py-2'
            } ${active ? 'text-white shadow-md' : 'text-ink-muted-80 hover:text-ink'}`}
            style={active ? { backgroundColor: accent } : undefined}
          >
            {o.icon && <Icon name={o.icon} className="text-[16px]" />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* ================================================================== */
/* Select personalizzata                                               */
/* ================================================================== */

export function CustomSelect({ value, onChange, options, placeholder = 'Seleziona…', accent = '#107C42' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const corrente = useMemo(() => options.find((o) => o.value === value), [options, value])

  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-hairline bg-surface-pearl px-3 py-2.5 text-[13px] font-semibold text-ink shadow-sm transition-colors hover:border-ink-muted-48"
      >
        <span className="truncate">{corrente?.label ?? placeholder}</span>
        <Icon
          name="expand_more"
          className={`shrink-0 text-[18px] text-ink-muted-48 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="fade-in absolute z-50 mt-1.5 max-h-64 w-full overflow-y-auto rounded-xl border border-hairline bg-surface-pearl p-1 shadow-lg"
        >
          {options.map((o) => {
            const active = o.value === value
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(o.value)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${
                    active ? 'font-bold' : 'text-ink-muted-80 hover:bg-canvas-parchment hover:text-ink'
                  }`}
                  style={active ? { color: accent, backgroundColor: `${accent}12` } : undefined}
                >
                  {o.color && (
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: o.color }} />
                  )}
                  <span className="flex-1 truncate">{o.label}</span>
                  {active && <Icon name="check" className="text-[16px]" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/* ================================================================== */
/* Campi di form                                                       */
/* ================================================================== */

export function Field({ label, obbligatorio, children, hint }) {
  return (
    <div>
      <label className="mb-1 block text-[12px] font-bold text-ink-muted-80">
        {label} {obbligatorio && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-ink-muted-48">{hint}</p>}
    </div>
  )
}

export const inputClass =
  'w-full rounded-xl border border-hairline bg-canvas-parchment px-3 py-2 text-[13.5px] text-ink outline-none transition-all focus:border-[#107C42]'

/* ================================================================== */
/* Paginazione                                                         */
/* ================================================================== */

export function Pagination({ currentPage, totalPages, onPageChange }) {
  const pagine = useMemo(() => {
    const out = []
    const push = (p) => out.push(p)
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) push(i)
      return out
    }
    push(1)
    if (currentPage > 3) push('…')
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) push(i)
    if (currentPage < totalPages - 2) push('…')
    push(totalPages)
    return out
  }, [currentPage, totalPages])

  const btn =
    'flex h-9 min-w-[36px] items-center justify-center rounded-lg border border-hairline px-2 text-[13px] font-bold transition-all disabled:opacity-35'

  if (totalPages <= 1) return null

  return (
    <div className="mt-4 flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Pagina precedente"
        className={`${btn} bg-surface-pearl text-ink-muted-80 hover:text-ink`}
      >
        <Icon name="chevron_left" className="text-[18px]" />
      </button>

      {pagine.map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-1 text-[13px] text-ink-muted-48">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`${btn} ${
              p === currentPage
                ? 'border-[#107C42] bg-[#107C42] text-white'
                : 'bg-surface-pearl text-ink-muted-80 hover:text-ink'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Pagina successiva"
        className={`${btn} bg-surface-pearl text-ink-muted-80 hover:text-ink`}
      >
        <Icon name="chevron_right" className="text-[18px]" />
      </button>
    </div>
  )
}

/* ================================================================== */
/* Stati: caricamento, vuoto, errore                                   */
/* ================================================================== */

export function Loading({ testo = 'Caricamento…', accent = '#107C42' }) {
  return (
    <div className="flex h-[50vh] flex-col items-center justify-center gap-3 text-ink-muted-48">
      <Icon name="progress_activity" className="animate-spin text-[32px]" style={{ color: accent }} />
      <span className="text-[14px] font-medium">{testo}</span>
    </div>
  )
}

export function EmptyState({ icona = 'inbox', titolo, testo, children }) {
  return (
    <div className="flex flex-col items-center p-16 text-center">
      <Icon name={icona} className="mb-3 text-[42px] text-ink-muted-48 opacity-30" />
      <p className="mb-1 font-semibold text-ink">{titolo}</p>
      {testo && <p className="mb-4 max-w-sm text-[13px] text-ink-muted-48">{testo}</p>}
      {children}
    </div>
  )
}

export function SetupPanel({ tabelle = [], script }) {
  return (
    <Panel className="p-10 text-center lg:p-14">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500">
        <Icon name="database" className="text-[32px]" />
      </div>
      <h3 className="font-display-lg mb-3 text-[24px] font-light text-ink">Configurazione richiesta</h3>
      <p className="mx-auto max-w-lg text-[14px] leading-relaxed text-ink-muted-80">
        {tabelle.length > 0 && (
          <>
            {tabelle.length === 1 ? 'La tabella ' : 'Le tabelle '}
            {tabelle.map((t, i) => (
              <span key={t}>
                <code className="rounded bg-canvas-parchment px-1.5 py-0.5 font-mono text-[13px] text-ink">{t}</code>
                {i < tabelle.length - 2 ? ', ' : i === tabelle.length - 2 ? ' e ' : ''}
              </span>
            ))}
            {tabelle.length === 1 ? ' non esiste ancora' : ' non esistono ancora'} nel database Supabase.
          </>
        )}
      </p>
      {script && (
        <p className="mt-5 text-[13px] text-ink-muted-48">
          Esegui lo script <strong className="text-ink">{script}</strong> nel SQL Editor di Supabase e ricarica questa
          pagina.
        </p>
      )}
    </Panel>
  )
}

/* ================================================================== */
/* Modale                                                              */
/* ================================================================== */

export function Modal({ children, onClose, larghezza = 'max-w-md', titolo, sottotitolo, icona, accent = '#107C42' }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  /* Il modale viene montato in fondo al <body>.
     Dentro l'albero del gestionale ci sono antenati con animazioni di
     `transform` (la classe .fade-in): un antenato trasformato diventa il blocco
     di contenimento dei figli `position: fixed`, e il modale finirebbe
     ancorato a quello invece che alla finestra — tagliato in alto e in basso. */
  return createPortal(
    <div
      className="fade-in fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/60 p-4 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`my-auto w-full ${larghezza} rounded-2xl border border-hairline bg-surface-pearl p-6 font-body text-ink shadow-2xl`}
      >
        {titolo && (
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {icona && (
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${accent}15`, color: accent }}
                >
                  <Icon name={icona} className="text-[20px]" />
                </div>
              )}
              <div>
                <h3 className="text-[17px] font-bold text-ink">{titolo}</h3>
                {sottotitolo && <p className="text-[12px] text-ink-muted-48">{sottotitolo}</p>}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Chiudi"
              className="rounded-lg p-1 text-ink-muted-48 transition-colors hover:text-ink"
            >
              <Icon name="close" className="text-[18px]" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  )
}

/* ================================================================== */
/* Bottoni                                                             */
/* ================================================================== */

export function BtnPrimary({ children, accent = '#107C42', className = '', ...rest }) {
  return (
    <button
      type="button"
      {...rest}
      style={{ backgroundColor: accent }}
      className={`flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[14px] font-bold text-white shadow-md transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

export function BtnGhost({ children, className = '', ...rest }) {
  return (
    <button
      type="button"
      {...rest}
      className={`flex items-center justify-center gap-2 rounded-xl border border-hairline px-4 py-2 text-[13px] font-semibold text-ink-muted-80 transition-all hover:bg-canvas-parchment hover:text-ink disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  )
}

export function BtnDanger({ children, className = '', ...rest }) {
  return (
    <button
      type="button"
      {...rest}
      className={`flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-[13px] font-semibold text-red-500 transition-all hover:bg-red-500/20 disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  )
}

/* ================================================================== */
/* Barra di controllo: ricerca · vista · conteggio                     */
/* ================================================================== */

export function ControlBar({
  valore,
  onCerca,
  placeholder = 'Cerca…',
  vista,
  onVista,
  conteggio,
  etichettaConteggio,
  accent = '#107C42',
  children,
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
      <div className="relative flex-1">
        <Icon
          name="search"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] text-ink-muted-48"
        />
        <input
          type="search"
          value={valore}
          onChange={(e) => onCerca(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-hairline bg-surface-pearl py-2.5 pl-11 pr-3 text-[13.5px] text-ink shadow-sm outline-none transition-colors focus:border-[color:var(--accent)]"
          style={{ '--accent': accent }}
        />
      </div>

      <div className="flex items-center gap-2">
        {children}

        {conteggio !== undefined && (
          <span
            className="whitespace-nowrap rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-widest"
            style={{ color: accent, backgroundColor: `${accent}12`, borderColor: `${accent}33` }}
          >
            {conteggio} {etichettaConteggio}
          </span>
        )}

        {vista && (
          <div className="flex rounded-xl border border-hairline bg-surface-pearl p-1 shadow-sm">
            {[
              { v: 'lista', icona: 'view_list', label: 'Vista elenco' },
              { v: 'griglia', icona: 'grid_view', label: 'Vista schede' },
            ].map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => onVista(o.v)}
                aria-label={o.label}
                title={o.label}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                  vista === o.v ? 'text-white' : 'text-ink-muted-48 hover:text-ink'
                }`}
                style={vista === o.v ? { backgroundColor: accent } : undefined}
              >
                <Icon name={o.icona} className="text-[18px]" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ================================================================== */
/* Tabella                                                             */
/* ================================================================== */

export function Table({ colonne, righe, onModifica, onElimina, chiave = 'id' }) {
  return (
    <Panel padding={false}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="border-b border-hairline bg-canvas-parchment/60">
              {colonne.map((c) => (
                <th
                  key={c.key}
                  className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-ink-muted-48"
                >
                  {c.label}
                </th>
              ))}
              {(onModifica || onElimina) && (
                <th className="w-px px-5 py-3 text-right text-[10px] font-black uppercase tracking-widest text-ink-muted-48">
                  Azioni
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {righe.map((r) => (
              <tr key={r[chiave]} className="transition-colors hover:bg-canvas-parchment/50">
                {colonne.map((c) => (
                  <td key={c.key} className="px-5 py-3.5 align-middle text-[13.5px] text-ink">
                    {c.render ? c.render(r) : (r[c.key] ?? '—')}
                  </td>
                ))}
                {(onModifica || onElimina) && (
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-2">
                      {onModifica && (
                        <button
                          type="button"
                          onClick={() => onModifica(r)}
                          aria-label="Modifica"
                          title="Modifica"
                          className="rounded-lg border border-hairline p-2 text-ink-muted-80 transition-all hover:bg-canvas-parchment hover:text-ink"
                        >
                          <Icon name="edit" className="text-[16px]" />
                        </button>
                      )}
                      {onElimina && (
                        <button
                          type="button"
                          onClick={() => onElimina(r)}
                          aria-label="Elimina"
                          title="Elimina"
                          className="rounded-lg border border-red-500/30 p-2 text-red-500 transition-all hover:bg-red-500/10"
                        >
                          <Icon name="delete" className="text-[16px]" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

/* ================================================================== */
/* Interruttore di stato attivo / non attivo                           */
/* ================================================================== */

export function StatusToggle({ attivo, onToggle, etichette = ['Attivo', 'Non attivo'] }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[9.5px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${
        attivo
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-red-200 bg-red-50 text-red-600'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${attivo ? 'animate-pulse bg-emerald-500' : 'bg-red-500'}`} />
      {attivo ? etichette[0] : etichette[1]}
    </button>
  )
}

/* ================================================================== */
/* Etichetta di stato                                                  */
/* ================================================================== */

export function Pill({ label, color, bg }) {
  return (
    <span
      className="whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold"
      style={{ color, backgroundColor: bg }}
    >
      {label}
    </span>
  )
}
