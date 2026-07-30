import { useCallback, useEffect } from 'react'
import Icon from './Icon'

/**
 * Visualizzatore immagini a schermo intero (sostituisce lightGallery).
 * items: [{ thumb, full, caption? }]  ·  index: numero | null
 */
export default function Lightbox({ items = [], index, onClose, onIndexChange }) {
  const isOpen = index !== null && index !== undefined && items.length > 0

  const go = useCallback(
    (delta) => {
      if (!isOpen) return
      onIndexChange((index + delta + items.length) % items.length)
    },
    [index, isOpen, items.length, onIndexChange]
  )

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, go, onClose])

  if (!isOpen) return null
  const item = items[index]

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/95 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Chiudi"
        className="absolute right-5 top-5 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 text-cream-100 transition-colors hover:border-gold-400 hover:text-gold-400"
      >
        <Icon name="close" className="text-[24px]" />
      </button>

      {items.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Precedente"
            onClick={(e) => {
              e.stopPropagation()
              go(-1)
            }}
            className="absolute left-3 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 text-cream-100 transition-colors hover:border-gold-400 hover:text-gold-400 sm:left-8"
          >
            <Icon name="chevron_left" className="text-[26px]" />
          </button>
          <button
            type="button"
            aria-label="Successiva"
            onClick={(e) => {
              e.stopPropagation()
              go(1)
            }}
            className="absolute right-3 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 text-cream-100 transition-colors hover:border-gold-400 hover:text-gold-400 sm:right-8"
          >
            <Icon name="chevron_right" className="text-[26px]" />
          </button>
        </>
      )}

      <figure
        className="max-h-[85vh] w-[92vw] max-w-5xl animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={item.full || item.thumb}
          alt={item.caption || ''}
          className="mx-auto max-h-[80vh] w-auto rounded-2xl object-contain shadow-lift"
        />
        <figcaption className="mt-4 text-center text-xs uppercase tracking-widest2 text-cream-100/50">
          {item.caption || `${index + 1} / ${items.length}`}
        </figcaption>
      </figure>
    </div>
  )
}
