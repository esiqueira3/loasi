import { Link } from 'react-router-dom'
import { churches, footerAbout, site, social } from '../data/site'
import { useChurches } from '../hooks/useChurches'
import Icon from './Icon'

const socialLinks = [
  { href: social.facebook, icon: 'thumb_up', label: 'Facebook' },
  { href: social.instagram, icon: 'photo_camera', label: 'Instagram' },
  { href: social.youtube, icon: 'play_circle', label: 'YouTube' },
  { href: social.flickr, icon: 'collections', label: 'Flickr' },
]

export default function Footer() {
  const year = new Date().getFullYear()
  const { churches: churchList } = useChurches()

  return (
    <footer className="relative overflow-hidden bg-ink-950 pt-24">
      {/* alone dorato decorativo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[46rem] -translate-x-1/2 rounded-full bg-gold-400/10 blur-[120px]"
      />

      <div className="container relative">
        <div className="grid gap-14 lg:grid-cols-12">
          {/* Brand + storia */}
          <div className="lg:col-span-5">
            <img src={site.logo} alt={site.name} className="h-12 w-auto" width="268" height="75" />
            <p className="mt-7 text-[11px] font-bold uppercase tracking-widest2 text-gold-400">Chi siamo</p>
            <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-cream-100/60">
              {footerAbout.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            <ul className="mt-8 flex items-center gap-2">
              {socialLinks.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={l.label}
                    title={l.label}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-cream-200/70 transition-all hover:-translate-y-0.5 hover:border-gold-400 hover:text-gold-400"
                  >
                    <Icon name={l.icon} className="text-[20px]" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contatti per comunità */}
          <div className="lg:col-span-5">
            <p className="text-[11px] font-bold uppercase tracking-widest2 text-gold-400">Contatti</p>
            <ul className="mt-6 space-y-6">
              {churchList.map((c) => (
                <li key={c.slug} className="border-l border-white/10 pl-5">
                  <p className="font-headline text-lg text-cream-50">{c.city}</p>
                  <div className="mt-2 space-y-1.5 text-sm text-cream-100/60">
                    <a href={c.phoneHref} className="flex items-start gap-2.5 transition-colors hover:text-gold-300">
                      <Icon name="call" className="mt-0.5 text-[17px] text-gold-400/80" />
                      (+39) {c.phone}
                    </a>
                    <a href={`mailto:${c.email}`} className="flex items-start gap-2.5 transition-colors hover:text-gold-300">
                      <Icon name="mail" className="mt-0.5 text-[17px] text-gold-400/80" />
                      {c.email}
                    </a>
                    <a
                      href={c.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2.5 transition-colors hover:text-gold-300"
                    >
                      <Icon name="location_on" className="mt-0.5 text-[17px] text-gold-400/80" />
                      {c.address}
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Menu */}
          <div className="lg:col-span-2">
            <p className="text-[11px] font-bold uppercase tracking-widest2 text-gold-400">Menu</p>
            <ul className="mt-6 space-y-3 text-sm text-cream-100/60">
              {[
                { label: 'Home', to: '/' },
                { label: 'Chi Siamo', to: '/chi-siamo' },
                { label: 'Fede', to: '/fede' },
                { label: 'Indirizzi', to: '/#indirizzi' },
                { label: 'Eventi', to: '/#eventi' },
                { label: 'Testimonianze', to: '/#testimonianze' },
                { label: 'Privacy Policy', to: '/privacy' },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="link-underline transition-colors hover:text-gold-300">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Barra finale */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 py-8 text-center md:flex-row md:text-left">
          <p className="text-xs text-cream-100/40">
            © {year} {site.name}. Tutti i diritti riservati.{' '}
            <Link to="/privacy" className="text-gold-400/80 transition-colors hover:text-gold-300">
              Privacy Policy
            </Link>
          </p>
          <Link
            to="/admin"
            className="text-[11px] font-bold uppercase tracking-widest2 text-cream-100/25 transition-colors hover:text-gold-400"
          >
            Area riservata
          </Link>
        </div>
      </div>
    </footer>
  )
}
