import { useState } from 'react'

import SiteLayout from '../components/SiteLayout'
import PageHero from '../components/PageHero'
import SectionHeading from '../components/SectionHeading'
import Reveal from '../components/Reveal'
import Icon from '../components/Icon'
import Seo from '../components/Seo'

import { faith, site } from '../data/site'

function PrincipleCard({ item, index }) {
  const [open, setOpen] = useState(false)

  return (
    <Reveal delay={(index % 3) * 90} from="up">
      <article
        className={`group h-full overflow-hidden rounded-[1.75rem] border p-7 transition-all duration-500 ${
          open ? 'border-gold-400/50 bg-white/[0.06]' : 'border-white/10 bg-white/[0.03] hover:border-gold-400/30'
        }`}
      >
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold-400/10 text-gold-400 transition-colors group-hover:bg-gold-400/20">
            <Icon name={item.icon} className="text-[24px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest2 text-cream-100/30">
              {String(index + 1).padStart(2, '0')}
            </p>
            <h3 className="h-display mt-1 text-xl text-cream-50">{item.title}</h3>
          </div>
        </div>

        <p
          className={`mt-5 text-[14px] leading-relaxed text-cream-100/60 transition-all ${
            open ? '' : 'line-clamp-4'
          }`}
        >
          {item.text}
        </p>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gold-400 transition-colors hover:text-gold-300"
        >
          {open ? 'Mostra meno' : 'Leggi tutto'}
          <Icon name={open ? 'expand_less' : 'expand_more'} className="text-[16px]" />
        </button>
      </article>
    </Reveal>
  )
}

export default function Faith() {
  return (
    <SiteLayout transparentNav>
      <Seo title="La Nostra Fede" description={faith.lead} image={faith.hero} />

      <PageHero
        image={faith.hero}
        eyebrow="Chiesa Cristiana Evangelica L'Oasi"
        title={faith.title}
        lead={faith.lead}
        breadcrumb={[{ label: 'Fede' }]}
      />

      <section className="bg-ink-900 py-24 sm:py-32">
        <div className="container">
          <SectionHeading
            eyebrow="In cosa crediamo"
            title="Principi fondamentali di fede"
            lead="Quattordici convinzioni che orientano la vita, l’insegnamento e il servizio delle nostre comunità."
            className="mb-16"
          />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {faith.principles.map((item, i) => (
              <PrincipleCard key={item.title} item={item} index={i} />
            ))}
          </div>

          <Reveal className="mt-16 text-center">
            <p className="text-[11px] font-bold uppercase tracking-widest2 text-cream-100/30">{faith.source}</p>
          </Reveal>
        </div>
      </section>

      <section className="relative overflow-hidden bg-ink-950 py-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-400/10 blur-[130px]"
        />
        <div className="container relative">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Icon name="menu_book" className="text-[44px] text-gold-400" />
            <h2 className="h-display mt-6 text-balance text-[1.9rem] text-cream-50 sm:text-4xl">
              Hai domande sulla fede?
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-cream-100/60">
              Nessuna domanda è fuori posto. Scrivici: saremo felici di cercare insieme a te le risposte nella Parola di
              Dio.
            </p>
            <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="btn-gold mt-9">
              <Icon name="chat" className="text-[18px]" />
              Parliamone su WhatsApp
            </a>
          </Reveal>
        </div>
      </section>
    </SiteLayout>
  )
}
