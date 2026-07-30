import SiteLayout from '../components/SiteLayout'
import PageHero from '../components/PageHero'
import Reveal from '../components/Reveal'
import Icon from '../components/Icon'
import Seo from '../components/Seo'

import { privacyOwner, privacySections } from '../data/privacy'

export default function Privacy() {
  return (
    <SiteLayout transparentNav>
      <Seo
        title="Politica sulla Riservatezza"
        description="Informativa sulla privacy e sull'uso dei cookie del sito della Chiesa Cristiana Evangelica L'Oasi."
      />

      <PageHero
        image="/images/bg-about.jpg"
        eyebrow="Chiesa Cristiana Evangelica L'Oasi"
        title="Politica sulla Riservatezza"
        lead="Come trattiamo i dati di chi visita questo sito."
        breadcrumb={[{ label: 'Privacy' }]}
      />

      <section className="bg-ink-900 py-24 sm:py-32">
        <div className="container">
          <div className="mx-auto max-w-3xl space-y-12">
            {privacySections.map((section, i) => (
              <Reveal key={section.title} delay={Math.min(i, 4) * 60} from="up">
                <article>
                  <h2 className="h-display text-xl text-cream-50 sm:text-2xl">{section.title}</h2>
                  <span aria-hidden="true" className="mt-4 block h-px w-16 bg-gold-400/60" />

                  <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-cream-100/60">
                    {section.blocks?.map((p, j) => (
                      <p key={j}>{p}</p>
                    ))}
                  </div>

                  {section.list && (
                    <ul className="mt-5 space-y-3">
                      {section.list.map((li, j) => (
                        <li key={j} className="flex gap-3 text-[15px] leading-relaxed text-cream-100/60">
                          <Icon name="check_small" className="mt-0.5 shrink-0 text-[20px] text-gold-400" />
                          <span>{li}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              </Reveal>
            ))}

            <Reveal from="up">
              <aside className="rounded-[1.75rem] border border-gold-400/25 bg-gold-400/[0.06] p-8">
                <p className="text-[10px] font-bold uppercase tracking-widest2 text-gold-400">Titolare del trattamento</p>
                <h2 className="h-display mt-3 text-xl text-cream-50">{privacyOwner.name}</h2>
                <ul className="mt-5 space-y-2.5 text-[15px] text-cream-100/70">
                  <li className="flex items-start gap-3">
                    <Icon name="location_on" className="mt-0.5 text-[18px] text-gold-400" />
                    {privacyOwner.address}
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon name="call" className="mt-0.5 text-[18px] text-gold-400" />
                    <a href={`tel:${privacyOwner.phone}`} className="link-underline hover:text-gold-300">
                      Tel/Fax: {privacyOwner.phone}
                    </a>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon name="mail" className="mt-0.5 text-[18px] text-gold-400" />
                    <a href={`mailto:${privacyOwner.email}`} className="link-underline hover:text-gold-300">
                      {privacyOwner.email}
                    </a>
                  </li>
                </ul>
                <p className="mt-6 text-[14px] leading-relaxed text-cream-100/50">
                  Per esercitare i diritti previsti dall’art. 7 del Codice della Privacy, ovvero per la cancellazione dei
                  vostri dati dall’archivio, è sufficiente contattarci attraverso uno dei canali messi a disposizione.
                </p>
              </aside>
            </Reveal>
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}
