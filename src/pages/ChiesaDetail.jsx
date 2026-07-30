import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import SiteLayout from '../components/SiteLayout'
import PageHero from '../components/PageHero'
import SectionHeading from '../components/SectionHeading'
import GalleryGrid from '../components/GalleryGrid'
import TeamGrid from '../components/TeamGrid'
import Reveal from '../components/Reveal'
import Icon from '../components/Icon'
import Seo from '../components/Seo'

import { supabase } from '../lib/supabase'
import { churchContent, churches, getChurch, pastorFamily, site } from '../data/site'

/** Usa il valore del database solo se valorizzato, altrimenti quello statico. */
const pick = (dbValue, staticValue) => {
  if (dbValue === null || dbValue === undefined) return staticValue
  if (typeof dbValue === 'string' && dbValue.trim() === '') return staticValue
  return dbValue
}

export default function ChiesaDetail() {
  const { slug } = useParams()
  const base = getChurch(slug)
  const content = churchContent[slug]

  const [row, setRow] = useState(null)
  const [dbTeam, setDbTeam] = useState([])
  const [dbPhotos, setDbPhotos] = useState([])

  useEffect(() => {
    let cancelled = false
    if (!base) return

    async function load() {
      try {
        const { data } = await supabase.from('igrejas').select('*').eq('slug', slug).maybeSingle()
        if (cancelled || !data) return
        setRow(data)

        const [{ data: dir }, { data: fotos }] = await Promise.all([
          supabase.from('diretoria').select('*').eq('igreja_id', data.id).order('ordem', { ascending: true }),
          supabase.from('igreja_fotos').select('*').eq('igreja_id', data.id).order('ordem', { ascending: true }),
        ])
        if (cancelled) return
        if (dir?.length) setDbTeam(dir.map((d) => ({ name: d.nome, role: d.cargo, photo: d.foto_url })))
        if (fotos?.length) setDbPhotos(fotos.map((f) => ({ thumb: f.foto_url, full: f.foto_url, caption: f.legenda })))
      } catch {
        /* il sito resta sui contenuti statici */
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [slug, base])

  const info = useMemo(() => {
    if (!base) return null
    return {
      ...base,
      address: pick(row?.endereco, base.address),
      phone: pick(row?.telefone, base.phone),
      email: pick(row?.email, base.email),
      mapsUrl: pick(row?.link_maps, base.mapsUrl),
      cover: pick(row?.foto_capa_url, base.cover),
      schedule: pick(row?.horarios_culto, null),
      referente: pick(row?.referente || row?.responsavel, base.referente),
      name: pick(row?.nome, `${base.name} — ${base.city}`),
    }
  }, [base, row])

  /* --- Slug inesistente --- */
  if (!base || !content) {
    return (
      <SiteLayout>
        <Seo title="Comunità non trovata" />
        <section className="flex min-h-[70vh] items-center justify-center px-5 pt-32 text-center">
          <div>
            <p className="eyebrow mb-5 justify-center">404</p>
            <h1 className="h-display text-4xl text-cream-50">Comunità non trovata</h1>
            <p className="mt-5 text-cream-100/60">Controlla l’indirizzo oppure torna alla home.</p>
            <Link to="/" className="btn-gold mt-9">
              Torna alla home
            </Link>
          </div>
        </section>
      </SiteLayout>
    )
  }

  const team = dbTeam.length ? dbTeam : content.team
  const gallery = dbPhotos.length ? dbPhotos : base.gallery
  const others = churches.filter((c) => c.slug !== slug)

  return (
    <SiteLayout transparentNav>
      <Seo
        title={`L'Oasi ${base.city}`}
        description={content.lead[0]?.slice(0, 180)}
        image={base.hero}
      />

      <PageHero
        image={base.hero}
        eyebrow="Chiesa Cristiana Evangelica L'Oasi"
        title={base.city}
        lead={content.lead[0]}
        breadcrumb={[{ label: 'Le Chiese' }, { label: base.city }]}
      />

      {/* --- Scheda informativa --- */}
      <section className="relative z-10 -mt-16 pb-8">
        <div className="container">
          <Reveal from="up">
            <div className="grid gap-px overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: 'person', label: 'Referente', value: base.referente },
                { icon: 'call', label: 'Telefono', value: base.phone, href: base.phoneHref },
                { icon: 'mail', label: 'E-mail', value: info.email, href: `mailto:${info.email}` },
                {
                  icon: 'location_on',
                  label: 'Indirizzo',
                  value: info.address,
                  href: info.mapsUrl,
                  external: true,
                },
              ].map((item) => (
                <div key={item.label} className="bg-ink-800 p-6">
                  <div className="flex items-center gap-2 text-gold-400">
                    <Icon name={item.icon} className="text-[18px]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest2">{item.label}</span>
                  </div>
                  {item.href ? (
                    <a
                      href={item.href}
                      {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="mt-3 block text-[14px] leading-relaxed text-cream-100/80 transition-colors hover:text-gold-300"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="mt-3 text-[14px] leading-relaxed text-cream-100/80">{item.value}</p>
                  )}
                </div>
              ))}
            </div>
          </Reveal>

          {info.schedule && (
            <Reveal from="up" delay={120}>
              <div className="mt-6 flex flex-col items-center gap-3 rounded-[1.5rem] border border-gold-400/25 bg-gold-400/[0.06] px-7 py-6 text-center sm:flex-row sm:justify-center sm:text-left">
                <Icon name="schedule" className="text-[26px] text-gold-400" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest2 text-gold-400">Orari dei culti</p>
                  <p className="mt-1 whitespace-pre-line text-[15px] text-cream-50">{info.schedule}</p>
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* --- Comunità in costruzione (Gaeta) --- */}
      {base.inProgress && !content.chapters.length ? (
        <section className="bg-ink-900 py-24 sm:py-32">
          <div className="container">
            <Reveal className="mx-auto max-w-2xl text-center">
              <Icon name="construction" className="text-[44px] text-gold-400" />
              <h2 className="h-display mt-6 text-[1.9rem] text-cream-50 sm:text-4xl">Pagina in preparazione</h2>
              <p className="mt-5 text-[15px] leading-relaxed text-cream-100/60">{content.lead[0]}</p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                <a href={base.phoneHref} className="btn-gold">
                  <Icon name="call" className="text-[18px]" />
                  {base.phone}
                </a>
                <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="btn-outline">
                  <Icon name="chat" className="text-[18px]" />
                  WhatsApp
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      ) : (
        <>
          {/* --- Storia --- */}
          <section className="bg-ink-900 py-24 sm:py-32">
            <div className="container">
              <SectionHeading
                eyebrow={`Dal ${base.since}`}
                title="Storia della comunità"
                lead={content.lead[1]}
                className="mb-16"
              />

              <div className="mx-auto max-w-3xl space-y-14">
                {content.chapters.map((ch, i) => (
                  <Reveal key={ch.title} delay={i * 60} from="up">
                    <article className="relative border-l border-white/10 pl-8">
                      <span
                        aria-hidden="true"
                        className="absolute -left-[7px] top-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gold-400"
                      />
                      <h3 className="h-display text-2xl text-cream-50">{ch.title}</h3>
                      <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-cream-100/65">
                        {ch.body.map((p, j) => (
                          <p key={j}>{p}</p>
                        ))}
                      </div>
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* --- Galleria --- */}
          {gallery.length > 0 && (
            <section className="bg-ink-950 py-24 sm:py-32">
              <div className="container">
                <SectionHeading eyebrow="Momenti insieme" title={`L'Oasi ${base.city} in immagini`} className="mb-14" />
                <GalleryGrid items={gallery} columns={3} />
              </div>
            </section>
          )}

          {/* --- Famiglia pastorale --- */}
          <section className="bg-ink-900 py-24 sm:py-32">
            <div className="container">
              <SectionHeading eyebrow="Gesù è il centro di tutto" title="Pastore e famiglia" className="mb-16" />
              <TeamGrid people={pastorFamily} columns={4} />
            </div>
          </section>

          {/* --- Collaboratori --- */}
          {team.length > 0 && (
            <section className="bg-ink-950 py-24 sm:py-32">
              <div className="container">
                <SectionHeading
                  eyebrow="Al servizio della comunità"
                  title={`Collaboratori — ${base.city}`}
                  className="mb-16"
                />
                <TeamGrid people={team} columns={4} />
              </div>
            </section>
          )}
        </>
      )}

      {/* --- Altre comunità --- */}
      <section className="bg-ink-900 py-24">
        <div className="container">
          <SectionHeading eyebrow="Le nostre chiese" title="Scopri le altre comunità" className="mb-14" />
          <div className="grid gap-7 sm:grid-cols-2">
            {others.map((c, i) => (
              <Reveal key={c.slug} delay={i * 100} from="up">
                <Link
                  to={`/chiese/${c.slug}`}
                  className="group relative block aspect-[16/9] overflow-hidden rounded-[1.75rem] border border-white/10"
                >
                  <img
                    src={c.cover}
                    alt={c.city}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform [transition-duration:1200ms] group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/30 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-7">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest2 text-gold-300">L’Oasi</p>
                      <h3 className="h-display mt-1 text-3xl text-cream-50">{c.city}</h3>
                    </div>
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-cream-100 transition-all group-hover:border-gold-400 group-hover:bg-gold-400 group-hover:text-ink-950">
                      <Icon name="arrow_forward" className="text-[20px]" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}
