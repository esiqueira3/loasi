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
    AdminLogin                          (accesso all'area riservata)

  admin/                    GESTIONALE (area riservata, tutto in italiano)
    theme.js                Menu, colori dei moduli, formattazione it-IT / EUR
    components/
      AdminLayout.jsx       Guscio: sidebar + header + area di contenuto
      Sidebar.jsx           Menu laterale (comprimibile, con sottomenu)
      ui.jsx                Kpi · Panel · Segmented · CustomSelect · Modal
                            ControlBar · Table · StatusToggle · Pagination
                            Loading · EmptyState · bottoni
      Toast.jsx             Notifiche       Confirm.jsx  Dialoghi di conferma
    hooks/useFinanze.js     Titoli, rate, stati e piano di rateizzazione
    pages/
      Dashboard.jsx         Home del pastore
      Finanze.jsx           + finanze/viste.jsx · finanze/modali.jsx
      Categorie.jsx         Categorie di entrate e uscite
      Chiese.jsx            Comunità (scrive sulle tabelle del sito pubblico)
      Dipartimenti.jsx      Gruppi e ministeri
      Membri.jsx            Anagrafica dei membri
      Utenti.jsx            Persone abilitate + invito via e-mail
      Profili.jsx           Permessi per sezione (nessuno/lettura/completo)
    hooks/usePermessi.jsx   Permessi dell'utente collegato; filtra il menu

public/                     images/ · video/ · robots.txt · sitemap.xml
_legacy/                    Vecchio sito statico (HTML/CSS/JS) — solo archivio
.modelos/                   Modelli di riferimento delle schermate (non compilati)
tailwind.config.js          Palette, font e token del design system
supabase_schema.sql         Schema del sito pubblico
supabase_seed_dados_reais.sql  Dati reali delle chiese (da eseguire una volta)
supabase_gestionale.sql     Tabelle del gestionale (da eseguire una volta)
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

Rotte del gestionale (tutte protette da `ProtectedRoute`):

| URL                        | Schermata                                |
| -------------------------- | ---------------------------------------- |
| `/admin/dashboard`         | Home — panoramica della chiesa           |
| `/admin/chiese`            | Chiese — anagrafica pubblicata sul sito  |
| `/admin/dipartimenti`      | Dipartimenti — gruppi e ministeri        |
| `/admin/membri`            | Membri — anagrafica e appartenenze       |
| `/admin/finanze`           | Finanze — vista per comunità, flusso, movimenti, agenda, uscite |
| `/admin/finanze/categorie` | Categorie di entrate e uscite            |
| `/admin/utenti`            | Utenti — persone abilitate e inviti      |
| `/admin/utenti/profili`    | Profili — permessi per sezione           |

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

1. `supabase_schema.sql` — tabelle del sito pubblico, RLS e policy
2. `supabase_seed_dados_reais.sql` — indirizzi, telefoni, collaboratori e
   testimonianze reali (sostituisce i dati di esempio)
3. `supabase_gestionale.sql` — tabelle del gestionale + categorie e
   dipartimenti iniziali
4. `supabase_utenti.sql` — utenti, profili di accesso e profili iniziali

> **Sicurezza.** Le tabelle del sito pubblico sono leggibili da chiunque
> (servono al sito). Quelle del gestionale — `membri`, `dipartimenti`,
> `titoli_finanziari`, `rate_finanziarie`, `categorie_finanziarie` — sono
> accessibili **solo agli utenti autenticati**, e i `promemoria` solo al
> proprietario. Anagrafica e contabilità non devono mai finire nell'API
> pubblica.

> **Nota sui nomi.** Le tabelle del sito pubblico sono in portoghese
> (`igrejas`, `eventos`, `banners`…) perché già esistenti; quelle del
> gestionale sono in italiano. Rinominare le prime romperebbe il sito.

---

## Design system

Tutto è centralizzato in `tailwind.config.js` + `src/index.css`.

### Sito pubblico (fondo scuro)

- **Colori marca**: `gold-*` (oro caldo, `#C8A165`), `ink-*` (inchiostro),
  `cream-*` (avorio)
- **Classi utili**: `.btn-gold`, `.btn-outline`, `.eyebrow`, `.h-display`,
  `.glass`, `.link-underline`

### Gestionale (fondo chiaro)

Il linguaggio visivo è quello del modello `Financeiro.jsx`, applicato a
**tutte** le schermate del sistema:

| Token                   | Uso                                            |
| ----------------------- | ---------------------------------------------- |
| `bg-canvas`             | Header e chrome                                |
| `bg-canvas-parchment`   | Fondo dell'area di contenuto, campi dei form   |
| `bg-surface-pearl`      | Card e pannelli                                |
| `border-hairline`       | Il bordo sottile onnipresente                  |
| `text-ink`              | Testo principale                               |
| `text-ink-muted-80`     | Testo secondario                               |
| `text-ink-muted-48`     | Testo terziario, etichette                     |
| `font-display-lg`       | Titoli di pagina (Playfair Display, `font-light`) |
| `.fade-in`              | Comparsa dei contenuti                         |

Gli stessi token esistono come variabili CSS (`--color-hairline`,
`--color-ink-muted-48`…) perché servono dentro agli SVG dei grafici.

Ogni modulo ha un colore d'accento in `src/admin/theme.js`: Home oro,
Finanze verde `#107C42`, Chiese azzurro, Dipartimenti viola, Membri blu.

Per una nuova schermata basta:

```jsx
<AdminLayout titolo="…" icona="…" accent={ACCENT.membri}>
  <PageTitle titolo="…" sottotitolo="…"><BtnPrimary>…</BtnPrimary></PageTitle>
  <Panel>…</Panel>
</AdminLayout>
```

- **Token Material 3**: `primary`, `surface-container-*`, `on-surface`,
  `outline-variant`… — usati dal modello di login
- **Font**: `font-headline` (Playfair Display), `font-body` (Inter),
  `font-script` (Kalam)
- **Icone**: Material Symbols Outlined via `<Icon name="church" />`
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
