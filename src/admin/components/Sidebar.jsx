import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { MENU_SECTIONS } from '../theme'
import { usePermessi } from '../hooks/usePermessi'
import Icon from '../../components/Icon'

/* ------------------------------------------------------------------ */
/* Voce singola (Pillola Dorata quando attiva)                        */
/* ------------------------------------------------------------------ */

function NavItem({ item, collapsed, onNavigate }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/admin/dashboard'}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-xl py-2.5 transition-all duration-300 ${
          collapsed ? 'justify-center px-0' : 'px-3.5'
        } ${
          isActive
            ? 'bg-gradient-to-r from-[#D4AF37] to-[#C59B27] text-ink-950 font-bold shadow-[0_4px_20px_rgba(212,175,55,0.35)] scale-[1.02]'
            : 'text-cream-100/70 hover:bg-white/[0.06] hover:text-cream-50 font-medium'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            name={item.icon}
            filled={isActive}
            className={`text-[20px] shrink-0 transition-colors ${
              isActive ? 'text-ink-950 font-bold' : 'text-[#C6A052] group-hover:text-gold-300'
            }`}
          />
          {!collapsed && <span className="truncate text-[13.5px] tracking-tight">{item.label}</span>}

          {/* tooltip quando la barra è compressa */}
          {collapsed && (
            <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg border border-white/10 bg-ink-950 px-3 py-1.5 text-[12px] font-semibold text-cream-50 opacity-0 shadow-lift transition-opacity group-hover:opacity-100">
              {item.label}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

/* ------------------------------------------------------------------ */
/* Sidebar                                                             */
/* ------------------------------------------------------------------ */

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const { puo, utente, profilo } = usePermessi()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data?.user?.email || ''))
  }, [])

  /* Restano solo le sezioni e le voci che il profilo può almeno consultare. */
  const sezioniFiltrate = useMemo(
    () =>
      MENU_SECTIONS.map((sec) => ({
        ...sec,
        items: sec.items.filter((item) => puo(item.modulo)),
      })).filter((sec) => sec.items.length > 0),
    [puo]
  )

  const nomeVisualizzato = utente?.nome || email
  const iniziali = useMemo(() => {
    const base = utente?.nome || email
    if (!base) return '··'
    const parti = base.trim().split(/\s+/)
    if (parti.length > 1) return (parti[0][0] + parti[1][0]).toUpperCase()
    return base.slice(0, 2).toUpperCase()
  }, [utente, email])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/admin', { replace: true })
  }

  const width = collapsed ? 'lg:w-[82px] lg:max-w-none' : 'lg:w-[238px] lg:max-w-none'

  return (
    <>
      {/* velo su mobile */}
      <div
        onClick={onCloseMobile}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-ink-950/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-[260px] flex-col border-r border-white/[0.07] bg-ink-950 transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${width} ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* alone dorato decorativo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 h-56 w-72 -translate-x-1/2 rounded-full bg-gold-400/10 blur-[90px]"
        />

        {/* Maniglia per comprimere / espandere, sul bordo della sidebar */}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Espandi il menu' : 'Comprimi il menu'}
          title={collapsed ? 'Espandi il menu' : 'Comprimi il menu'}
          className="group absolute -right-3.5 top-[84px] z-50 hidden h-7 w-7 items-center justify-center rounded-full border border-hairline bg-surface-pearl text-ink-muted-48 shadow-md transition-all duration-300 hover:border-gold-400 hover:text-gold-600 hover:shadow-lg lg:flex"
        >
          <Icon
            name="chevron_left"
            className={`text-[18px] transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>

        {/* --- Marchio --- */}
        <div
          className={`relative flex h-[72px] shrink-0 items-center border-b border-white/[0.07] ${
            collapsed ? 'justify-center px-2' : 'gap-2 px-4'
          }`}
        >
          <Link to="/admin/dashboard" className="flex min-w-0 items-center gap-2 overflow-hidden">
            {collapsed ? (
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-400 font-headline text-lg font-bold text-ink-950">
                O
              </span>
            ) : (
              <>
                <img src="/images/logo-default-268x75.png" alt="" className="h-7 w-auto shrink-0" />
                <span className="min-w-0 truncate font-headline text-[14px] leading-tight text-white">
                  Chiesa L’Oasi
                </span>
              </>
            )}
          </Link>

          {!collapsed && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Chiudi menu"
              className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-cream-100/50 transition-colors hover:bg-white/5 hover:text-cream-50 lg:hidden"
            >
              <Icon name="close" className="text-[20px]" />
            </button>
          )}
        </div>

        {/* --- Voci di menu raggruppate con icone --- */}
        <nav className="no-scrollbar relative flex-1 space-y-4 overflow-y-auto px-3 py-4">
          {sezioniFiltrate.map((sec, i) => (
            <div key={sec.key || i} className="space-y-1.5">
              {!collapsed ? (
                <div className="flex items-center gap-2 px-3 pt-3 pb-1 text-[11px] font-bold uppercase tracking-widest text-[#C6A052]">
                  <Icon name={sec.icon} className="text-[16px] text-[#C6A052] shrink-0" />
                  <span className="truncate">{sec.group}</span>
                </div>
              ) : (
                i > 0 && <span aria-hidden="true" className="mx-auto my-2 block h-px w-6 bg-white/10" />
              )}

              {sec.items.map((item) => (
                <NavItem key={item.key} item={item} collapsed={collapsed} onNavigate={onCloseMobile} />
              ))}
            </div>
          ))}
        </nav>

        {/* --- Piede: sito, utente, uscita --- */}
        <div className="relative shrink-0 space-y-2 border-t border-white/[0.07] p-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title={collapsed ? 'Vedi il sito' : undefined}
            className={`group flex items-center gap-3 rounded-xl py-2.5 text-cream-100/50 transition-colors hover:bg-white/[0.04] hover:text-gold-300 ${
              collapsed ? 'justify-center px-0' : 'px-3'
            }`}
          >
            <Icon name="open_in_new" className="text-[19px] shrink-0" />
            {!collapsed && <span className="text-[13px] font-semibold">Vedi il sito</span>}
          </a>

          <div
            className={`flex items-center gap-3 rounded-xl bg-white/[0.04] py-2.5 ${
              collapsed ? 'justify-center px-0' : 'px-3'
            }`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-400/15 text-[12px] font-bold text-gold-300">
              {iniziali}
            </span>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold text-cream-50" title={email}>
                  {nomeVisualizzato || 'Utente'}
                </p>
                <p
                  className="truncate text-[10.5px] font-bold uppercase tracking-widest"
                  style={{ color: profilo?.colore || 'rgba(247,243,236,0.3)' }}
                >
                  {profilo?.nome || 'Accesso completo'}
                </p>
              </div>
            )}
            {!collapsed && (
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Esci"
                title="Esci"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-cream-100/40 transition-colors hover:bg-red-500/15 hover:text-red-400"
              >
                <Icon name="logout" className="text-[18px]" />
              </button>
            )}
          </div>

          {collapsed && (
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Esci"
              title="Esci"
              className="flex w-full items-center justify-center rounded-xl py-2.5 text-cream-100/40 transition-colors hover:bg-red-500/15 hover:text-red-400"
            >
              <Icon name="logout" className="text-[19px]" />
            </button>
          )}

        </div>
      </aside>
    </>
  )
}
