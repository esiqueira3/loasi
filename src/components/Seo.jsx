import { useEffect } from 'react'
import { site } from '../data/site'

const setMeta = (attr, key, value) => {
  if (!value) return
  let tag = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', value)
}

/** Aggiorna title/description/OG a ogni cambio pagina. */
export default function Seo({ title, description, image }) {
  useEffect(() => {
    const full = title ? `${title} | ${site.name}` : site.name
    document.title = full
    setMeta('name', 'description', description)
    setMeta('property', 'og:title', full)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:image', image || '/images/Insieme2.jpg')

    let canonical = document.head.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', window.location.origin + window.location.pathname)
  }, [title, description, image])

  return null
}
