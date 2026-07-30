import { useEffect, useMemo, useRef, useState } from 'react'
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

  return (
    <div
      className="fade-in fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${larghezza} max-h-[92vh] overflow-y-auto rounded-2xl border border-hairline bg-surface-pearl p-6 shadow-2xl`}
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
    </div>
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
