import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { navigation, site, social } from '../data/site'
import Icon from './Icon'

function SocialRow({ className = '' }) {
  const links = [
    { href: social.facebook, icon: 'thumb_up', label: 'Facebook' },
    { href: social.instagram, icon: 'photo_camera', label: 'Instagram' },
    { href: social.youtube, icon: 'play_circle', label: 'YouTube' },
  ]
  return (
    <ul className={`flex items-center gap-1 ${className}`}>
      {links.map((l) => (
        <li key={l.label}>
          <a
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={l.label}
            title={l.label}
            className="flex h-9 w-9 items-center justify-center rounded-full text-cream-200/70 transition-colors hover:bg-white/10 hover:text-gold-400"
          >
            <Icon name={l.icon} className="text-[19px]" />
          </a>
        </li>
      ))}
    </ul>
  )
}

export default function Navbar({ transparent = false }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [openGroup, setOpenGroup] = useState(null)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
    setOpenGroup(null)
  }, [location.pathname, location.hash])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const solid = scrolled || !transparent

  return (
    <>
      {/* --- Barra superiore (solo desktop) --- */}
      <div
        className={`fixed inset-x-0 top-0 z-50 hidden border-b border-white/5 bg-ink-950/80 backdrop-blur-md transition-all duration-500 lg:block ${
          scrolled ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <div className="container flex h-11 items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-widest2 text-cream-200/50">
            Latina · Terracina · Gaeta
          </p>
          <div className="flex items-center gap-5">
            <span className="text-[11px] font-semibold uppercase tracking-widest2 text-cream-200/50">
              I nostri social
            </span>
            <SocialRow />
          </div>
        </div>
      </div>

      {/* --- Navbar principale --- */}
      <header
        className={`fixed inset-x-0 z-50 transition-all duration-500 ${scrolled ? 'top-0' : 'lg:top-11 top-0'} ${
          solid
            ? 'border-b border-white/10 bg-ink-950/90 shadow-soft backdrop-blur-xl'
            : 'border-b border-transparent bg-gradient-to-b from-ink-950/70 to-transparent'
        }`}
      >
        <div className="container flex items-center justify-between gap-6 py-3.5">
          <Link to="/" className="shrink-0" aria-label={site.name}>
            <img
              src={site.logo}
              alt={site.name}
              className="h-10 w-auto transition-all duration-500 sm:h-11"
              width="268"
              height="75"
            />
          </Link>

          {/* Menu desktop */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navigation.map((item) => {
              if (item.children) {
                return (
                  <div key={item.label} className="group relative">
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded-full px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest text-cream-100/85 transition-colors hover:text-gold-400"
                    >
                      {item.label}
                      <Icon name="expand_more" className="text-[16px] transition-transform group-hover:rotate-180" />
                    </button>
                    <div className="invisible absolute left-1/2 top-full z-10 w-64 -translate-x-1/2 translate-y-2 pt-2 opacity-0 transition-all duration-300 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                      <ul className="overflow-hidden rounded-2xl border border-white/10 bg-ink-800/95 p-2 shadow-lift backdrop-blur-xl">
                        {item.children.map((child) => (
                          <li key={child.to}>
                            <NavLink
                              to={child.to}
                              className={({ isActive }) =>
                                `block rounded-xl px-4 py-3 text-[13px] font-semibold transition-colors ${
                                  isActive
                                    ? 'bg-gold-400/15 text-gold-300'
                                    : 'text-cream-100/80 hover:bg-white/5 hover:text-gold-300'
                                }`
                              }
                            >
                              {child.label}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
              }

              if (item.external) {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest text-cream-100/85 transition-colors hover:text-gold-400"
                  >
                    {item.label}
                  </a>
                )
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest transition-colors ${
                      isActive && !item.to.includes('#') ? 'text-gold-400' : 'text-cream-100/85 hover:text-gold-400'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={site.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold hidden !px-6 !py-3 sm:inline-flex"
            >
              <Icon name="chat" className="text-[17px]" />
              WhatsApp
            </a>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Chiudi menu' : 'Apri menu'}
              aria-expanded={open}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-cream-100 transition-colors hover:border-gold-400 hover:text-gold-400 lg:hidden"
            >
              <Icon name={open ? 'close' : 'menu'} className="text-[22px]" />
            </button>
          </div>
        </div>
      </header>

      {/* --- Drawer mobile --- */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-ink-950/80 backdrop-blur-sm transition-opacity duration-500 ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <nav
          className={`absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col overflow-y-auto border-l border-white/10 bg-ink-900 pt-24 transition-transform duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <ul className="flex-1 space-y-1 px-5">
            {navigation.map((item) => {
              if (item.children) {
                const isOpen = openGroup === item.label
                return (
                  <li key={item.label}>
                    <button
                      type="button"
                      onClick={() => setOpenGroup(isOpen ? null : item.label)}
                      className="flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-left text-sm font-bold uppercase tracking-widest text-cream-100 transition-colors hover:bg-white/5"
                    >
                      {item.label}
                      <Icon
                        name="expand_more"
                        className={`text-[20px] text-gold-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <ul className={`overflow-hidden pl-4 transition-all duration-300 ${isOpen ? 'max-h-64' : 'max-h-0'}`}>
                      {item.children.map((child) => (
                        <li key={child.to}>
                          <Link
                            to={child.to}
                            className="block rounded-xl px-4 py-3 text-sm text-cream-100/75 transition-colors hover:text-gold-300"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                )
              }

              if (item.external) {
                return (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-xl px-4 py-3.5 text-sm font-bold uppercase tracking-widest text-cream-100 transition-colors hover:bg-white/5 hover:text-gold-400"
                    >
                      {item.label}
                    </a>
                  </li>
                )
              }

              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="block rounded-xl px-4 py-3.5 text-sm font-bold uppercase tracking-widest text-cream-100 transition-colors hover:bg-white/5 hover:text-gold-400"
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>

          <div className="space-y-5 border-t border-white/10 p-5">
            <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="btn-gold w-full">
              <Icon name="chat" className="text-[17px]" />
              Scrivici su WhatsApp
            </a>
            <div className="flex items-center justify-between">
              <SocialRow />
              <Link to="/admin" className="text-[11px] font-bold uppercase tracking-widest text-cream-200/40">
                Area riservata
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </>
  )
}
