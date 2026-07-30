import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import Icon from '../../components/Icon'
import { ToastHost } from './Toast'
import { ConfirmProvider } from './Confirm'

const STORAGE_KEY = 'loasi.admin.sidebarCollapsed'

/**
 * Guscio di tutte le schermate del gestionale:
 * sidebar + header appiccicato + area di contenuto scorrevole.
 *
 *   <AdminLayout titolo="Finanze" icona="payments" accent="#107C42">
 *     …contenuto…
 *   </AdminLayout>
 */
export default function AdminLayout({ children, titolo, icona = 'space_dashboard', accent = '#A67C3D', azioni }) {
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
    <ConfirmProvider>
    <div className="min-h-screen bg-canvas-parchment font-body text-ink">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={`flex min-h-screen flex-col transition-[padding] duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
          collapsed ? 'lg:pl-[82px]' : 'lg:pl-[268px]'
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
        <main className="fade-in flex-1 bg-canvas-parchment p-4 lg:p-10">{children}</main>
      </div>

      <ToastHost />
    </div>
    </ConfirmProvider>
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
