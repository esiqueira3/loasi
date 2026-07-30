import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import Icon from '../../components/Icon'
import { Link } from 'react-router-dom'
import { usePermessi } from '../hooks/usePermessi'

const STORAGE_KEY = 'loasi.admin.sidebarCollapsed'

/**
 * Guscio di tutte le schermate del gestionale:
 * sidebar + header appiccicato + area di contenuto scorrevole.
 *
 *   <AdminLayout titolo="Finanze" icona="payments" accent="#107C42">
 *     …contenuto…
 *   </AdminLayout>
 */
/**
 * Blocca chi arriva su una sezione che il suo profilo non prevede,
 * per esempio digitando l'indirizzo a mano.
 */
function Guardia({ modulo, accent, children }) {
  const { caricamento, puo, profilo } = usePermessi()

  if (!modulo) return children
  if (caricamento) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-ink-muted-48">
        <Icon name="progress_activity" className="animate-spin text-[30px]" style={{ color: accent }} />
      </div>
    )
  }
  if (puo(modulo)) return children

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
        <Icon name="lock" className="text-[32px]" />
      </div>
      <h2 className="font-display-lg mb-3 text-[26px] font-light text-ink">Sezione non consentita</h2>
      <p className="text-[14px] leading-relaxed text-ink-muted-80">
        Il profilo <strong className="text-ink">{profilo?.nome || 'assegnato'}</strong> non prevede l'accesso a questa
        sezione. Se ti serve, chiedi al responsabile del gestionale di aggiornare i permessi.
      </p>
      <Link
        to="/admin/dashboard"
        className="mt-8 inline-flex items-center gap-2 rounded-xl border border-hairline px-5 py-2.5 text-[13px] font-semibold text-ink-muted-80 transition-all hover:bg-canvas-parchment hover:text-ink"
      >
        <Icon name="arrow_back" className="text-[17px]" />
        Torna alla Home
      </Link>
    </div>
  )
}

export default function AdminLayout({
  children,
  titolo,
  icona = 'space_dashboard',
  accent = '#A67C3D',
  azioni,
  modulo,
}) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  })
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <div className="min-h-screen bg-canvas-parchment font-body text-ink">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={`flex min-h-screen flex-col transition-[padding] duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
          collapsed ? 'lg:pl-[82px]' : 'lg:pl-[238px]'
        }`}
      >
        {/* --- Header --- */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-hairline bg-canvas/80 px-4 backdrop-blur-xl lg:h-20 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Apri menu"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-hairline text-ink-muted-80 transition-colors hover:text-ink lg:hidden"
            >
              <Icon name="menu" className="text-[21px]" />
            </button>

            <span className="flex min-w-0 items-center gap-2 font-body-strong text-ink">
              <Icon name={icona} className="shrink-0 text-[20px]" style={{ color: accent }} />
              <span className="truncate text-[14px] lg:text-[15px]">{titolo}</span>
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2 lg:gap-3">{azioni}</div>
        </header>

        {/* --- Contenuto --- */}
        <main className="fade-in flex-1 bg-canvas-parchment p-4 lg:p-10">
          <Guardia modulo={modulo} accent={accent}>
            {children}
          </Guardia>
        </main>
      </div>

    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Titolo di pagina — usato in cima a ogni schermata                   */
/* ------------------------------------------------------------------ */

export function PageTitle({ titolo, sottotitolo, children }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div className="min-w-0">
        <h1 className="font-display-lg mb-2 text-[28px] font-light tracking-tight text-ink lg:text-[40px]">
          {titolo}
        </h1>
        {sottotitolo && (
          <p className="font-body text-[13.5px] text-ink-muted-80 lg:text-[15px]">{sottotitolo}</p>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center justify-end gap-3">{children}</div>}
    </div>
  )
}
