# Chiesa Cristiana Evangelica L'Oasi

Sito statico delle comunità L'Oasi di **Latina** e **Terracina**.
HTML/CSS/JS puro, senza build step.

## Struttura

```
index.html                  Home
about-us.html               Chi siamo
fede.html                   La nostra fede
chiesa-latina.html          Comunità di Latina
chiesa-terracina.html       Comunità di Terracina
argentina.html              Missione Argentina
cambogia.html               Missione Cambogia
politica-riservatezza.html  Privacy
404.html                    Pagina non trovata

css/     bootstrap.css · fonts.css · style.css
js/      core.min.js (librerie) · script.js
fonts/   FontAwesome · Material Design Icons · lightGallery
images/  video/
robots.txt · sitemap.xml · .nojekyll
```

## Sviluppo locale

Il sito non richiede compilazione, serve solo un server statico:

```bash
python3 -m http.server 8000
# apri http://localhost:8000
```

Aprire i file direttamente con `file://` non funziona correttamente
(percorsi relativi e caricamento dei font).

## Prima di pubblicare

Sostituire il dominio segnaposto in `robots.txt`, `sitemap.xml` e nei tag
`<link rel="canonical">` / `og:url` di ogni pagina:

```bash
grep -rl "esiqueira3.github.io/loasi" . \
  --include=*.html --include=*.xml --include=*.txt \
| xargs sed -i 's|https://esiqueira3.github.io/loasi|https://IL-TUO-DOMINIO|g'
```

## Note di manutenzione

- **Ultimi video YouTube** (`index.html`): usa la playlist automatica dei
  caricamenti del canale (prefisso `UU` + ID del canale). Si aggiorna da sola
  a ogni nuovo video e **non richiede nessuna chiave API**.
- **Immagini**: mantenere larghezza massima 1600 px e qualità JPEG ~82,
  salvate in modalità progressiva.
- **Analytics**: attivo solo Google Tag Manager (`GTM-P9FT69`).
- **Icone**: Material Design Icons (`mdi-*`) e FontAwesome (`fa-*`).
