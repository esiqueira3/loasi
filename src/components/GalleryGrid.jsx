import { useState } from 'react'
import Lightbox from './Lightbox'
import Reveal from './Reveal'
import Icon from './Icon'

/** Griglia di miniature con apertura a schermo intero. */
export default function GalleryGrid({ items = [], columns = 3, aspect = 'aspect-[4/3]' }) {
  const [index, setIndex] = useState(null)
  if (!items.length) return null

  const cols = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  }[columns]

  return (
    <>
      <div className={`grid grid-cols-2 gap-4 ${cols}`}>
        {items.map((item, i) => (
          <Reveal key={i} delay={i * 60} from="scale">
            <button
              type="button"
              onClick={() => setIndex(i)}
              className={`group relative block w-full overflow-hidden rounded-2xl border border-white/10 ${aspect}`}
            >
              <img
                src={item.full || item.thumb || item.url || item.src}
                alt={item.caption || ''}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-ink-950/0 transition-colors duration-500 group-hover:bg-ink-950/45">
                <Icon
                  name="zoom_in"
                  className="scale-75 text-[30px] text-gold-300 opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100"
                />
              </span>
            </button>
          </Reveal>
        ))}
      </div>

      <Lightbox items={items} index={index} onClose={() => setIndex(null)} onIndexChange={setIndex} />
    </>
  )
}
