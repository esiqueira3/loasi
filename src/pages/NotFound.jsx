import { Link } from 'react-router-dom'
import SiteLayout from '../components/SiteLayout'
import Icon from '../components/Icon'
import Seo from '../components/Seo'
import { churches } from '../data/site'

export default function NotFound() {
  return (
    <SiteLayout>
      <Seo title="Pagina non trovata" description="La pagina che cerchi non esiste o è stata spostata." />

      <section className="relative flex min-h-[86vh] items-center overflow-hidden pt-28">
        <div className="absolute inset-0">
          <img src="/images/bg-about.jpg" alt="" aria-hidden="true" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-ink-950/85" />
        </div>

        <div className="container relative text-center">
          <p className="h-display bg-gradient-to-b from-gold-200 to-gold-700 bg-clip-text text-[7rem] leading-none text-transparent sm:text-[11rem]">
            404
          </p>
          <h1 className="h-display mt-2 text-balance text-3xl text-cream-50 sm:text-5xl">Pagina non trovata</h1>
          <p className="mx-auto mt-6 max-w-md text-[15px] leading-relaxed text-cream-100/60">
            La pagina che stai cercando non esiste o è stata spostata. Torna alla home o scopri una delle nostre
            comunità.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/" className="btn-gold">
              <Icon name="home" className="text-[18px]" />
              Torna alla home
            </Link>
            <Link to="/chi-siamo" className="btn-outline">
              Chi siamo
            </Link>
          </div>

          <ul className="mx-auto mt-14 flex max-w-lg flex-wrap items-center justify-center gap-3">
            {churches.map((c) => (
              <li key={c.slug}>
                <Link
                  to={`/chiese/${c.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-cream-100/60 transition-all hover:border-gold-400 hover:text-gold-300"
                >
                  <Icon name="location_on" className="text-[15px]" />
                  {c.city}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </SiteLayout>
  )
}
