import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import SiteLayout from '../components/SiteLayout'
import SectionHeading from '../components/SectionHeading'
import GalleryGrid from '../components/GalleryGrid'
import Reveal from '../components/Reveal'
import Icon from '../components/Icon'
import Seo from '../components/Seo'

import { useSupabaseTable } from '../hooks/useSupabaseTable'
import {
  churches,
  fallbackEvents,
  foundedBlock,
  heroSlides,
  joinBlock,
  pillars,
  podcastBlock,
  site,
  testimonials as staticTestimonials,
  videoBlock,
  youtubeBlock,
  youtubeUploadsPlaylist,
} from '../data/site'

/* ================================================================== */
/* HERO                                                                */
/* ================================================================== */

function Hero({ slides }) {
  const [active, setActive] = useState(0)

  const next = useCallback(() => setActive((i) => (i + 1) % slides.length), [slides.length])

  useEffect(() => {
    if (slides.length < 2) return
    const id = setInterval(next, 9000)
    return () => clearInterval(id)
  }, [next, slides.length])

  return (
    <section className="relative h-[100svh] min-h-[620px] w-full overflow-hidden">
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity [transition-duration:1400ms] ease-in-out ${
            i === active ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          aria-hidden={i !== active}
        >
          <img
            src={slide.image}
            alt=""
            className={`h-full w-full object-cover ${i === active ? 'animate-kenburns' : ''}`}
            loading={i === 0 ? 'eager' : 'lazy'}
          />
          <div className="absolute inset-0 bg-ink-950/50" />
          <div className="absolute inset-0 bg-scrim-l" />
          <div className="absolute inset-0 bg-scrim-b" />
        </div>
      ))}

      <div className="container relative flex h-full items-center pb-28 pt-32">
        <div key={active} className="max-w-3xl">
          {slides[active].kicker && (
            <p className="eyebrow mb-6 animate-in fade-in slide-in-from-left-6 duration-700">{slides[active].kicker}</p>
          )}
          <h1 className="h-display text-balance text-[2.6rem] leading-[1.06] text-cream-50 animate-in fade-in slide-in-from-left-8 duration-1000 sm:text-6xl lg:text-[4.5rem]">
            {slides[active].title}
          </h1>
          <p className="mt-7 max-w-xl text-pretty text-[15px] leading-relaxed text-cream-100/75 animate-in fade-in slide-in-from-left-6 delay-200 duration-1000 fill-mode-both sm:text-lg">
            {slides[active].text}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-bottom-6 delay-500 duration-1000 fill-mode-both">
            {slides[active].ctaTo ? (
              <Link to={slides[active].ctaTo} className="btn-gold">
                {slides[active].ctaLabel || 'Per saperne di più'}
                <Icon name="arrow_forward" className="text-[18px]" />
              </Link>
            ) : (
              <a href={slides[active].ctaHref || '#'} className="btn-gold" target="_blank" rel="noopener noreferrer">
                {slides[active].ctaLabel || 'Per saperne di più'}
                <Icon name="arrow_forward" className="text-[18px]" />
              </a>
            )}
            <Link to="/#indirizzi" className="btn-outline">
              <Icon name="location_on" className="text-[18px]" />
              Dove trovarci
            </Link>
          </div>
        </div>
      </div>

      {/* Indicatori */}
      {slides.length > 1 && (
        <div className="absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 lg:left-auto lg:right-10 lg:translate-x-0">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Vai alla slide ${i + 1}`}
              onClick={() => setActive(i)}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === active ? 'w-10 bg-gold-400' : 'w-5 bg-cream-100/30 hover:bg-cream-100/60'
              }`}
            />
          ))}
        </div>
      )}

      {/* Invito allo scroll */}
      <div className="pointer-events-none absolute bottom-9 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex">
        <span className="text-[10px] font-bold uppercase tracking-widest2 text-cream-100/40">Scorri</span>
        <Icon name="keyboard_double_arrow_down" className="animate-floaty text-[22px] text-gold-400/80" />
      </div>
    </section>
  )
}

/* ================================================================== */
/* PILASTRI                                                            */
/* ================================================================== */

function Pillars() {
  const [active, setActive] = useState(0)
  const current = pillars[active]

  return (
    <section className="relative overflow-hidden bg-ink-900 py-24 sm:py-32">
      <div className="container">
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-20">
          {/* Immagine */}
          <Reveal from="left" className="lg:col-span-5">
            <div className="relative">
              <div className="absolute -left-4 -top-4 h-full w-full rounded-[2rem] border border-gold-400/25" />
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]">
                {pillars.map((p, i) => (
                  <img
                    key={i}
                    src={p.image}
                    alt={p.title}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    className={`absolute inset-0 h-full w-full object-cover transition-all [transition-duration:1200ms] ${
                      i === active ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
                    }`}
                  />
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/60 to-transparent" />
              </div>
            </div>
          </Reveal>

          {/* Testo */}
          <div className="lg:col-span-7">
            <Reveal from="right">
              <p className="eyebrow mb-5">{current.badge}</p>

              <div className="mb-8 flex flex-wrap gap-2">
                {pillars.map((p, i) => (
                  <button
                    key={p.title}
                    type="button"
                    onClick={() => setActive(i)}
                    className={`rounded-full border px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-all ${
                      i === active
                        ? 'border-gold-400 bg-gold-400/15 text-gold-300'
                        : 'border-white/10 text-cream-100/50 hover:border-white/25 hover:text-cream-100/80'
                    }`}
                  >
                    {p.title}
                  </button>
                ))}
              </div>

              <div key={active} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h2 className="h-display text-[2rem] text-cream-50 sm:text-[2.75rem]">{current.title}</h2>
                <p className="mt-6 text-pretty text-lg leading-relaxed text-cream-100/80">{current.lead}</p>
                <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-cream-100/55">
                  {current.body.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
                <Link to={current.to} className="btn-outline mt-9">
                  Per saperne di più
                  <Icon name="arrow_forward" className="text-[18px]" />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ================================================================== */
/* UNISCITI ALLA COMUNITÀ                                              */
/* ================================================================== */

function JoinBlock() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={joinBlock.image} alt="" aria-hidden="true" className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-ink-950/75" />
        <div className="absolute inset-0 bg-scrim-l" />
      </div>

      <div className="container relative py-28 sm:py-36">
        <Reveal className="max-w-2xl">
          <p className="eyebrow mb-5">Una famiglia, tre città</p>
          <h2 className="h-display text-balance text-[2rem] text-cream-50 sm:text-4xl lg:text-[3rem]">
            {joinBlock.title}
          </h2>
          <div className="mt-7 space-y-5 text-[15px] leading-relaxed text-cream-100/70 sm:text-base">
            {joinBlock.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <img
            src={joinBlock.signature}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="mt-9 h-16 w-auto opacity-70"
          />
        </Reveal>
      </div>
    </section>
  )
}

/* ================================================================== */
/* INDIRIZZI                                                           */
/* ================================================================== */

function Addresses() {
  return (
    <section id="indirizzi" className="scroll-mt-24 bg-cream-50 py-24 sm:py-32">
      <div className="container">
        <SectionHeading
          tone="light"
          eyebrow="Dove trovarci"
          title="I nostri indirizzi"
          lead="Tre comunità, un’unica famiglia. Vieni a trovarci: sarà un onore accoglierti."
          className="mb-16"
        />

        <div className="grid gap-7 md:grid-cols-3">
          {churches.map((c, i) => (
            <Reveal key={c.slug} delay={i * 120} from="up">
              <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-ink-900/8 bg-white shadow-soft transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lift">
                <Link to={`/chiese/${c.slug}`} className="relative block aspect-[16/11] overflow-hidden">
                  <img
                    src={c.cover}
                    alt={`${c.name} — ${c.city}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform [transition-duration:1200ms] group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest2 text-gold-300">{c.name}</p>
                    <h3 className="h-display mt-1.5 text-3xl text-cream-50">
                      {c.city} <span className="text-lg text-cream-100/50">— {c.province}</span>
                    </h3>
                  </div>
                </Link>

                <div className="flex flex-1 flex-col gap-4 p-6">
                  <ul className="space-y-3 text-[14px] text-ink-700/80">
                    <li className="flex items-start gap-3">
                      <Icon name="person" className="mt-0.5 text-[18px] text-gold-600" />
                      <span>{c.referente}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Icon name="call" className="mt-0.5 text-[18px] text-gold-600" />
                      <a href={c.phoneHref} className="link-underline hover:text-ink-900">
                        {c.phone}
                      </a>
                    </li>
                    <li className="flex items-start gap-3">
                      <Icon name="mail" className="mt-0.5 text-[18px] text-gold-600" />
                      <a href={`mailto:${c.email}`} className="link-underline break-all hover:text-ink-900">
                        {c.email}
                      </a>
                    </li>
                    <li className="flex items-start gap-3">
                      <Icon name="location_on" className="mt-0.5 text-[18px] text-gold-600" />
                      <a
                        href={c.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-underline hover:text-ink-900"
                      >
                        {c.address}
                      </a>
                    </li>
                  </ul>

                  <Link
                    to={`/chiese/${c.slug}`}
                    className="mt-auto inline-flex items-center gap-2 pt-2 text-[11px] font-bold uppercase tracking-widest text-gold-700 transition-colors hover:text-gold-600"
                  >
                    Scopri la comunità
                    <Icon name="arrow_forward" className="text-[16px]" />
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ================================================================== */
/* VIDEO                                                               */
/* ================================================================== */

function VideoBand() {
  return (
    <section className="relative flex min-h-[60vh] items-center overflow-hidden">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        poster={videoBlock.poster}
        aria-hidden="true"
      >
        <source src={videoBlock.video} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-ink-950/70" />

      <div className="container relative py-24 text-center">
        <Reveal>
          <p className="eyebrow mb-6 justify-center">Ti aspettiamo</p>
          <h2 className="h-display mx-auto max-w-3xl text-balance text-[2rem] text-cream-50 sm:text-5xl">
            {videoBlock.title}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[15px] text-cream-100/70">{videoBlock.text}</p>
          <Link to="/#eventi" className="btn-gold mt-10">
            Vedi gli eventi
            <Icon name="calendar_month" className="text-[18px]" />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}

/* ================================================================== */
/* FONDATA NEL                                                         */
/* ================================================================== */

function Founded() {
  return (
    <section id="fondata" className="scroll-mt-24 bg-ink-900 py-24 sm:py-32">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal from="left" className="lg:col-span-4">
            <p className="eyebrow mb-6">La nostra storia</p>
            <p className="text-[11px] font-bold uppercase tracking-widest2 text-cream-100/40">Fondata nel</p>
            <p className="h-display mt-2 bg-gradient-to-b from-gold-200 to-gold-600 bg-clip-text text-[5.5rem] leading-none text-transparent sm:text-[7rem]">
              {foundedBlock.year}
            </p>
            <div className="mt-6 border-l border-gold-400/40 pl-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-cream-100/40">{foundedBlock.label}</p>
              <p className="mt-1 font-headline text-xl text-cream-50">{foundedBlock.pastor}</p>
            </div>
            <a
              href={foundedBlock.moreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline mt-9 !px-6"
            >
              <Icon name="collections" className="text-[18px]" />
              Archivio fotografico
            </a>
          </Reveal>

          <div className="lg:col-span-8">
            <GalleryGrid items={foundedBlock.gallery} columns={3} aspect="aspect-[4/3]" />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ================================================================== */
/* PODCAST + YOUTUBE                                                   */
/* ================================================================== */

function Media() {
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % podcastBlock.slides.length), 7000)
    return () => clearInterval(id)
  }, [])

  const current = podcastBlock.slides[slide]

  return (
    <section id="media" className="scroll-mt-24 bg-ink-950 py-24 sm:py-32">
      <div className="container">
        <SectionHeading eyebrow={podcastBlock.eyebrow} title={podcastBlock.title} className="mb-14" />

        {/* Podcast */}
        <Reveal from="scale">
          <div className="relative aspect-[21/9] min-h-[280px] overflow-hidden rounded-[2rem] border border-white/10">
            {podcastBlock.slides.map((s, i) => (
              <img
                key={i}
                src={s.image}
                alt=""
                loading="lazy"
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
                  i === slide ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ))}
            <div className="absolute inset-0 bg-ink-950/45" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8 text-center">
              <a href={current.href} target="_blank" rel="noopener noreferrer" className="btn-gold">
                <Icon name="play_arrow" className="text-[20px]" filled />
                {current.label}
              </a>
              <div className="flex gap-2">
                {podcastBlock.slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Slide ${i + 1}`}
                    onClick={() => setSlide(i)}
                    className={`h-1 rounded-full transition-all duration-500 ${
                      i === slide ? 'w-9 bg-gold-400' : 'w-4 bg-cream-100/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {/* Canale YouTube */}
        <div className="mt-24 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal from="left">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10">
              <img src={youtubeBlock.image} alt="" loading="lazy" className="aspect-[16/10] w-full object-cover" />
              <div className="absolute inset-0 bg-ink-950/35" />
            </div>
          </Reveal>

          <Reveal from="right">
            <p className="eyebrow mb-5">Il nostro canale</p>
            <h2 className="h-display text-[2rem] text-cream-50 sm:text-[2.6rem]">{youtubeBlock.title}</h2>
            <p className="mt-5 text-[11px] font-bold uppercase tracking-widest2 text-gold-400">{youtubeBlock.time}</p>
            <p className="mt-4 text-lg text-cream-100/70">{youtubeBlock.text}</p>
            <a href={youtubeBlock.href} target="_blank" rel="noopener noreferrer" className="btn-gold mt-9">
              <Icon name="subscriptions" className="text-[18px]" />
              Iscriviti al canale
            </a>
          </Reveal>
        </div>

        {/* Ultimi sermoni */}
        <div className="mt-24">
          <SectionHeading eyebrow="Sempre aggiornato" title="Ultimi sermoni" className="mb-12" />
          <Reveal from="up">
            <div className="mx-auto max-w-4xl overflow-hidden rounded-[1.5rem] border border-white/10 bg-ink-900">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/videoseries?list=${youtubeUploadsPlaylist}`}
                title="Ultimi video della Chiesa L'Oasi"
                loading="lazy"
                allow="accelerometer; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="aspect-video w-full border-0"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ================================================================== */
/* TESTIMONIANZE                                                       */
/* ================================================================== */

function Testimonials({ items }) {
  const [index, setIndex] = useState(0)
  const total = items.length

  useEffect(() => {
    if (total < 2) return
    const id = setInterval(() => setIndex((i) => (i + 1) % total), 8000)
    return () => clearInterval(id)
  }, [total])

  if (!total) return null
  const current = items[index]

  return (
    <section id="testimonianze" className="scroll-mt-24 bg-cream-50 py-24 sm:py-32">
      <div className="container">
        <SectionHeading
          tone="light"
          eyebrow="Testimonianze"
          title="Cosa dice la gente"
          lead="Storie vere di persone che hanno incontrato l’amore di Dio in questa famiglia."
          className="mb-16"
        />

        <Reveal from="up">
          <div className="relative mx-auto max-w-3xl">
            <Icon
              name="format_quote"
              className="absolute -left-2 -top-10 text-[7rem] leading-none text-gold-400/20 sm:-left-8"
            />

            <blockquote key={index} className="relative animate-in fade-in slide-in-from-bottom-3 duration-700">
              <p className="text-pretty text-center font-headline text-xl italic leading-relaxed text-ink-800 sm:text-2xl">
                “{current.text}”
              </p>

              <div className="mt-9 flex flex-col items-center gap-3">
                <img
                  src={current.photo}
                  alt={current.name}
                  loading="lazy"
                  className="h-16 w-16 rounded-full border-2 border-gold-400/60 object-cover"
                />
                <div className="text-center">
                  <p className="font-headline text-lg text-ink-900">{current.name}</p>
                  {current.role && (
                    <p className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-gold-700">
                      {current.role}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 text-gold-500" aria-label="5 stelle">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Icon key={i} name="star" className="text-[17px]" filled />
                  ))}
                </div>
              </div>
            </blockquote>

            {total > 1 && (
              <div className="mt-12 flex items-center justify-center gap-4">
                <button
                  type="button"
                  aria-label="Testimonianza precedente"
                  onClick={() => setIndex((i) => (i - 1 + total) % total)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-ink-900/15 text-ink-700 transition-colors hover:border-gold-500 hover:text-gold-700"
                >
                  <Icon name="chevron_left" className="text-[22px]" />
                </button>

                <div className="flex gap-2">
                  {items.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Testimonianza ${i + 1}`}
                      onClick={() => setIndex(i)}
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        i === index ? 'w-8 bg-gold-500' : 'w-1.5 bg-ink-900/20 hover:bg-ink-900/40'
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  aria-label="Testimonianza successiva"
                  onClick={() => setIndex((i) => (i + 1) % total)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-ink-900/15 text-ink-700 transition-colors hover:border-gold-500 hover:text-gold-700"
                >
                  <Icon name="chevron_right" className="text-[22px]" />
                </button>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ================================================================== */
/* EVENTI                                                              */
/* ================================================================== */

const MONTHS_IT = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

function EventCard({ event, delay }) {
  const date = event.data_evento ? new Date(event.data_evento) : null
  const valid = date && !Number.isNaN(date.getTime())

  const hour =
    event.hora ||
    (valid ? date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : null)

  return (
    <Reveal delay={delay} from="up">
      <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.03] transition-all duration-500 hover:-translate-y-1.5 hover:border-gold-400/40">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={event.imagem_url || '/images/event-1-385x392.jpg'}
            alt={event.titulo}
            loading="lazy"
            className="h-full w-full object-cover transition-transform [transition-duration:1200ms] group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 to-transparent" />
          {valid && (
            <time
              dateTime={date.toISOString()}
              className="absolute left-5 top-5 flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-gold-400 text-ink-950 shadow-glow"
            >
              <span className="text-[10px] font-black uppercase tracking-widest">{MONTHS_IT[date.getMonth()]}</span>
              <span className="font-headline text-2xl leading-none">{date.getDate()}</span>
              <span className="text-[9px] font-bold opacity-70">{date.getFullYear()}</span>
            </time>
          )}
        </div>

        <div className="flex flex-1 flex-col p-6">
          <h3 className="h-display text-xl text-cream-50">{event.titulo}</h3>

          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-cream-100/50">
            {hour && (
              <li className="flex items-center gap-1.5">
                <Icon name="schedule" className="text-[16px] text-gold-400/80" />
                {hour}
              </li>
            )}
            {event.local && (
              <li className="flex items-center gap-1.5">
                <Icon name="location_on" className="text-[16px] text-gold-400/80" />
                {event.local}
              </li>
            )}
          </ul>

          {event.descricao && (
            <p className="mt-4 line-clamp-4 text-[14px] leading-relaxed text-cream-100/60">{event.descricao}</p>
          )}

          <a
            href={event.link_inscricao || site.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-flex items-center gap-2 pt-6 text-[11px] font-bold uppercase tracking-widest text-gold-400 transition-colors hover:text-gold-300"
          >
            Per saperne di più
            <Icon name="arrow_forward" className="text-[16px]" />
          </a>
        </div>
      </article>
    </Reveal>
  )
}

function Events({ items }) {
  return (
    <section id="eventi" className="scroll-mt-24 bg-ink-900 py-24 sm:py-32">
      <div className="container">
        <SectionHeading
          eyebrow="Agenda"
          title="Eventi in evidenza"
          lead="Incontri, studi biblici e momenti di comunità. Sei sempre il benvenuto."
          className="mb-16"
        />

        {items.length === 0 ? (
          <p className="text-center text-cream-100/50">Nessun evento in programma al momento. Torna presto!</p>
        ) : (
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((ev, i) => (
              <EventCard key={ev.id || i} event={ev} delay={i * 100} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

/* ================================================================== */
/* RICHIESTE DI PREGHIERA                                              */
/* ================================================================== */

function PrayerCta() {
  return (
    <section className="relative overflow-hidden bg-ink-950 py-24 sm:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[52rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-400/10 blur-[130px]"
      />
      <div className="container relative">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Icon name="volunteer_activism" className="text-[44px] text-gold-400" />
          <h2 className="h-display mt-6 text-balance text-[2rem] text-cream-50 sm:text-4xl">Richieste di preghiera</h2>
          <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-cream-100/60">
            Hai un peso nel cuore? Scrivici: pregheremo con te e per te. Nessuna richiesta è troppo piccola.
          </p>
          <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="btn-gold mt-10">
            <Icon name="chat" className="text-[18px]" />
            Scrivici su WhatsApp
          </a>
        </Reveal>
      </div>
    </section>
  )
}

/* ================================================================== */
/* PAGINA                                                              */
/* ================================================================== */

export default function Home() {
  const { rows: banners } = useSupabaseTable('banners', {
    fallback: [],
    filters: { ativo: true },
    order: { column: 'ordem' },
  })

  const { rows: eventos } = useSupabaseTable('eventos', {
    fallback: fallbackEvents,
    filters: { ativo: true },
    order: { column: 'data_evento' },
    limit: 6,
  })

  const { rows: depoimentos } = useSupabaseTable('depoimentos', {
    fallback: [],
    filters: { ativo: true },
    order: { column: 'created_at', ascending: false },
  })

  const slides = useMemo(() => {
    if (!banners.length) return heroSlides
    return banners.map((b) => ({
      image: b.imagem_url,
      kicker: site.shortName,
      title: b.titulo,
      text: b.subtitulo || '',
      ctaLabel: b.texto_botao || 'Per saperne di più',
      ctaHref: b.link_botao || '#',
    }))
  }, [banners])

  const quotes = useMemo(() => {
    if (!depoimentos.length) return staticTestimonials
    return depoimentos.map((d) => ({
      name: d.nome,
      role: d.cargo_ou_igreja,
      text: d.mensagem,
      photo: d.foto_url || '/images/user-6-62x62.jpg',
    }))
  }, [depoimentos])

  return (
    <SiteLayout transparentNav>
      <Seo
        title="Home"
        description="Chiesa Cristiana Evangelica L'Oasi — comunità di fede a Latina, Terracina e Gaeta. Culti, eventi, missioni. Sei il benvenuto tra noi."
      />
      <Hero slides={slides} />
      <Pillars />
      <JoinBlock />
      <Addresses />
      <VideoBand />
      <Founded />
      <Media />
      <Testimonials items={quotes} />
      <Events items={eventos} />
      <PrayerCta />
    </SiteLayout>
  )
}
