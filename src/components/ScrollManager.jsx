import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Porta in cima a ogni cambio di rotta e gestisce gli ancoraggi (/#eventi).
 */
export default function ScrollManager() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      // il target può non essere ancora montato: riprova al frame successivo
      const scroll = () => {
        const el = document.querySelector(hash)
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 90
          window.scrollTo({ top, behavior: 'smooth' })
          return true
        }
        return false
      }
      if (!scroll()) {
        const t = setTimeout(scroll, 220)
        return () => clearTimeout(t)
      }
      return
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' in window ? 'instant' : 'auto' })
  }, [pathname, hash])

  return null
}
