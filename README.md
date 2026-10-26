# EzyAgric website

The marketing site for the **EzyAgric** farmer app, by Akorion Company Limited (Uganda).

Its job is to make the app's four tools clear in a few seconds on a cheap Android phone, and to get farmers to install the app:

| Tool | What it is | Page |
|---|---|---|
| **Ka-Ezy** | AI farm assistant | `/ka-ezy/` |
| **Agrishop** | Farm inputs and vet services | `/agrishop/` |
| **EzyCredits** | Wallet (pay now) and Pay Later (credit by Pezesha) | `/ezycredits/` |
| **Produce Market** | Farmers list their produce for sale | `/produce-market/` |

It also serves village agents (agent app) and partner organisations (web portal).

The site is built with Next.js (App Router, TypeScript, Tailwind CSS) and exported as **plain static files** (`out/`) that nginx serves. There is no server code, database or contact form. Pages work with JavaScript turned off; JavaScript is only used for the video player and the analytics consent banner.

---

## Requirements

- **Node.js 24** (the version is in `.nvmrc`; with nvm run `nvm use`).
- npm (comes with Node).
- Docker, only to build the production image.

## Quick start

```bash
npm ci          # install exact dependency versions from package-lock.json
npm run dev     # http://localhost:3000, reloads as you edit
```

Other commands:

| Command | What it does |
|---|---|
| `npm run build` | Builds the static site into `out/` |
| `npm run preview` | Serves `out/` at http://localhost:3000 (run `build` first) |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run images` | Converts originals in `assets-src/` into WebP files in `public/images/` |

---

## Editing the website copy

**All the text on the site lives in YAML files**, so the EzyAgric team can change wording without touching code (GitHub's web editor is fine):

- `content/site.yaml` — home page, contact details, FAQ, partners, videos, social links, search title and description.
- `content/products/ka-ezy.yaml`, `agrishop.yaml`, `ezycredits.yaml`, `produce-market.yaml` — one file per product page.

Change the text, keep the indentation (spaces, not tabs). Put text in quotes if it contains a colon (`:`) or starts with a special character.

Every file is checked when the site builds (`src/lib/content.ts`). A typo in a field name, a missing field or an unknown icon name **stops the build** with a message saying which file and field is wrong, instead of publishing a broken page.

### Marking text that still needs confirmation

Anything not yet confirmed can be marked `pending: true`, with a `note` saying what must be checked:

```yaml
faq:
  - q: Where can I sell?
    a: Produce Market is available in Uganda for now.   # confirmed: shown everywhere

  - q: How do buyers contact me?
    a: "Buyers who see your listing get in touch with you."
    pending: true                   # not confirmed yet
    note: "Confirm how buyers contact farmers."
```

Single sentences can use the same form:

```yaml
availability:
  text: Works wherever you can use the EzyAgric app
  pending: true
  note: Confirm which countries to name.
```

What happens:

| Build | Pending items |
|---|---|
| `preview` (default) and `staging` | Shown, with an orange **To confirm** badge. Hover or tap the badge to see the note. A banner at the top explains the badges. |
| `production` | **Left out completely.** |

So the team can review everything on staging, and nothing unconfirmed reaches the live site. To publish an item, confirm it and delete its `pending` and `note` lines.

---

## Images

Originals (PNG/JPG, full size) live in `assets-src/`. The site uses small WebP copies in `public/images/`, made by:

```bash
npm run images
```

To add or replace an image:

1. Put the original in the right folder of `assets-src/` (`screens/`, `app/`, `photos/`, `partners/`, `brand/`, `videos/`).
2. If it is a new file, add a line for it in `scripts/optimize-images.mjs` (source, output name, maximum width).
3. Run `npm run images`. It prints the size of every output file.
4. Use the output in the YAML: `src` (starting with `/images/`), `alt` (what the image shows; empty for decoration), and the output `width` and `height` printed by the script.
5. Commit both the original and the WebP file. The Docker build does not run this step.

Images are cached by browsers for 30 days. When you replace an image that is already live, give the new file a new name so visitors see it straight away.

The **share images** (the picture shown when a link is posted on WhatsApp, Facebook or X) are drawn at build time by `src/app/opengraph-image.tsx` (site) and `src/app/[slug]/opengraph-image.tsx` (one per product). They use the product name and app tagline from the YAML, the PNG artwork in `assets-src/app/`, and the Nunito Sans font in `assets-src/fonts/` (SIL Open Font License, `OFL.txt`).

---

## Environment variables

These are read **at build time** and baked into the files, so each environment needs its own build.

| Variable | Values | Default | Effect |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_ENV` | `preview`, `staging`, `production` | `preview` | Only `production` hides pending items, drops the preview banner and lets search engines index the site. |
| `NEXT_PUBLIC_SITE_URL` | e.g. `https://ezyagric.com` | `https://ezyagric.com` | Used for canonical URLs, the sitemap, robots.txt, share images and structured data. No trailing slash. |
| `NEXT_PUBLIC_GA_ID` | GA4 measurement ID, e.g. `G-XXXXXXXXXX` | empty | Empty = no analytics, no cookie banner, no "Cookie settings" link. |

For local work, put them in `.env.local` (git-ignored), for example:

```bash
NEXT_PUBLIC_SITE_ENV=staging
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Analytics and privacy

- Google Analytics 4 loads **only after the visitor taps "Accept"** on the cookie banner. Before that, or after "No thanks", no Google script is requested and no cookie is set. The choice is stored in the browser; "Cookie settings" in the footer reopens the banner.
- Google Consent Mode v2 is used with everything denied by default; accepting grants analytics storage only (ads features stay off).
- Buttons and links send events through `data-track` attributes, picked up by one click listener in `src/components/analytics/Analytics.tsx`:
  - `get_app_click` (`product`, `position`)
  - `portal_login_click`, `agent_app_click`
  - `whatsapp_click`, `tel_click`, `email_click`
  - `video_play` (`video_id`)
- Play Store links also carry a referrer (`utm_source=website&utm_medium=<position>&utm_campaign=<product>`), so installs show up per page and button in Play Console even without cookies.
- YouTube videos show a local thumbnail and load from `youtube-nocookie.com` only when tapped.

---

## Build and preview the static site

```bash
npm run build
npm run preview    # http://localhost:3000
```

`out/` contains one folder per page (`out/ka-ezy/index.html`), plus `404.html`, `sitemap.xml`, `robots.txt` and the share images (`out/opengraph-image`, `out/ka-ezy/opengraph-image`, … — PNG files without an extension).

The preview server is a simple file server. Security headers, caching, redirects and the content type of the share images come from nginx, so check those with Docker (below).

---

## Deploy with Docker

The `Dockerfile` builds the site with Node 24, then copies only `out/` into an nginx image. Nothing else from the repository (no `.git`, no source) ends up in the served folder.

```bash
# Production
docker build -t ezyagric-web:prod \
  --build-arg NEXT_PUBLIC_SITE_ENV=production \
  --build-arg NEXT_PUBLIC_SITE_URL=https://ezyagric.com \
  --build-arg NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX \
  .

# Staging (shows pending items, not indexed by search engines)
docker build -t ezyagric-web:staging \
  --build-arg NEXT_PUBLIC_SITE_ENV=staging \
  --build-arg NEXT_PUBLIC_SITE_URL=https://staging.ezyagric.com \
  .

docker run --rm -p 8080:80 ezyagric-web:prod    # http://localhost:8080
```

The build needs internet access (npm packages, and the Nunito Sans web font, which Next.js downloads once and then serves from the site itself).

`nginx/nginx.conf` (installed as `/etc/nginx/conf.d/default.conf`):

- Serves pages from their folders; `/ka-ezy` redirects to `/ka-ezy/`; unknown URLs get `404.html` with a 404 status.
- `301` from `/index.html` (and `/<page>/index.html`) to the clean URL. **Add any other old-URL redirects** in the marked spot.
- Caching: `/_next/static/` one year (file names change on every build), `/images/` 30 days, HTML and page data always revalidated.
- gzip for HTML, CSS, JS, JSON, SVG and text.
- Security headers: `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`. The CSP allows inline scripts (`'unsafe-inline'`) because a Next.js static export writes page data into inline `<script>` tags that change on every build and nginx cannot add per-request nonces to static files; the site renders no user input, so the risk is low. It also allows Google Analytics and YouTube (no-cookie) only.
- Dotfiles (`/.git`, `/.env`, …) return 404; `/.well-known/` stays reachable for domain verification and Android app links.
- HTTPS and HSTS are left to the load balancer or proxy in front of the container.

---

## Hand-off checklist (before launch)

- [ ] **GA4:** create the property and set `NEXT_PUBLIC_GA_ID` in the production build. Check the banner, "Accept", "No thanks" and "Cookie settings", and that events arrive in GA4 DebugView.
- [ ] **Pending items:** build with `NEXT_PUBLIC_SITE_ENV=staging`, go through every **To confirm** badge with the EzyAgric team, then confirm or remove each item in `content/`.
- [ ] **Legal review:** all EzyCredits / Pay Later wording, the Pezesha lender line and key-facts box (Pezesha and legal), and the new **"Analytics and embedded videos"** section of the privacy policy. Once approved, add that section to `public/docs/privacy-policy.pdf` and update the "Last updated" date on `/privacy-policy/`.
- [ ] **Play Store listing:** update it in the same week so it names Ka-Ezy, Agrishop, EzyCredits and Produce Market like the site.
- [ ] **Search Console:** the verification tag is in `content/site.yaml` (`seo.googleSiteVerification`). After launch, submit `https://ezyagric.com/sitemap.xml`.
- [ ] **Redirects:** list old URLs that still get traffic or links (Search Console, analytics) and add `301`s in `nginx/nginx.conf`.
- [ ] **Share previews:** paste a home and a product URL into WhatsApp or the Facebook Sharing Debugger and check the image and text.
- [ ] **Smoke test the image:** `docker run -p 8080:80 …`, then check `/`, the four product pages, `/privacy-policy/`, a missing page (404), `/.git/HEAD` (must be 404), `/robots.txt` and `/sitemap.xml`.
- [ ] **Delete `legacy/`** (see below).

---

## Project structure

```
content/                  All website copy (YAML) — edit here
  site.yaml
  products/*.yaml
assets-src/               Image originals, share-image artwork and fonts
public/
  images/                 Optimised WebP images (output of npm run images)
  docs/privacy-policy.pdf
scripts/optimize-images.mjs
src/
  app/                    Routes (Next.js App Router)
    layout.tsx            Header, footer, fonts, site metadata, analytics, structured data
    page.tsx              Home page
    [slug]/               Product pages (+ their share images)
    privacy-policy/
    not-found.tsx         404 page
    sitemap.ts, robots.ts, opengraph-image.tsx
  components/
    home/                 Home page sections
    product/              Product page sections
    layout/               Header, footer, logo, preview banner
    ui/                   Buttons, icons, badges, video player, …
    analytics/            GA4 consent banner and "Cookie settings" button
    seo/                  JSON-LD and share-image renderer
  lib/
    content.ts            YAML schemas and loaders
    env.ts                Build-time settings
    links.ts              Play Store, WhatsApp, phone and email links
    track.ts              Analytics events
nginx/nginx.conf          Web server config used by the Docker image
Dockerfile
```

Notes for engineers:

- This Next.js version may differ from what you know. Read `AGENTS.md` and the docs in `node_modules/next/dist/docs/` before using an unfamiliar API.
- Pages are Server Components; add `"use client"` only where interaction needs it. Menus and accordions use `<details>` so they work without JavaScript.
- Static export means no redirects, headers or rewrites in `next.config.ts`; those live in `nginx/nginx.conf`.
- Colours: text and buttons use the `*-700` / `kaezy-600` / `ink` / `muted` tokens (they pass contrast checks); `*-500` colours are for decoration only. Tokens are in `src/app/globals.css`.

## The `legacy/` folder

`legacy/` is a copy of the old website (a Wayback Machine snapshot), kept only as a reference while the content was moved over. It is not built, linted or deployed (`.dockerignore` excludes it). **Delete it before launch**; the old site is also kept in git history under the tag `legacy-wayback`.
