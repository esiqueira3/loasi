import { Link } from 'react-router-dom'
import Icon from './Icon'
import Reveal from './Reveal'

/**
 * Intestazione interna delle pagine (Chi siamo, Fede, Chiese, Missioni…).
 */
export default function PageHero({ image, eyebrow, title, lead, breadcrumb = [] }) {
  return (
    <section className="relative flex min-h-[62vh] items-end overflow-hidden pb-16 pt-40 sm:min-h-[70vh] sm:pb-24">
      <div className="absolute inset-0">
        {image && (
          <img src={image} alt="" aria-hidden="true" className="h-full w-full animate-kenburns object-cover" />
        )}
        <div className="absolute inset-0 bg-ink-950/55" />
        <div className="absolute inset-0 bg-scrim-b" />
      </div>

      <div className="container relative">
        <Reveal from="up">
          {eyebrow && <p className="eyebrow mb-5">{eyebrow}</p>}
          <h1 className="h-display max-w-4xl text-balance text-[2.4rem] text-cream-50 sm:text-6xl lg:text-7xl">
            {title}
          </h1>
          {lead && (
            <p className="mt-7 max-w-2xl text-pretty text-base leading-relaxed text-cream-100/70 sm:text-lg">{lead}</p>
          )}
        </Reveal>

        {breadcrumb.length > 0 && (
          <Reveal from="up" delay={150}>
            <nav aria-label="breadcrumb" className="mt-10">
              <ol className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-cream-100/45">
                <li>
                  <Link to="/" className="transition-colors hover:text-gold-400">
                    Home
                  </Link>
                </li>
                {breadcrumb.map((b, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Icon name="chevron_right" className="text-[15px] text-gold-400/60" />
                    {b.to ? (
                      <Link to={b.to} className="transition-colors hover:text-gold-400">
                        {b.label}
                      </Link>
                    ) : (
                      <span className="text-gold-400">{b.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </Reveal>
        )}
      </div>
    </section>
  )
}
