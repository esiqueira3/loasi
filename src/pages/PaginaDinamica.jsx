import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import SiteLayout from '../components/SiteLayout'
import PageHero from '../components/PageHero'
import Seo from '../components/Seo'
import Icon from '../components/Icon'

export default function PaginaDinamica() {
  const { slug } = useParams()
  const [pagina, setPagina] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function carica() {
      setLoading(true)
      const { data, error } = await supabase
        .from('paginas_menu')
        .select('*')
        .eq('slug', slug)
        .eq('ativo', true)
        .maybeSingle()

      if (active) {
        if (!error && data) {
          setPagina(data)
        } else {
          setPagina(null)
        }
        setLoading(false)
      }
    }

    carica()
    return () => {
      active = false
    }
  }, [slug])

  if (loading) {
    return (
      <SiteLayout>
        <div className="py-24 text-center text-cream-200/60">
          <Icon name="sync" className="mx-auto text-[36px] animate-spin mb-3 text-gold-400" />
          <p className="text-[14px]">Caricamento della pagina…</p>
        </div>
      </SiteLayout>
    )
  }

  if (!pagina) {
    return (
      <SiteLayout>
        <Seo title="Pagina non trovata" />
        <PageHero title="Pagina non trovata" breadcrumb={[{ label: 'Pagine' }, { label: 'Errore 404' }]} />
        <div className="container py-20 text-center">
          <Icon name="auto_stories" className="mx-auto text-[48px] text-gold-400/40 mb-3" />
          <h2 className="font-headline text-2xl font-bold text-cream-50">Pagina non disponibile</h2>
          <p className="mt-2 text-cream-100/60">La pagina richiesta potrebbe essere stata spostata o disattivata.</p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-2xl bg-gold-400 px-6 py-3 text-[13px] font-bold text-ink-950 hover:brightness-110 transition-all shadow-md"
            >
              <Icon name="home" className="text-[18px]" />
              Torna alla Home
            </Link>
          </div>
        </div>
      </SiteLayout>
    )
  }

  return (
    <SiteLayout>
      <Seo title={pagina.label} description={pagina.label} />

      <PageHero
        title={pagina.label}
        breadcrumb={[{ label: 'Pagine' }, { label: pagina.label }]}
      />

      <section className="relative py-16 lg:py-24 bg-canvas-parchment">
        <div className="container mx-auto max-w-4xl">
          <div className="rounded-3xl border border-hairline bg-surface-card p-6 shadow-soft lg:p-12">
            {pagina.conteudo ? (
              <article
                className="prose prose-lg max-w-none text-ink leading-relaxed space-y-4 font-sans [&_h2]:font-headline [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-ink [&_h3]:font-headline [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-ink [&_p]:text-ink-muted-80 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-gold-400 [&_blockquote]:pl-4 [&_blockquote]:italic [&_img]:rounded-2xl [&_img]:shadow-md"
                dangerouslySetInnerHTML={{ __html: pagina.conteudo }}
              />
            ) : (
              <div className="py-12 text-center text-ink-muted-48">
                <Icon name="description" className="mx-auto text-[36px] opacity-40 mb-2" />
                <p className="text-[14px]">Nessun contenuto ancora inserito in questa pagina.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}
