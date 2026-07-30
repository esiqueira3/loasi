import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { MENU } from '../theme'
import Icon from '../../components/Icon'

/* ------------------------------------------------------------------ */
/* Voce singola                                                        */
/* ------------------------------------------------------------------ */

function NavItem({ item, collapsed, onNavigate }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/admin/dashboard'}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-xl py-2.5 transition-all duration-200 ${
          collapsed ? 'justify-center px-0' : 'px-3'
        } ${
          isActive
            ? 'bg-white/[0.07] text-gold-300'
            : 'text-cream-100/55 hover:bg-white/[0.04] hover:text-cream-50'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {/* barretta dorata sull'elemento attivo */}
          <span
            aria-hidden="true"
            className={`absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-gold-400 transition-all duration-300 ${
              isActive ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <Icon
            name={item.icon}
            filled={isActive}
            className={`text-[21px] shrink-0 transition-colors ${isActive ? 'text-gold-400' : ''}`}
          />
          {!collapsed && <span className="truncate text-[13.5px] font-semibold">{item.label}</span>}

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
/* Gruppo con sottovoci (es. Finanze → Panoramica · Categorie)         */
/* ------------------------------------------------------------------ */

function NavGroup({ item, collapsed, onNavigate }) {
  const { pathname } = useLocation()
  const groupActive = item.children.some((c) => pathname === c.to || pathname.startsWith(`${c.to}/`))
  const [open, setOpen] = useState(groupActive)

  useEffect(() => {
    if (groupActive) setOpen(true)
  }, [groupActive])

  /* Compressa: il gruppo diventa una lista di icone singole. */
  if (collapsed) {
    return (
      <div className="space-y-1">
        <span aria-hidden="true" className="mx-auto block h-px w-6 bg-white/10" />
        {item.children.map((child) => (
          <NavItem key={child.key} item={child} collapsed onNavigate={onNavigate} />
        ))}
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
          groupActive ? 'text-gold-300' : 'text-cream-100/55 hover:bg-white/[0.04] hover:text-cream-50'
        }`}
      >
        <Icon
          name={item.icon}
          filled={groupActive}
          className={`text-[21px] shrink-0 ${groupActive ? 'text-gold-400' : ''}`}
        />
        <span className="flex-1 truncate text-left text-[13.5px] font-semibold">{item.label}</span>
        <Icon
          name="expand_more"
          className={`text-[18px] transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        className={`grid transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <ul className="overflow-hidden">
          <div className="ml-[22px] space-y-0.5 border-l border-white/10 pl-3 pt-1">
            {item.children.map((child) => (
              <li key={child.key}>
                <NavLink
                  to={child.to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                      isActive
                        ? 'bg-gold-400/10 font-semibold text-gold-300'
                        : 'text-cream-100/45 hover:text-cream-50'
                    }`
                  }
                >
                  <Icon name={child.icon} className="text-[17px] shrink-0" />
                  <span className="truncate">{child.label}</span>
                </NavLink>
              </li>
            ))}
          </div>
        </ul>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Sidebar                                                             */
/* ------------------------------------------------------------------ */

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data?.user?.email || ''))
  }, [])

  const iniziali = useMemo(() => {
    if (!email) return '··'
    return email.slice(0, 2).toUpperCase()
  }, [email])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/admin', { replace: true })
  }

  const width = collapsed ? 'lg:w-[82px]' : 'lg:w-[268px]'

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
        className={`fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col border-r border-white/[0.07] bg-ink-950 transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${width} ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* alone dorato decorativo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 h-56 w-72 -translate-x-1/2 rounded-full bg-gold-400/10 blur-[90px]"
        />

        {/* --- Marchio --- */}
        <div
          className={`relative flex h-[72px] shrink-0 items-center border-b border-white/[0.07] ${
            collapsed ? 'justify-center px-2' : 'gap-3 px-5'
          }`}
        >
          <Link to="/admin/dashboard" className="flex items-center gap-3 overflow-hidden">
            {collapsed ? (
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-400 font-headline text-lg font-bold text-ink-950">
                O
              </span>
            ) : (
              <img src="/images/logo-default-268x75.png" alt="L'Oasi" className="h-9 w-auto" />
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

        {/* --- Voci --- */}
        <nav className="no-scrollbar relative flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {!collapsed && (
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest2 text-cream-100/25">
              Gestione
            </p>
          )}

          {MENU.map((item) =>
            item.children ? (
              <NavGroup key={item.key} item={item} collapsed={collapsed} onNavigate={onCloseMobile} />
            ) : (
              <NavItem key={item.key} item={item} collapsed={collapsed} onNavigate={onCloseMobile} />
            )
          )}
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
                <p className="truncate text-[12.5px] font-semibold text-cream-50">{email || 'Utente'}</p>
                <p className="text-[10.5px] font-bold uppercase tracking-widest text-cream-100/30">Pastore</p>
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

          {/* comprimi / espandi — solo desktop */}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Espandi il menu' : 'Comprimi il menu'}
            className={`hidden w-full items-center gap-3 rounded-xl py-2.5 text-cream-100/35 transition-colors hover:bg-white/[0.04] hover:text-cream-50 lg:flex ${
              collapsed ? 'justify-center px-0' : 'px-3'
            }`}
          >
            <Icon
              name={collapsed ? 'chevron_right' : 'chevron_left'}
              className="text-[19px] shrink-0"
            />
            {!collapsed && <span className="text-[12px] font-semibold">Comprimi</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
