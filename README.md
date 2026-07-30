# Chiesa Cristiana Evangelica L'Oasi — sito + gestionale

Sito pubblico delle comunità L'Oasi di **Latina**, **Terracina** e **Gaeta**,
riscritto in **React + Vite + Tailwind CSS**, con area riservata (gestionale)
su **Supabase** e immagini su **Cloudflare R2**.

---

## Avvio rapido

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
npm run preview  # anteprima della build
```

Serve un file `.env` nella root (vedi `.env.example`):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_R2_PUBLIC_URL=...
```

> `.env` è in `.gitignore`: le chiavi non finiscono nel repository.
> Su Vercel vanno impostate come *Environment Variables* del progetto.

---

## Struttura

```
index.html                  Entry point Vite
src/
  main.jsx                  Bootstrap React
  App.jsx                   Rotte + redirect dai vecchi URL
  index.css                 Tailwind + design system (bottoni, eyebrow, glass…)
  data/
    site.js                 TUTTI i contenuti reali del sito (fallback statico)
    privacy.js              Testo dell'informativa privacy
  components/               Navbar, Footer, SiteLayout, PageHero, Reveal,
                            GalleryGrid, Lightbox, TeamGrid, SectionHeading,
                            Icon, Seo, ScrollManager, ProtectedRoute
  hooks/
    useSupabaseTable.js     Lettura tabella pubblica con fallback statico
  lib/
    supabase.js  r2.js      Client Supabase e upload immagini
  pages/
    Home · About · Faith · ChiesaDetail · Mission · Privacy · NotFound
    AdminLogin · AdminDashboard        (area riservata)

public/                     images/ · video/ · robots.txt · sitemap.xml
_legacy/                    Vecchio sito statico (HTML/CSS/JS) — solo archivio
tailwind.config.js          Palette, font e token Material 3
supabase_schema.sql         Schema del database
supabase_seed_dados_reais.sql  Dati reali delle chiese (da eseguire una volta)
```

---

## Rotte

| URL                      | Pagina                                   |
| ------------------------ | ---------------------------------------- |
| `/`                      | Home                                     |
| `/chi-siamo`             | Chi siamo, storia, famiglia pastorale    |
| `/fede`                  | 14 principi fondamentali di fede         |
| `/chiese/:slug`          | `latina` · `terracina` · `gaeta`         |
| `/missioni/:slug`        | `argentina` · `cambogia`                 |
| `/privacy`               | Politica sulla riservatezza              |
| `/admin`                 | Login area riservata                     |
| `/admin/dashboard`       | Gestionale (rotta protetta)              |

I vecchi indirizzi (`/about-us.html`, `/chiesa-latina.html`, …) reindirizzano
automaticamente alle nuove rotte.

---

## Contenuti dinamici vs statici

Ogni sezione gestibile legge da Supabase e, **se non ci sono record**, mostra il
contenuto curato in `src/data/site.js`. Così il sito è sempre completo, anche
prima che il pastore inserisca i dati.

| Sezione        | Tabella        | Fallback statico          |
| -------------- | -------------- | ------------------------- |
| Slider home    | `banners`      | `heroSlides`              |
| Eventi         | `eventi`       | `fallbackEvents`          |
| Testimonianze  | `depoimentos`  | `testimonials`            |
| Scheda chiesa  | `igrejas`      | `churches` (campo x campo)|
| Collaboratori  | `diretoria`    | `churchContent[slug].team`|
| Galleria       | `igreja_fotos` | `churches[].gallery`      |

### Prima configurazione del database

Nel SQL Editor di Supabase, in quest'ordine:

1. `supabase_schema.sql` — tabelle, RLS e policy
2. `supabase_seed_dados_reais.sql` — indirizzi, telefoni, collaboratori e
   testimonianze reali (sostituisce i dati di esempio)

---

## Design system

Tutto è centralizzato in `tailwind.config.js` + `src/index.css`.

- **Colori marca**: `gold-*` (oro caldo, `#C8A165`), `ink-*` (inchiostro),
  `cream-*` (avorio)
- **Token Material 3**: `primary`, `surface-container-*`, `on-surface`,
  `outline-variant`… — già pronti per le schermate del gestionale
- **Font**: `font-headline` (Playfair Display), `font-body` (Inter),
  `font-script` (Kalam)
- **Icone**: Material Symbols Outlined via `<Icon name="church" />`
- **Classi utili**: `.btn-gold`, `.btn-outline`, `.eyebrow`, `.h-display`,
  `.glass`, `.link-underline`
- **Animazioni**: `animate-kenburns`, `animate-mirror`, `animate-floaty`,
  più `tailwindcss-animate` (`animate-in fade-in slide-in-from-*`)

Per le animazioni allo scroll usa `<Reveal from="up" delay={100}>`.

---

## Manutenzione

- **Ultimi video YouTube** (home): usa la playlist automatica dei caricamenti
  del canale (`UU` + ID canale, in `site.js`). Si aggiorna da sola, senza API key.
- **Immagini**: max 1600 px di larghezza, JPEG progressivo qualità ~82,
  in `public/images/`.
- **Analytics**: Google Tag Manager `GTM-P9FT69` (in `index.html`).
- **Deploy**: Vercel — `vercel.json` fa il rewrite di tutte le rotte su
  `index.html` (necessario per il routing lato client).
