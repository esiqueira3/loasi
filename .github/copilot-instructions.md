<!-- .github/copilot-instructions.md - project-specific guidance for AI coding agents -->
# Project snapshot

This repository is a static website (plain HTML/CSS/JS) for a church site. There is no build system, package.json, or server-side code. Work modifies files under the repo root and is validated by opening pages in a browser.

# Quick architecture (big picture)
- **Frontend-only:** All pages are static HTML files (e.g. `index.html`, `about-us.html`, `chiesa-latina.html`).
- **Assets:** `css/`, `js/`, `images/`, `fonts/`, `video/` contain all runtime assets. Images are organized into subfolders and many sections use `grande/` and `piccolo/` variants (e.g. `images/argentina/grande/`).
- **Third-party libs (static):** `css/bootstrap.css`, `js/core.min.js`, `js/script.js` and plugins (Swiper, Owl, Isotope, LightGallery, etc.) are initialized in `js/script.js` using a `plugins` object and jQuery patterns.

# What to know to be productive
- Editing content: change the HTML files directly. Navigation is defined in `index.html` and mirrored across the site.
- Visual styles: primary styles live in `css/style.css`. `css/bkp-style.css` appears to be a backup—do not delete without confirming.
- JS patterns: `js/script.js` declares a `plugins` map and many initializers rely on data-attributes in HTML (e.g. `data-autoplay`, `data-loop`, `data-items`). Preserve those attributes when changing markup.
- Images: add new images to appropriate `images/` subfolders and reference them in HTML. For galleries/lightbox use `data-lightgallery="group"` attributes already in the markup.
- Fonts: `fonts/` contains local font files. Some FontAwesome filenames are suffixed (legacy). When updating icons, prefer existing CSS classes; do not rename font files unless updating `css/fonts.css` accordingly.

# Project-specific conventions and patterns
- Language/content: site content is Italian; filenames use hyphenated names (e.g. `chiesa-terracina.html`). Keep filename casing and accents consistent (the HTML contains accented characters). 
- Image sizes: the theme uses pairs of images (`grande`/`piccolo`) and thumbnails—follow existing folders when adding variants.
- Slider & carousel changes: `index.html` and other pages configure sliders via HTML attributes (Swiper/Owl). To modify slider behavior, change `data-` attributes rather than editing `js/script.js` unless adding new plugin logic.
- Preloader & transitions: the preloader and pageTransition are initialized in `js/script.js` and expect `.preloader` and `.page` elements.

# Common tasks & concrete examples
- Change site title/logo: edit `index.html` <head> `<title>` and the `<img>` inside `.rd-navbar-brand` (logo images in `images/`).
- Update WhatsApp link: replace the `href` in the nav button (`index.html` has `https://wa.link/1qw939`).
- Add a gallery image: put file in `images/<section>/grande/` and add an `<a href="images/.../grande.jpg" data-lightgallery="item">` element consistent with existing gallery markup.
- Adjust slider autoplay: edit the slider container's attribute: e.g. `<div class="swiper-container" data-loop="true" data-autoplay="true">`.

# Testing & developer workflow
- No automated tests or build steps found. Typical workflow:
  - Edit files locally (use an editor/VS Code).
  - Open the changed HTML in a browser (disable cache while developing).
  - Confirm JS behaviors (carousels, lightbox) and mobile/responsive layout.
- Backups: `index.html.bak` exists—check backups before destructive changes.
- Deploy: no deploy scripts found; deployment appears manual (FTP/SFTP/hosting copy). Ask the repo owner for exact deployment steps.

# Integration and external dependencies
- External fonts are loaded from Google Fonts in `index.html` (Lato, Playfair Display, Kalam).
- Social and media links point to external services (WhatsApp, YouTube, Flickr). Do not change target accounts without confirmation.

# When to modify `js/script.js`
- Prefer changing HTML `data-` attributes for configuration.
- Edit `js/script.js` only when adding new plugin initialization or fixing plugin conflicts. Follow existing patterns: initialize plugins via the `plugins` object and use `lazyInit`, `isScrolledIntoView`, and `$(window).on('load', ...)` hooks.

# If merging with existing instruction files
- I found no `.github/copilot-instructions.md`, `AGENT.md`, or `README.md` in the repo root—this file is additive. If you have a separate team README, point me to it and I will merge relevant content.

# Questions for you
- Do you want deployment steps (FTP/SFTP details) added if you can share host info?
- Should I include examples for adding new pages (template snippet) or keep this short?

Please review — I can iterate on tone, add templates/snippets, or merge if you provide an existing instructions file to combine.
