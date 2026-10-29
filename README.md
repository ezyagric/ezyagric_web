# EzyAgric website

The marketing site for the **EzyAgric** farmer app, by Akorion Company Limited (Uganda).

Its job is to make the app's four tools clear in a few seconds on a cheap Android phone, and to get farmers to install the app:

| Tool | What it is | Page |
|---|---|---|
| **Ka-Ezy** | AI farm assistant | `/ka-ezy/` |
| **Agrishop** | Farm inputs and vet products | `/agrishop/` |
| **EzyCredits** | Buy Now, Pay Later (credit from EzyAgric lender partners) | `/ezycredits/` |
| **Produce Market** | Farmers list their produce for sale | `/produce-market/` |

It also serves agribusiness enterprises: **EzyAgric Business** (`/ezyagric-business/`) brings the four services to them as a web portal or APIs, in four modules: EzySupplier (input suppliers), EzyProduce (off-takers), EzyCredits (financial institutions and fintechs) and EzyServices (extension enterprises), and to development partners, governments and other organisations interested in agriculture. Pricing is custom.

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
- `content/business.yaml` — the EzyAgric Business page, and the module tiles and screens in the home page's agribusiness section. Its screens come from the marketing team with customers' and staff names and phone numbers blurred out (`assets-src/screens-business/`); never commit an unblurred screenshot.

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

## Brand

The site follows the **EzyAgric Brand Guide v1.0 (2026)** from the *EzyAgric Creative & Content Pack: SmartAgric Community* Google Drive folder, which is also where the full Ka-Ezy artwork, the 2026 photos, the Ka-Ezy demo videos and the Ka-Ezy prices and campaign lines came from. Tagline: *Endless farming possibilities*.

- **Colours** (values in the `ezyagric` theme, `src/theme/themes.css`; see [Theming](#theming)): the EzyAgric logo blue `#05377E` for headlines, links and outlines (`heading`, `link`, `secondary`, `brand`; the blue of the "EzyAgric" wordmark, chosen by the EzyAgric team on 26 Oct 2026 in place of the guide's Primary Blue `#0043C0`), Vibrant Green `#0C9548` for icons, highlights and large text (`accent-bright`), Dark Navy `#05103B` for body text, card titles, the footer and dark bands (`body`, `title`, `inverse`). White or the `#F7F9FC` tint (`canvas`, `subtle`) carries most of each page; card borders are `#E4E8F2` (`line`). The signature gradient (logo blue to green) is the `gradient-brand` utility.
- **Accessible green:** white text on Vibrant Green is only 3.9:1, below WCAG AA. Buttons and small green text therefore use the deeper `#0A7F3D` (`primary`, `accent`; 5.1:1), and the gradient ends in it so white text passes across the band. Exact Vibrant Green is kept for icons, highlights, large text and decoration.
- **Type:** Nunito Sans only (loaded by `next/font`, fallback Trebuchet MS). Headlines Bold, sub-headlines SemiBold, section labels SemiBold capitals with 0.14em tracking, body Regular at 1.6 line height, never below 14px. The script tagline face is only ever seen inside the logo.
- **Buttons and cards:** primary buttons are a green fill with a white SemiBold label, fully rounded (pill) (team decision, 26 Oct 2026, instead of the guide's 8px radius); secondary buttons a blue outline on white (`src/components/ui/Button.tsx`). Cards are white with a 1px `#E4E8F2` border, 8px radius and navy titles. Icons are white line glyphs in a solid blue, green or navy circle (`IconCircle`).
- **Logo:** the logo and its tagline are one unit, so the site only uses the full lockup (`public/images/brand/ezyagric-logo.svg`; reversed white version `ezyagric-logo-white.svg` on navy, blue, green, the gradient and photos), through `src/components/layout/Logo.tsx`. At least 140px wide on screen; clear space of half the circular mark's height on every side; never stretched, recoloured, re-typeset, given effects or put in colour on a brand colour. `ezyagric-wordmark.svg` (no tagline) is kept in the repo but must not be used.
- **Naming:** always *EzyAgric* (one word, capital E and A) and *the EzyAgric App*.
- **Share images** follow the guide's link/X post layout: 1200x630, blue headline (two lines at most), product names in green, the logo bottom left at 180px, 60px margins.

---

## Theming

Every UI component takes its look from a **theme**. Components only use semantic token names — `bg-primary`, `text-heading`, `rounded-button`, `shadow-card` — never a colour, size or shape directly. To restyle the whole site you change the theme, not the components.

- **Where the values live:** `src/theme/themes.css`. Each theme is a block of `--theme-*` variables. `src/app/globals.css` maps them to the token names below (and switches off Tailwind's default colour palette, so nothing else can creep in).
- **Switch theme:** set `theme:` in `content/site.yaml`. It becomes `<html data-theme="…">`. Two themes ship today:
  - `ezyagric` (default): the logo blue and pill buttons, as decided by the EzyAgric team.
  - `ezyagric-guide`: the Brand Guide as written (Primary Blue `#0043C0`, 8px buttons).
- **Change a value:** edit it in the theme's block, e.g. `--theme-radius-button: 8px;` or `--theme-primary: #0a7f3d;`. Keep radii in `px` and colours as plain hex values (share images read them as numbers/strings).
- **Add a theme:** copy a block in `themes.css`, give it a new `[data-theme="name"]`, override only the values that differ, and add the name to `THEMES` in `src/theme/themes.ts`.
- **Share images and the Android browser colour** follow the active theme too: they read `themes.css` at build time through `src/theme/server.ts`.
- **Not part of a theme:** the logo files, the app screenshots and artwork, and the bundled share-image fonts are fixed brand assets.

| Token (use as `bg-…`, `text-…`, `border-…`, `ring-…`, `outline-…`) | Role |
|---|---|
| `canvas`, `subtle`, `card`, `inverse` | Page background, tinted bands, cards, dark bands/footer |
| `on-inverse`, `on-primary`, `on-brand`, `on-accent`, `on-secondary` | Text or icons on those fills |
| `heading`, `title`, `body`, `muted`, `label`, `link` | Headlines (h1/h2), card titles (h3), body copy, secondary text, section labels, links |
| `primary`, `primary-hover`, `secondary`, `secondary-hover` | Primary (filled) and secondary (outline) buttons |
| `brand`, `brand-soft`, `brand-soft-strong` | Brand-blue fills (icon circles, step numbers) and tints |
| `accent`, `accent-hover`, `accent-bright`, `accent-soft`, `accent-soft-strong` | Green highlights: small text, hover, icons/large text, tints |
| `line`, `shade`, `focus`, `focus-inverse` | Borders, shadow/overlay colour, focus rings |
| `review`, `review-soft` | "To confirm" badges only (preview builds) |

| Other tokens | Role |
|---|---|
| `rounded-button`, `rounded-card`, `rounded-media`, `rounded-control`, `rounded-pill`, `rounded-tile` | Buttons, cards, photos/screens, nav links and small controls, badges/chips, app-icon tiles. `rounded-full` is only for real circles. |
| `shadow-card`, `shadow-raised`, `shadow-device` | Cards, floating panels and hover, phone mock-ups |
| `font-heading`, `font-label`, `font-caption` | Headline, label/button and caption weights |
| `text-label-style`, `tracking-label`, `tracking-heading` | Section-label style (weight + 0.14em + capitals), letter-spacing |
| `gradient-brand`, `gradient-brand-decor` | Signature gradient behind text; decorative waves and stripes |

Product colours in `content/products/*.yaml` are roles too: `accent: brand | accent | deep`.

---

## Images

Originals (PNG/JPG, full size) live in `assets-src/`. The site uses small WebP copies in `public/images/`, made by:

```bash
npm run images
```

To add or replace an image:

1. Put the original in the right folder of `assets-src/` (`screens/`, `app/`, `photos/`, `photos-2026/`, `photos-field/`, `photos-poultry/`, `partners/`, `brand/`, `videos/`, `video-posters/`).
2. If it is a new file, add a line for it in `scripts/optimize-images.mjs` (source, output name, maximum width).
3. Run `npm run images`. It prints the size of every output file.
4. Use the output in the YAML: `src` (starting with `/images/`), `alt` (what the image shows; empty for decoration), and the output `width` and `height` printed by the script.
5. Commit both the original and the WebP file. The Docker build does not run this step.

What is where:

- `photos-2026/` — real photos from the Creative & Content Pack (a farmer with the EzyAgric App, Ka-Ezy at an exhibition, a farmer in his garden, an EzyAgric bag on a coffee farm), used on the home and product pages.
- `photos-field/` — EzyAgric field photos (2015, 2016 and 2020) from the marketing team's Website folder, used on the home page's journey and impact sections, the EzyCredits page and the Ka-Ezy page's steps (that one, `team-village-agent-maize`, exists only at 581px wide, so it is a little soft on sharp screens; a larger copy would help). They are saved at up to 2400px with their camera, owner and location data removed; the full-size originals stay in that folder, and `scripts/optimize-images.mjs` names each one's source file and credit (the 2020 photos are credited to Ronistar). Check a photo's credit before using it: `farmer 1.jpg` in that folder is a 2012 photo by another photographer, so it is not used.
- `photos-poultry/` — stills from "EzyAgric Poultry Video.mp4" (Marvin Busulwa's poultry farm, in the marketing team's Website folder): the video's poster and the four stills of the home page's livestock section. `scripts/optimize-images.mjs` notes each one's time in the video. Ten full-size stills from it are in that folder, under "EzyAgric Poultry Video stills".
- `app/ka-ezy-full.png` — the full Ka-Ezy character on a pure white background. Place it on a pure white (`#FFFFFF`) area, or its background shows as a white box.
- `videos/` — thumbnails for the YouTube videos; `video-posters/` — posters for the Ka-Ezy demo videos.
- `public/videos/*.mp4` — videos served from this site: the Ka-Ezy demo videos (4 to 11 MB, listed under `demoVideos` in `content/products/ka-ezy.yaml`) and a poultry farmer's story (`poultry-marvin-busulwa.mp4`, 3 minutes, 28 MB, in `livestock` in `content/site.yaml`). They use `preload="none"`, so nothing downloads until someone taps play. They are not processed by `npm run images`; keep new ones short and compressed (H.264, 720p or less, about 1 Mbps, with the index at the start of the file so playback starts before the download ends). The poultry video was made from the 102 MB original at 1280x720, 1.1 Mbps video and 96 kbps audio. It has no captions yet (see the launch checklist), and its own caption at 0:07 to 0:13 misspells "POULTRY" as "POUTRY"; replace the file when marketing sends a corrected export, compressed the same way.
- `brand/` — the logo SVGs (copied as they are) and the payment marks.

Images are cached by browsers for 30 days. When you replace an image that is already live, give the new file a new name so visitors see it straight away.

The **share images** (the picture shown when a link is posted on WhatsApp, Facebook or X) are drawn at build time by `src/app/opengraph-image.tsx` (site) and `src/app/[slug]/opengraph-image.tsx` (one per product). They use the product name, hero eyebrow and headline from the YAML, the PNG artwork in `assets-src/app/`, the logo SVG in `assets-src/brand/`, and the Nunito Sans font in `assets-src/fonts/` (SIL Open Font License, `OFL.txt`).

---

## Environment variables

These are read **at build time** and baked into the files, so each environment needs its own build.

| Variable | Values | Default | Effect |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_ENV` | `preview`, `staging`, `production` | `preview` | Only `production` hides pending items, drops the preview banner and lets search engines index the site. |
| `NEXT_PUBLIC_SITE_URL` | e.g. `https://ezyagric.com` | `https://ezyagric.com` | Used for canonical URLs, the sitemap, robots.txt, share images and structured data. No trailing slash. |
| `NEXT_PUBLIC_GA_ID` | GA4 measurement ID, e.g. `G-XXXXXXXXXX` | empty | Empty = no analytics, no cookie banner, no "Cookie settings" link. |
| `NEXT_PUBLIC_KAEZY_DEMO_API` | `/api/kaezy-demo` | empty | Live Ka-Ezy answers in "Try Ka-Ezy". Empty = sample answers. See "Ka-Ezy on the website". |

For local work, put them in `.env.local` (git-ignored), for example:

```bash
NEXT_PUBLIC_SITE_ENV=staging
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Analytics and privacy

- Google Analytics 4 loads **only after the visitor taps "Accept"** on the cookie banner. Before that, or after "No thanks", no Google script is requested and no cookie is set. The choice is stored in the browser; "Cookie settings" in the footer reopens the banner.
- Google Consent Mode v2 is used with everything denied by default; accepting grants analytics storage only (ads features stay off).
- Buttons and links send events through `data-track` attributes, picked up by one click listener in `src/components/analytics/Analytics.tsx`:
  - `get_app_click` (`product`, `position`, `store`: `app_store` or `google_play`); `position` is `how-it-works` for a product page's "Install the EzyAgric App" step
  - `portal_login_click` (`position`; on the EzyAgric Business page `business-hero` or `business-connect`)
  - `business_page_click` (`position`: `organisations-section` for the home page's button, `organisations-module` with `module` for its module tiles, `home-hero-slide` for "Learn more" on the hero's EzyAgric Business slide)
  - `business_module_click` (`module`; `position`: `business-contents` for the hero's Contents card, `business-index` for the sticky module index)
  - `business_product_click` (`module`, `product`): a chapter's "Built on" link to the service it is built on
  - `kaezy_try_click` (`position`): every "Try Ka-Ezy" button, the one button reused across the site: `home-hero`, `home-top`, `also-in-the-app`, `404`, `<slug>-page` (each service page's banner), `ka-ezy-page`, `product-hero`, `faq` and `faq-<slug>` (the help cards), `faq-answer` and `faq-answer-<slug>` (buttons under FAQ answers), `how-it-works` and `how-it-works-ask` (the Ka-Ezy page's "Tap Ka-Ezy" and "Ask anything" steps on builds with the demo; the second opens Farm Expert with the cursor in the question box)
  - `kaezy_banner_click` (`action`: watch, try or pay; `position`): the banner's Pay button (pay), the menus' Ka-Ezy card and strip (watch, try, pay), and on builds without the demo the Ka-Ezy page's "Tap Ka-Ezy" (watch) and "Ask anything" (pay) steps, position `how-it-works`, and the EzyServices chapter's link down to the banner on the EzyAgric Business page (watch), position `business-ezyservices`; that page's banner itself has position `ezyagric-business-page`
  - `kaezy_try_prompt` (`prompt`), `kaezy_try_ask`, `kaezy_try_nudge`
  - `kaezy_try_photo` (the photo buttons in Farm Expert), `kaezy_try_sample_photo` (`item`: the sample's crop, e.g. Maize)
  - `faq_action_click` (`action`): the other buttons under FAQ answers
  - `livestock_product_click` (`product`): the product tiles in the home page's livestock section
  - `kaezy_hire_continue` (`plan`), `kaezy_hire_pay` (`plan`, `network`)
  - `whatsapp_click`, `tel_click`, `email_click` (`position` where a page has several, e.g. `key-facts`; on the EzyAgric Business page `business-hero`, `business-module` with `module` for each chapter's "Ask about …", `business-connect` for "Ask about the APIs", `business-pricing-button` and `business-pricing` for the quotation slip's button and contact rows)
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

## Ka-Ezy on the website

Getting visitors to use Ka-Ezy is the main job of this site, so it appears in two forms:

- **The Ka-Ezy banner** (`src/components/promo/KaEzyBanner.tsx`, copy in `kaezyBanner` in `content/site.yaml`): the Ka-Ezy demo video plays right in it (**See Ka-Ezy in action**), beside three numbered steps: **Try Ka-Ezy**, **Pay** and **Download the App**. It sits on the home page (after the hero), straight after the hero on the Ka-Ezy page, after the features on the Agrishop, EzyCredits and Produce Market pages, and on the 404 page. Every "Try Ka-Ezy" button is the same button (`TryKaEzyButton`): it opens the demo on the Ka-Ezy page when it is shown, and otherwise goes to the Ka-Ezy page; on the Ka-Ezy page itself it then jumps to the banner's "Download the App" step, whose store badges carry the Ka-Ezy campaign. A Ka-Ezy card (See Ka-Ezy in action, Try Ka-Ezy, Pay for Ka-Ezy) sits in the "Our services" menu, and a strip with the same three in the phone menu. The footer's store badges carry the id `get-the-app` on every page, so links from outside the site (campaigns, messages) can point to `/#get-the-app`.
- **"Ask Ka-Ezy, then hire it"** on the Ka-Ezy page (`tryIt` in `content/products/ka-ezy.yaml`, components in `src/components/product/kaezy/`): the app's Ka-Ezy screens, redrawn in the website's theme.
  - **Your farm**: value chain (the app's list), location, land size and first name. They personalise every tab: the starter questions follow the chosen crop or animal, and answers and plans use the name, place and acres. Sample answers are templates: `{name}`, `{crop}`, `{location}` and `{acres}` are filled in, and a `[[ ]]` part is dropped when a detail is missing.
  - **Tabs**, in this order: Farm Expert (chat, and a photo check), Garden Mapping (Ka-Ezy's GPS guide and a practice field where tapping the corners gives the acreage), Farm Plan (the app's plan form and a costed plan from setup to harvest; sample per-acre costs, yields and prices for maize and beans in `tryIt.plan.crops`) and Farm Records (say what happened, save it as a record, see income, expenses and profit).
  - **Photo check** (Farm Expert, like the app's diagnosis mode; copy in `tryIt.diagnosis`): the visitor adds a photo (the phone offers the camera or the gallery) or taps a sample photo. Sample photos (drawings in `public/images/diagnosis/`) get a sample diagnosis: what Ka-Ezy sees and what to do. With sample answers, the visitor's own photo stays in the browser and Ka-Ezy says only the app can check it; with live answers it is sent to the endpoint (below). The photo is read in the browser and kept as a small JPEG copy with the conversation.
  - **Past conversations** share one panel with "Your farm": every conversation can be reopened. Farm details, conversations (with their photos) and records are kept in the visitor's browser only (`localStorage`, key `ezyagric:kaezy-demo:v1`), and "Delete all" removes them. If storage fills up, the visitor's photos are dropped from what is saved first.
  - **Hire Ka-Ezy** below: while the section is shown, it replaces the plain Ka-Ezy price cards (its plan picker uses the same `pricing.tiers`, which carry `months` and `monthlyUgx`; the total is months x monthly price, as in the app).

The website never calls the farmer app's own Ka-Ezy or payment APIs. They are built for the signed-in app and are not safe to expose to a public web page; engineering has the details.

### Try Ka-Ezy: live answers

Set `NEXT_PUBLIC_KAEZY_DEMO_API` (build arg in the Dockerfile) to switch the chat from its sample answers to live Ka-Ezy answers. It should be the same-origin path `/api/kaezy-demo`, which nginx proxies to the backend (template commented out in `nginx/nginx.conf`, with a per-visitor rate limit). Same origin means no CORS and no change to the Content-Security-Policy. A photo check sends one JPEG of a few hundred KB, so the template allows 1 MB per request (`client_max_body_size`); the backend's own upload limit must allow at least that.

The endpoint engineering needs to provide (for example `POST /web/demo-query` on the Ka-Ezy backend):

- **Request:** `multipart/form-data` with `question`, `thread_id` (a UUID the page makes; reuse it to continue the conversation) and `agent_mode` (`chat`; `farm_plan` with the app's plan form as a JSON question; or `diagnosis` for a photo check, with the app's diagnosis form `{"type", "symptoms", "notes"}` as a JSON question and the photo as an `images` file: JPEG, at most 1024px, as the app sends it). Optional, from "Your farm": `farmer_name` (first name only), `farmer_location`, `value_chains` (a JSON array) and `land_size_acres`. Never a phone number or account id.
- **Response:** JSON `{ "response": "<markdown>", "thread_id": "..." }`, like the app's chat, optionally with `ui_attachments` of type `record_proposal`. The page shows proposed records and saves them on the visitor's device only, so the endpoint must never save records, cart items or orders for guests.
- **Server side:** answer as a dedicated demo account (never a real farmer), cap questions per visitor and per day, return `429` (or `402`) when the cap is hit, and accept requests only from the website. The chat shows the app's own "Unable to connect" and "Server is busy" messages on errors, and a "hire Ka-Ezy" message on `429`/`402`.

### Pay: what each build does

| Build | Chat | Pay |
|---|---|---|
| `preview` / `staging` | Live answers if the endpoint is set, else sample answers to the four starter questions | Full flow, simulated: plan, MTN MoMo or Airtel Money number, "approve on your phone", success or failure (a "Demo only" switch picks the ending). Nothing leaves the browser. |
| `production` | Hidden while `tryIt` is `pending`. Once approved: as above | Choose a plan, then "Finish in the EzyAgric App" with the store badges. No payment form. |

Paying on the website needs, from engineering: web sign-in checked on the server (phone + OTP), payment and plan activation that trust only that sign-in and the payment callback, rate limits and bot checks, and a plans endpoint (plans live in the app's database today). Then add a live payment service next to the demo in `src/components/product/kaezy/service.ts`.

---

## Hand-off checklist (before launch)

- [ ] **GA4:** create the property and set `NEXT_PUBLIC_GA_ID` in the production build. Check the banner, "Accept", "No thanks" and "Cookie settings", and that events arrive in GA4 DebugView.
- [ ] **Ka-Ezy try and hire:** have the agronomy team check the sample answers and the sample plan figures (costs, yields, prices) in `content/products/ka-ezy.yaml`, and legal add a line to the privacy policy about the demo (farm details stay on the device; with live answers they are sent to Ka-Ezy with each question). Then remove `pending` from `tryIt`. For live answers, set up the guest demo endpoint and `NEXT_PUBLIC_KAEZY_DEMO_API`. Web payment stays "finish in the app" until the items in "Ka-Ezy on the website" exist.
- [ ] **Poultry video captions:** Marvin Busulwa's poultry video in the home page's livestock section is 3 minutes of speech with no captions (WCAG 1.2.2). Get an English transcript or WebVTT file from marketing or the video's editor, then add it as `public/videos/poultry-marvin-busulwa.vtt` with a `<track kind="captions">` in `DemoVideoPlayer` and a captions path in `livestock.video`. Ask for a corrected export at the same time ("POUTRY FARMER" in its caption).
- [ ] **Pending items:** build with `NEXT_PUBLIC_SITE_ENV=staging`, go through every **To confirm** badge with the EzyAgric team, then confirm or remove each item in `content/`.
- [ ] **EzyAgric Business:** Marketing and Product to approve the names EzyAgric Business, EzySupplier and EzyServices (the brand guide asks for new product names to be approved), Product to confirm the API access point still marked **To confirm** in `content/business.yaml` (white-label was confirmed by the EzyAgric team on 29 Oct 2026), and the team to check that the dashboard figures shown in the module screens (sales, revenue, subscribers) are fine to publish. The chapters' magnified details (`loupe` in `content/business.yaml`) make some of them easy to read: the most purchased volumes (2,218,652 kg in all), a loan's repayments in UGX and Ka-Ezy usage counts; delete a module's `loupe` to withdraw one (its dashed frame goes with it). The chapters also set "Ezy" in Vibrant Green ("EzySupplier"), like the home headline: set `TWO_TONE_NAMES = false` in `src/components/business/chapterLooks.ts` if Marketing prefers one colour.
- [ ] **Legal review:** all EzyCredits / Buy Now, Pay Later wording (the key-facts box and lender line were confirmed by the EzyAgric team on 28 Oct 2026), and the new **"Analytics and embedded videos"** section of the privacy policy. Once approved, add that section to `public/docs/privacy-policy.pdf` and update the "Last updated" date on `/privacy-policy/`.
- [ ] **iPhone launch:** paste the App Store link into `appStore.url` in `content/site.yaml` (the official App Store badge then appears next to Google Play on every page) and update the iPhone lines listed in the comment there.
- [ ] **Play Store listing:** update it in the same week so it names Ka-Ezy, Agrishop, EzyCredits and Produce Market like the site.
- [ ] **Search Console:** the verification tag is in `content/site.yaml` (`seo.googleSiteVerification`). After launch, submit `https://ezyagric.com/sitemap.xml`.
- [ ] **Redirects:** list old URLs that still get traffic or links (Search Console, analytics) and add `301`s in `nginx/nginx.conf`.
- [ ] **Share previews:** paste a home and a product URL into WhatsApp or the Facebook Sharing Debugger and check the image and text.
- [ ] **Smoke test the image:** `docker run -p 8080:80 …`, then check `/`, the four product pages, `/ezyagric-business/`, `/privacy-policy/`, a missing page (404), `/.git/HEAD` (must be 404), `/robots.txt` and `/sitemap.xml`.
- [ ] **Delete `legacy/`** (see below).

---

## Project structure

```
content/                  All website copy (YAML) — edit here
  site.yaml
  products/*.yaml
  business.yaml           EzyAgric Business
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
    ezyagric-business/    EzyAgric Business (+ its share image)
    privacy-policy/
    not-found.tsx         404 page
    sitemap.ts, robots.ts, opengraph-image.tsx
  components/
    home/                 Home page sections
    product/              Product page sections
    business/             EzyAgric Business sections and the four-module glimpse
      kaezy/              "Ask Ka-Ezy, then hire it": Your farm, the four Ka-Ezy tabs, Hire Ka-Ezy
    layout/               Header, footer, logo, preview banner
    ui/                   Buttons, icons, badges, video player, …
    analytics/            GA4 consent banner and "Cookie settings" button
    seo/                  JSON-LD and share-image renderer
  theme/
    themes.css            THE THEMES: every colour, radius, shadow and type value
    themes.ts             List of theme names (content/site.yaml picks one)
    server.ts             Reads themes.css at build time (share images, browser colour)
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
- Design values: components use only the semantic theme tokens (see [Theming](#theming)). Never use a hex value, a Tailwind palette colour (Tailwind's default palette is switched off), a sized `rounded-*` or `shadow-*`, or `font-bold`/`font-semibold` in a component. `review` / `review-soft` are only for the "To confirm" badges.

## The `legacy/` folder

`legacy/` is a copy of the old website (a Wayback Machine snapshot), kept only as a reference while the content was moved over. It is not built, linted or deployed (`.dockerignore` excludes it). **Delete it before launch**; the old site is also kept in git history under the tag `legacy-wayback`.
