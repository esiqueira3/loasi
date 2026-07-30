import { Link, useParams } from 'react-router-dom'

import SiteLayout from '../components/SiteLayout'
import PageHero from '../components/PageHero'
import SectionHeading from '../components/SectionHeading'
import GalleryGrid from '../components/GalleryGrid'
import Reveal from '../components/Reveal'
import Icon from '../components/Icon'
import Seo from '../components/Seo'

import { missionStats, missions, site } from '../data/site'

export default function Mission() {
  const { slug } = useParams()
  const mission = missions[slug]

  if (!mission) {
    return (
      <SiteLayout>
        <Seo title="Missione non trovata" />
        <section className="flex min-h-[70vh] items-center justify-center px-5 pt-32 text-center">
          <div>
            <p className="eyebrow mb-5 justify-center">404</p>
            <h1 className="h-display text-4xl text-cream-50">Missione non trovata</h1>
            <Link to="/" className="btn-gold mt-9">
              Torna alla home
            </Link>
          </div>
        </section>
      </SiteLayout>
    )
  }

  const other = Object.values(missions).find((m) => m.slug !== slug)

  return (
    <SiteLayout transparentNav>
      <Seo title={mission.title} description={mission.lead} image={mission.hero} />

      <PageHero
        image={mission.hero}
        eyebrow={`Missione · ${mission.year}`}
        title={mission.title}
        lead={mission.lead}
        breadcrumb={[{ label: 'Missione' }, { label: mission.title }]}
      />

      {/* --- Racconto --- */}
      <section className="bg-ink-900 py-24 sm:py-32">
        <div className="container">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
            <Reveal from="left" className="lg:col-span-4">
              <p className="eyebrow mb-6">Anno</p>
              <p className="h-display bg-gradient-to-b from-gold-200 to-gold-600 bg-clip-text text-[5.5rem] leading-none text-transparent sm:text-[7rem]">
                {mission.year}
              </p>
              <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/10">
                <img src={mission.cover} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
              </div>
            </Reveal>

            <Reveal from="right" className="lg:col-span-8">
              <h2 className="h-display text-[2rem] text-cream-50 sm:text-[2.6rem]">{mission.title}</h2>
              <div className="mt-7 space-y-5 text-[15px] leading-relaxed text-cream-100/65 sm:text-base">
                {mission.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              <p className="mt-10 text-[11px] font-bold uppercase tracking-widest2 text-cream-100/30">
                Fonte: Chiesa Cristiana Evangelica L'Oasi
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* --- Numeri --- */}
      <section className="relative overflow-hidden bg-ink-950 py-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-72 w-[46rem] -translate-x-1/2 rounded-full bg-gold-400/10 blur-[130px]"
        />
        <div className="container relative">
          <SectionHeading
            eyebrow="Perché continuiamo"
            title="I numeri della povertà infantile"
            className="mb-16"
          />
          <div className="grid gap-px overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {missionStats.map((s, i) => (
              <Reveal key={i} delay={i * 90} from="up">
                <div className="h-full bg-ink-900 p-8 text-center">
                  <p className="h-display text-5xl text-gold-400">
                    {s.value}
                    <span className="ml-1 text-base align-super text-gold-400/70">{s.suffix}</span>
                  </p>
                  <p className="mt-4 text-[13px] leading-relaxed text-cream-100/55">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* --- Galleria --- */}
      {mission.gallery.length > 0 && (
        <section className="bg-ink-900 py-24 sm:py-32">
          <div className="container">
            <SectionHeading eyebrow="Dal campo" title="Immagini della missione" className="mb-14" />
            <GalleryGrid items={mission.gallery} columns={3} />
          </div>
        </section>
      )}

      {/* --- CTA --- */}
      <section className="bg-ink-950 py-24">
        <div className="container">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Icon name="favorite" className="text-[44px] text-gold-400" filled />
            <h2 className="h-display mt-6 text-balance text-[1.9rem] text-cream-50 sm:text-4xl">{mission.ctaTitle}</h2>
            <p className="mt-5 text-[15px] leading-relaxed text-cream-100/60">
              Vuoi sapere come sostenere le nostre iniziative di volontariato? Contattaci: ogni contributo arriva a
              destinazione.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="btn-gold">
                <Icon name="chat" className="text-[18px]" />
                Contattaci
              </a>
              {other && (
                <Link to={`/missioni/${other.slug}`} className="btn-outline">
                  {other.title}
                  <Icon name="arrow_forward" className="text-[18px]" />
                </Link>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </SiteLayout>
  )
}
