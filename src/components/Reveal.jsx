import { useEffect, useRef, useState } from 'react'

/**
 * Rivela il contenuto quando entra nel viewport.
 * Usa IntersectionObserver — nessuna libreria esterna.
 */
export default function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
  from = 'up', // 'up' | 'down' | 'left' | 'right' | 'scale' | 'none'
  className = '',
  once = true,
  ...rest
}) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setShown(false)
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [once])

  const hidden = {
    up: 'translate-y-10 opacity-0',
    down: '-translate-y-10 opacity-0',
    left: '-translate-x-10 opacity-0',
    right: 'translate-x-10 opacity-0',
    scale: 'scale-95 opacity-0',
    none: 'opacity-0',
  }[from]

  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all [transition-duration:900ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
        shown ? 'translate-x-0 translate-y-0 scale-100 opacity-100' : hidden
      } ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}
