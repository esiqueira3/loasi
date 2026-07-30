import { useEffect, useState } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import Icon from './Icon'
import { site } from '../data/site'

function FloatingActions() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 700)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      <button
        type="button"
        aria-label="Torna in cima"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-ink-900/80 text-cream-100 shadow-soft backdrop-blur-md transition-all duration-500 hover:border-gold-400 hover:text-gold-400 ${
          visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
        }`}
      >
        <Icon name="arrow_upward" className="text-[22px]" />
      </button>

      <a
        href={site.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Scrivici su WhatsApp"
        title="Scrivici su WhatsApp"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-400 text-ink-950 shadow-glow transition-transform hover:scale-105 sm:hidden"
      >
        <Icon name="chat" className="text-[24px]" filled />
      </a>
    </div>
  )
}

export default function SiteLayout({ children, transparentNav = false }) {
  return (
    <div className="flex min-h-screen flex-col bg-ink-900">
      <Navbar transparent={transparentNav} />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingActions />
    </div>
  )
}
