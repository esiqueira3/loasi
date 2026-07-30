import { useState } from 'react'
import { Link } from 'react-router-dom'

import SiteLayout from '../components/SiteLayout'
import PageHero from '../components/PageHero'
import SectionHeading from '../components/SectionHeading'
import TeamGrid from '../components/TeamGrid'
import Reveal from '../components/Reveal'
import Icon from '../components/Icon'
import Seo from '../components/Seo'

import { about, pastorFamily, site } from '../data/site'

function MissionTabs() {
  const [tab, setTab] = useState(0)

  return (
    <section className="bg-ink-900 py-24 sm:py-32">
      <div className="container">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
          <Reveal from="left" className="lg:col-span-5">
            <p className="eyebrow mb-5">Qualche parola</p>
            <h2 className="h-display text-[2rem] text-cream-50 sm:text-[2.75rem]">Chi siamo</h2>
            <div className="mt-7 space-y-5 text-[15px] leading-relaxed text-cream-100/60">
              {about.intro.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            <div className="mt-10 overflow-hidden rounded-[2rem] border border-white/10">
              <img src="/images/Insieme.jpg" alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
            </div>
          </Reveal>

          <Reveal from="right" className="lg:col-span-7">
            <div className="flex flex-wrap gap-2">
              {about.missionTabs.map((t, i) => (
                <button
                  key={t.title}
                  type="button"
                  onClick={() => setTab(i)}
                  className={`rounded-full border px-6 py-3 text-[11px] font-bold uppercase tracking-widest transition-all ${
                    i === tab
                      ? 'border-gold-400 bg-gold-400/15 text-gold-300'
                      : 'border-white/10 text-cream-100/50 hover:border-white/25 hover:text-cream-100/80'
                  }`}
                >
                  {t.title}
                </button>
              ))}
            </div>

            <div key={tab} className="mt-9 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h3 className="h-display text-2xl text-cream-50 sm:text-3xl">{about.missionTabs[tab].title}</h3>
              <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-cream-100/70 sm:text-base">
                {about.missionTabs[tab].body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              {about.familyProject.items.map((item, i) => (
                <div
                  key={i}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-gold-400/40"
                >
                  <Icon name={item.icon} className="shrink-0 text-[24px] text-gold-400" />
                  <p className="text-[14px] leading-relaxed text-cream-100/70">{item.text}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function Timeline() {
  return (
    <section className="relative overflow-hidden bg-ink-950 py-24 sm:py-32">
      <div className="container">
        <SectionHeading
          eyebrow="La nostra storia"
          title="Le radici dell’Oasi"
          lead="Un cammino di fede lungo più di venticinque anni, scritto insieme."
          className="mb-20"
        />

        <div className="relative mx-auto max-w-4xl">
          {/* linea verticale */}
          <span
            aria-hidden="true"
            className="absolute left-[15px] top-2 h-full w-px bg-gradient-to-b from-gold-400/60 via-gold-400/20 to-transparent md:left-1/2"
          />

          <ol className="space-y-14">
            {about.timeline.map((item, i) => (
              <Reveal as="li" key={item.year} delay={i * 90} from={i % 2 ? 'right' : 'left'} className="relative">
                <div
                  className={`flex flex-col gap-5 pl-12 md:pl-0 ${
                    i % 2 ? 'md:flex-row' : 'md:flex-row-reverse'
                  } md:items-center md:gap-10`}
                >
                  {/* pallino */}
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1.5 flex h-8 w-8 items-center justify-center rounded-full border border-gold-400/40 bg-ink-900 md:left-1/2 md:-translate-x-1/2"
                  >
                    <span className="h-2 w-2 rounded-full bg-gold-400" />
                  </span>

                  <div className="md:w-1/2" />

                  <div className={`md:w-1/2 ${i % 2 ? 'md:pl-12' : 'md:pr-12 md:text-right'}`}>
                    <p className="h-display text-4xl text-gold-400/90 sm:text-5xl">{item.year}</p>
                    <h3 className="h-display mt-3 text-xl text-cream-50 sm:text-2xl">{item.title}</h3>
                    <p className="mt-4 text-[15px] leading-relaxed text-cream-100/60">{item.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

function StoryBlocks() {
  return (
    <section className="bg-ink-900 py-24 sm:py-32">
      <div className="container space-y-24">
        {about.story.map((block, i) => (
          <div key={block.title} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal from={i % 2 ? 'right' : 'left'} className={i % 2 ? 'lg:order-2' : ''}>
              <div className="relative">
                <div
                  className={`absolute h-full w-full rounded-[2rem] border border-gold-400/25 ${
                    i % 2 ? '-right-4 -top-4' : '-left-4 -top-4'
                  }`}
                />
                <img
                  src={block.image}
                  alt=""
                  loading="lazy"
                  className="relative aspect-[4/3] w-full rounded-[2rem] object-cover"
                />
              </div>
            </Reveal>

            <Reveal from={i % 2 ? 'left' : 'right'} className={i % 2 ? 'lg:order-1' : ''}>
              <p className="eyebrow mb-5">Capitolo {String(i + 1).padStart(2, '0')}</p>
              <h3 className="h-display text-[1.75rem] text-cream-50 sm:text-[2.25rem]">{block.title}</h3>
              <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-cream-100/65">
                {block.body.map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </div>
            </Reveal>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function About() {
  return (
    <SiteLayout transparentNav>
      <Seo title="Chi Siamo" description={about.lead} image={about.hero} />

      <PageHero
        image={about.hero}
        eyebrow="Chiesa Cristiana Evangelica L'Oasi"
        title={about.title}
        lead={about.lead}
        breadcrumb={[{ label: 'Chi Siamo' }]}
      />

      <MissionTabs />
      <Timeline />
      <StoryBlocks />

      {/* Famiglia pastorale */}
      <section className="bg-ink-950 py-24 sm:py-32">
        <div className="container">
          <SectionHeading
            eyebrow="Gesù è il centro di tutto"
            title="Pastore e famiglia"
            lead="Le persone che accompagnano il cammino delle comunità L’Oasi."
            className="mb-16"
          />
          <TeamGrid people={pastorFamily} columns={4} />
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-ink-900 py-24">
        <div className="container">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="h-display text-balance text-[1.9rem] text-cream-50 sm:text-4xl">
              Vuoi conoscerci di persona?
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-cream-100/60">
              Scopri la comunità più vicina a te oppure scrivici: saremo felici di accoglierti.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Link to="/#indirizzi" className="btn-gold">
                <Icon name="location_on" className="text-[18px]" />
                I nostri indirizzi
              </Link>
              <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="btn-outline">
                <Icon name="chat" className="text-[18px]" />
                Scrivici su WhatsApp
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </SiteLayout>
  )
}
