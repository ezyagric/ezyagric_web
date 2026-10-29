# Backend tickets (BT) for the EzyAgric website

What the website needs from the backend, mobile and DevOps teams. Each
ticket says what the site does today, what to build, how we know it is done,
the security rules, and where it plugs into this repo. The code points back
here by ticket number (search the repo for `BT-01`, `BT-05`, ...).

The website is a static site (Next.js static export served by nginx, see the
README). It has no server code and no database, so everything below lives on
the EzyAgric backend or in nginx. Every browser call goes to the site's own
origin (`/api/...`), which nginx proxies to the backend: no CORS, and no
change to `connect-src 'self'`. The one exception is BT-03's bot check:
Cloudflare Turnstile needs `https://challenges.cloudflare.com` added to
`script-src` and `frame-src` (nothing else), which DevOps does with BT-03.

**Never** expose the farmer app's own Ka-Ezy, subscription or payment APIs to
the website: they trust a signed-in app, not a public page.

| Ticket | What | Owner | Blocks | Status |
|---|---|---|---|---|
| [BT-01](#bt-01-ka-ezy-guest-demo-endpoint) | Ka-Ezy guest demo endpoint (live answers in "Try Ka-Ezy") | Backend (Ka-Ezy) | BT-02 | Open |
| [BT-02](#bt-02-turn-on-the-apikaezy-demo-proxy) | Turn on the `/api/kaezy-demo` proxy and build flag | DevOps | | Open, needs BT-01 |
| [BT-03](#bt-03-web-sign-in-for-farmers-phone-and-otp) | Web sign-in for farmers (phone and OTP) | Backend, DevOps | BT-05 | Open |
| [BT-04](#bt-04-ka-ezy-plans-endpoint) | Ka-Ezy plans endpoint (public, read-only) | Backend | BT-05 | Open |
| [BT-05](#bt-05-web-payment-for-ka-ezy-plans) | Web payment for Ka-Ezy plans (MTN MoMo, Airtel Money) | Backend, then web team | | Open, needs BT-03 and BT-04 |
| [BT-06](#bt-06-ezyagric-business-api-access-for-partners) | EzyAgric Business API access for partners | Backend and Product | | Open |
| [BT-07](#bt-07-keep-the-security-claims-on-the-ezyagric-business-page-true) | Keep the security claims on the EzyAgric Business page true | Engineering | | Open |
| [BT-08](#bt-08-app-link-for-finish-in-the-ezyagric-app) | App link for "Finish in the EzyAgric App" (optional) | Mobile, then web team | | Open |
| [BT-09](#bt-09-redirects-from-old-urls) | 301 redirects from the old site's URLs | DevOps and Marketing | | Open |
| [BT-10](#bt-10-live-count-for-the-home-pages-impact-number-ezycrm) | Live count for the home page's "554,662+" (EzyCRM) (optional) | Backend (EzyCRM), DevOps, Product | | Open |

When a ticket is done, tick its acceptance criteria, change its status here,
and do the website step under "Where it plugs in".

---

## BT-01: Ka-Ezy guest demo endpoint

**Owner:** Backend (Ka-Ezy). **Priority:** high: "Ask Ka-Ezy, then hire it" is
live on the Ka-Ezy page (confirmed by the EzyAgric team, 29 Oct 2026) and
answers only from sample answers until this exists.

**Today.** The chat in "Try Ka-Ezy" (`src/components/product/kaezy/`) answers
its starter questions (four sets of four, chosen by value chain:
`chat.prompts`, `cropPrompts`, `livestockPrompts`, `otherPrompts` in
`content/products/ka-ezy.yaml`) from sample text, and says only the app can
check a visitor's own photo. The live client is already written and waiting:
`liveChatService` in `src/components/product/kaezy/service.ts`.

**Build** a public guest route on the Ka-Ezy backend, for example
`POST https://ezyassistant-api.ezyagric.com/web/demo-query` (the nginx
template in BT-02 already points there).

Request: `multipart/form-data`, the same fields as the app's `POST /ai-query`:

| Field | Required | Value |
|---|---|---|
| `question` | yes | The visitor's text. For `farm_plan`: the JSON string `{"value_chain", "variety", "land_size_acres" (number), "start_date" (YYYY-MM-DD), "priority_services" (array), "available_tools": [], "notes": ""}`. For `diagnosis`: the JSON string `{"type": "crops" \| "birds" \| "animals" \| "", "symptoms": [], "notes": "<the visitor's text>"}` (`type` is empty for fish, bees and mushrooms, or when no value chain is chosen). |
| `thread_id` | yes | A UUID made by the page; the same id continues the conversation. |
| `agent_mode` | yes | `chat`, `farm_plan` or `diagnosis`. |
| `images` | for `diagnosis` | One JPEG, at most 1024px on its longest side (a few hundred KB), named `photo.jpg`. |
| `farmer_name` | no | First name only. |
| `farmer_location` | no | Free text (district or village). |
| `value_chains` | no | JSON array with one value chain from the app's list, e.g. `["Maize"]`. |
| `land_size_acres` | no | e.g. `2.5`. |

The page never sends a phone number, account id, cookie or token
(`credentials: "omit"`).

Response (200): JSON, the same shape as the app's chat:

```json
{
  "response": "<Markdown answer>",
  "thread_id": "<uuid>",
  "ui_attachments": {
    "type": "record_proposal",
    "records": [{ "record_type": "expense", "category": "Inputs", "description": "2 bags of DAP", "amount": 340000, "date": "2026-10-29" }]
  }
}
```

`ui_attachments` is optional; `response` may also be `{ "response": "..." }`.
In `records`, `record_type` is `income`, `expense` or `activity` (the page
drops others), `amount` is a number in UGX and `date` is YYYY-MM-DD. The page
shows proposed records and keeps them on the visitor's device only. Return
the `thread_id` the page sent: the page switches to whatever comes back.

Errors the page understands:

| Status | Page shows |
|---|---|
| `429` (per-visitor cap) or `402` (total daily cap) | "That's all the questions for this demo. Hire Ka-Ezy to keep asking about your own farm, any time." (`chat.errors.limit`) |
| any other non-2xx, an empty answer, or no answer within 120 s | the app's "Server is busy" |
| network failure | the app's "Unable to connect" |

**Acceptance criteria**
- [ ] Answers as a dedicated demo identity, never a real farmer's account. The app's per-account usage limit does not apply to that identity: return `429` when a per-visitor cap is hit and `402` only when the total daily cap is hit.
- [ ] Saves nothing for guests, enforced in code, not in the prompt: the guest route runs Ka-Ezy with every tool switched off that writes, orders, sends messages, fetches URLs or reads account data, so "ignore your instructions and place an order" can do nothing. No records, cart items, orders, subscriptions or farmer profiles.
- [ ] The only guest state is the conversation history per `thread_id` (to continue a conversation), kept under the demo identity, never linked to a real account, and deleted after a fixed time (for example 24 hours).
- [ ] Visitors cannot see each other: the demo identity has no memory or profile across threads, and a `thread_id` is looked up only among guest threads, so a guest can never continue an app farmer's thread or see another visitor's name, place or photo.
- [ ] Answers never contain payment instructions, phone or Mobile Money numbers to pay, or links outside ezyagric.com (the page turns any https link into a clickable link). The guest system prompt holds no secrets or internal URLs.
- [ ] Accepts requests only from the website's nginx proxy (BT-02), which proves itself with a secret header it adds (`X-EzyAgric-Web-Proxy`, rotated and kept out of git). Everything else gets `403`: a direct `curl` to the route without the header gets `403`.
- [ ] Caps questions per visitor IP per hour and per day, and in total per day. The visitor IP is the `X-Real-IP` header nginx sets (BT-02), never the first `X-Forwarded-For` entry, which a visitor can forge. Per-IP caps are high enough for carrier-grade NAT (many MTN and Airtel phones share one public IP); the total daily cap is the real cost control. Caps turns per thread (for example 20), since every turn re-sends the thread's history.
- [ ] Accepts a 1 MB request (one photo); rejects larger with `413`.
- [ ] Answers within 90 s, including `farm_plan`: the page gives up 120 s after it starts sending (upload included), and nginx's `proxy_read_timeout` is also 120 s.
- [ ] Logs no more than needed to run and limit the service: no full IPs after the rate-limit window, no photos in logs. In this ticket, state how many days guest questions, photos and farm details are kept (and delete them on that schedule), whether they are used to train or tune models, and every outside service they go to (for example the AI model provider, and the country where it processes data), so Legal can write the privacy-policy line before launch (README "Hand-off checklist").
- [ ] Tested from the page on staging: one starter question from each of the four sets, a free question, a photo check (`diagnosis`), a Farm Plan (`farm_plan`), a Farm Records entry such as "Sold 5 bags of maize for 600,000" (`chat`, which must return a `record_proposal`), a `429` and a `402`.

**Security.** Treat every field as untrusted text. Cap `question` (for
example 2,000 characters), `farmer_name` (40) and `farmer_location` (100), and
accept `agent_mode` and `value_chains` only from their lists. Accept at most
one `images` file, and only one that decodes as a JPEG of at most 1024 x 1024
pixels; decode and re-encode it (which also strips EXIF), and reject anything
else with `400` or `413`. There is no identity, so no session, but a
`multipart/form-data` POST is a "simple" request that other websites can make
their visitors' browsers send: nginx rejects a foreign `Origin` (BT-02).

**Where it plugs in.** Nothing to change in the code: once BT-02 is done the
page switches from sample to live answers on its own.

---

## BT-02: Turn on the `/api/kaezy-demo` proxy

**Owner:** DevOps. **Needs:** BT-01.

**Build**
1. In `nginx/nginx.conf`, uncomment the `limit_req_zone` line at the top and
   the `location = /api/kaezy-demo` block. Put the upstream URL in a variable
   with a `resolver` (`set $kaezy_demo https://ezyassistant-api.ezyagric.com/web/demo-query; proxy_pass $kaezy_demo;`),
   so nginx starts even when DNS fails and follows changes to the backend's
   IPs. Add `~^/api/ "";` as the first line of the `$ezy_cache_control` map:
   nginx then adds no `Cache-Control` of its own to `/api/` responses (today
   they would get the map's `public, max-age=3600`), and each backend's own
   header is the only one: `no-store` for BT-01, BT-03 and BT-05, a few
   minutes for BT-04.
2. Behind a load balancer, set `real_ip_header` and `set_real_ip_from` to the
   balancer's own addresses only (never `0.0.0.0/0`; add
   `real_ip_recursive on;` if there is more than one proxy in front), so the
   per-visitor limit sees the visitor's IP. In the proxy block, replace
   `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;` with
   `proxy_set_header X-Forwarded-For $remote_addr;` and
   `proxy_set_header X-Real-IP $remote_addr;`
   (`$proxy_add_x_forwarded_for` keeps any `X-Forwarded-For` the visitor
   sent, so a fake one could dodge BT-01's per-IP caps).
3. In the proxy block, also add:
   - `proxy_ssl_verify on;` and
     `proxy_ssl_trusted_certificate /etc/ssl/certs/ca-certificates.crt;`
     (nginx does not check the backend's certificate by default).
   - BT-01's secret header, `proxy_set_header X-EzyAgric-Web-Proxy ${KAEZY_DEMO_KEY};`,
     filled in at container start from an environment variable through the
     nginx image's `/etc/nginx/templates/` (envsubst). It is never written
     into the repo or the image: the Dockerfile copies the config to
     `/etc/nginx/templates/default.conf.template` instead of `conf.d/`.
   - `proxy_set_header Cookie "";`, `proxy_set_header Authorization "";` and
     `proxy_hide_header Set-Cookie;`, so a BT-03 session never reaches the
     Ka-Ezy backend.
   - A `map` on `$http_origin` that returns `403` when a browser `Origin` is
     present and is not this site's own origin, so other websites cannot use
     their visitors' browsers to spend the demo's quota.
4. Build the staging image, then the production image, with
   `--build-arg NEXT_PUBLIC_KAEZY_DEMO_API=/api/kaezy-demo` (README,
   "Environment variables"). It is read at build time, so each environment
   needs its own build.

**Acceptance criteria**
- [ ] `POST /api/kaezy-demo` on the website reaches BT-01. The limit is 6 a minute with a burst of 3: five questions sent at once from one IP get four answers and one `429`.
- [ ] A 2 MB upload gets `413` from nginx.
- [ ] nginx verifies the backend's certificate: pointed at a host with a bad certificate, `/api/kaezy-demo` returns `502`.
- [ ] A request with `Origin: https://example.com` gets `403`; the secret header is not in the repo or the image.
- [ ] "Try Ka-Ezy" on `/ka-ezy/` gives live answers on staging, then production.
- [ ] The security headers (CSP and others) are unchanged on every page.

---

## BT-03: Web sign-in for farmers (phone and OTP)

**Owner:** Backend, with DevOps for nginx. **Blocks:** BT-05.

**Today.** The website has no sign-in. "Partner login" goes to
`https://sso.ezyagric.com` (EzyAgric Business partners), which is a separate
thing and stays as it is.

**Build** a same-origin sign-in for farmers who pay on the website: phone
number, then a one-time code by SMS, giving a session for the existing
EzyAgric App account with that number. It never creates an account. For a
number with no app account, `otp/start` returns the same response as for any
other number and sends an SMS telling the person to get the EzyAgric App and
sign up, instead of a code; `otp/verify` then fails exactly as a wrong code
does.

- `POST /api/web/otp/start` `{ "phone": "2567XXXXXXXX" }` sends a code.
- `POST /api/web/otp/verify` `{ "phone", "code" }` sets the session.
- `GET /api/web/session` returns `{ "signedIn": true, "firstName", "phoneLast3" }` or `{ "signedIn": false }`.
- `POST /api/web/sign-out`.

**Acceptance criteria**
- [ ] The session is an `HttpOnly`, `Secure`, `SameSite=Lax` cookie named with the `__Host-` prefix (`Path=/`, no `Domain`), so it is never sent to the `staging.`, `sso.` or `ezyassistant-api.` subdomains. Sign-in always issues a new random session id. The session lasts 30 minutes, sliding, with an absolute limit (for example 2 hours), and sign-out deletes it on the server. No tokens in `localStorage` or in URLs.
- [ ] The web session can do only what the website needs: read `/api/web/session`, and create and read its own BT-05 payments. It is not an app token and none of the app's APIs accept it, so a code sent by SMS never opens a farmer's records, orders or EzyCredits data.
- [ ] Codes: 6 digits, single use, expire within 5 minutes, at most 5 tries per code.
- [ ] Rate limits: per phone (for example 3 codes an hour, 10 a day) and per IP. Failed codes are also counted per phone across codes (for example 10 a day, then a 24-hour lock), so asking for a new code does not reset the 5-tries rule. A bot check (for example Cloudflare Turnstile) runs before a code is sent.
- [ ] Codes go only to Ugandan mobile numbers (`2567…` on MTN and Airtel ranges); anything else is rejected before the SMS provider is called. A daily cap on all SMS, with an alert, stops SMS-pumping fraud running up the bill.
- [ ] The same answer whether or not a number has an account, so the form cannot be used to find out who is a customer.
- [ ] State-changing requests check the `Origin` header (CSRF). Responses carry `Cache-Control: no-store`.
- [ ] Never returns or logs full phone numbers or codes.
- [ ] Tested on staging with a number that has an account, one that has none, a wrong code and an expired code.

**Where it plugs in.** DevOps adds a `location ^~ /api/web/` proxy block to
`nginx/nginx.conf`, set up as in BT-02 (certificate check, `X-Real-IP`, a
per-IP `limit_req` zone of its own, no `Cache-Control` from the map) but with
`Cookie` and `Set-Cookie` passed through. If the bot check is Turnstile,
DevOps adds `https://challenges.cloudflare.com` to `script-src` and
`frame-src` in the Content-Security-Policy. BT-04 and BT-05 use the same
block. The web team then adds a sign-in step to the hire flow in
`src/components/product/kaezy/HireKaEzy.tsx` (BT-05).

---

## BT-04: Ka-Ezy plans endpoint

**Owner:** Backend. **Blocks:** BT-05.

**Today.** The website's plans (1, 3 and 6 months at UGX 5,000, 4,900 and
4,750 a month, with "2% off" and "5% off" badges) are typed into
`content/products/ka-ezy.yaml` (`pricing.tiers`), copied from marketing's
"Renew & save" and "Go Premium" visuals (Creative & Content Pack, October
2026). They can drift from the app's database.

**Build** `GET /api/web/kaezy-plans` (public, cacheable), returning the plans
the app sells:

```json
[{ "id": "kaezy-1m", "name": "1 month", "months": 1, "monthlyUgx": 5000, "totalUgx": 5000, "badge": null, "highlight": false }]
```

**Acceptance criteria**
- [ ] Returns exactly the plans and prices the app shows, from the same source, with stable `id`s (BT-05 pays by `id`).
- [ ] Carries `badge` (for example "5% off"), which the plan cards show.
- [ ] `Cache-Control` of a few minutes; no personal data.
- [ ] Decision, made by the web team lead before BT-05 starts and recorded here: either `npm run build` fetches it (the Docker build must then reach the endpoint, and the YAML stays the fallback when the fetch fails), or marketing copies it into `pricing.tiers` before each release.

---

## BT-05: Web payment for Ka-Ezy plans

**Owner:** Backend, then the web team. **Needs:** BT-03 and BT-04.

**Today.** On the live site, "Hire Ka-Ezy" ends at "Finish in the EzyAgric
App" with the store badges (`appHandoff` in `content/products/ka-ezy.yaml`).
Preview and staging builds show a simulated payment (`demoService().pay` in
`src/components/product/kaezy/service.ts`) with the notice "Demo: no request
leaves this page and no money is taken."

**Build** a payment API that trusts only the BT-03 session and the payment
provider's own confirmation:

- `POST /api/web/kaezy-payments` with an `Idempotency-Key` header and
  `{ "planId", "network": "mtn" | "airtel", "payingNumber": "2567XXXXXXXX" }`
  creates a payment intent for the signed-in account and sends the Mobile
  Money prompt. Returns `{ "id", "status" }`.
- `GET /api/web/kaezy-payments/{id}` returns the status: `sending`,
  `instructions_sent`, `successful`, `fulfilled`, `failed` or `expired` (the
  names the page already uses, `PayStatus` in `service.ts`, from the app's
  payment intents).
- The provider's callback (server to server, on the backend, not under the
  website's `/api/`) triggers a check with the provider; once confirmed, the
  backend marks the intent `successful` and adds the plan (`fulfilled`).

**Acceptance criteria**
- [ ] The amount comes from the plan on the server (BT-04), never from the browser.
- [ ] The plan is added only after the backend confirms the payment with the provider itself. MTN MoMo callbacks are not signed, and an IP allow-list alone is not proof: on every callback, call the provider's transaction status API with our own credentials, and check the status, amount, currency (UGX), our reference and the intent's paying number before marking the intent `successful`. Never add a plan because the browser or an unverified callback says so.
- [ ] Idempotent: a double tap, retry or repeated callback never charges or credits twice. A repeated `Idempotency-Key` returns the existing intent; an account has at most one open intent at a time (a new request returns the open one); the provider reference (MTN `X-Reference-Id`, Airtel transaction id) is reused on retries; fulfilment runs once per intent (a unique constraint on the intent id).
- [ ] Intents expire (for example after 5 minutes without approval) and report `expired`, but `expired` is not final until the provider confirms the request failed or timed out: a success confirmed after expiry still adds the plan (or is refunded). A reconciliation job re-queries every intent left in `instructions_sent` or `successful`, so no farmer is charged without getting the plan.
- [ ] Only the signed-in owner can read an intent. Responses carry `Cache-Control: no-store`.
- [ ] Rate limits per account, per IP and per paying number (for example 3 prompts an hour to one number across all accounts), and at most 2 different paying numbers per account a day, so one account cannot spam Mobile Money prompts to strangers. Paying numbers are checked against the chosen network's Ugandan prefixes (MTN 76-78, Airtel 70, 74, 75). The prompt names EzyAgric, the plan and the amount. Paying numbers are masked in logs (last 3 digits only). The bot check is the one at sign-in (BT-03).
- [ ] A web purchase is a one-off prepaid plan with no automatic renewal, so "You can cancel anytime" on the Ka-Ezy page holds. Product states what cancelling means for unused months before launch.
- [ ] Tested end to end on staging with the MTN MoMo and Airtel Money sandbox test numbers: approved, declined, timed out, approved after the intent expired, and the same callback delivered twice (one credit only).

**Where it plugs in (web team, after the backend is live).**
1. Add a live payment service beside `demoService` in
   `src/components/product/kaezy/service.ts`, implementing `pay()` with the
   endpoints above (poll the status every 2-3 seconds until it ends). Change
   `PaymentRequest` to `{ planId, network, payingNumber }` and send an
   `Idempotency-Key` made once per tap of Pay. Never send `amountUgx` or
   `accountNumber`: the server prices the plan and the account is the BT-03
   session. Give each plan its BT-04 `id` in `pricing.tiers` and in
   `HirePlan`.
2. Replace `payMode={SHOW_PENDING ? "demo" : "app"}` in
   `src/components/product/kaezy/TryKaEzy.tsx` with a build flag (for example
   `NEXT_PUBLIC_KAEZY_PAY` = `demo`, `app` or `live`, added to the Dockerfile
   and to README "Environment variables"), so staging can run the live flow
   against the sandboxes before production does. Add `"live"` to `PayMode`
   in `HireKaEzy.tsx`, choose the service by `payMode` there (it always builds
   `demoService` today), and add the BT-03 sign-in step before payment. In
   the live flow, remove the "I use this number in the EzyAgric App" checkbox
   and the "EzyAgric App number" field.
3. Show the demo notice and the "Demo only: what happens next?" switch only
   when `payMode` is `"demo"`. Today only the notice checks `payMode`; the
   switch sits in the pay step without a check and stays off the live site
   only because that step is demo-only.
4. Update `appHandoff` and the README ("Pay: what each build does").

---

## BT-06: EzyAgric Business API access for partners

**Owner:** Backend and Product.

**Today.** The EzyAgric Business page (`content/business.yaml`, "Two ways to
connect") tells enterprises they can "Connect your ERP or financial
management system and other systems" and get "Secure access with API keys
over HTTPS", set up "with our team, under a data-sharing agreement"
(confirmed by the EzyAgric team, 29 Oct 2026), and that EzyAgric Business
"sends them the data they need". The page shows no endpoints or formats.

**Build or confirm**
- [ ] API keys per partner organisation, sent over HTTPS only (plain HTTP is refused, not redirected). Keys never appear in URLs or logs. Each key is stored only as a hash, shown once and handed over through a secure channel (never by email or WhatsApp). Sandbox and production keys are separate. Two keys can be live at once, so a rotation causes no downtime. A key is revoked within the hour when the partner asks, a leak is suspected or the data-sharing agreement ends.
- [ ] Each key is scoped to that partner's modules (EzySupplier, EzyProduce, EzyCredits, EzyServices) and data. Every request checks that each record it reads or changes belongs to the key's organisation, so changing an id never reaches another partner's farmers. EzyCredits credit-scoring data is returned only for customers whose consent is recorded, as the page promises.
- [ ] Every API call is logged per key (who, what, when) and rate-limited. Logs never hold the key itself or the response data.
- [ ] If EzyAgric Business pushes data to a partner's system, pushes go only to the partner's registered HTTPS address, are signed (for example HMAC with a per-partner secret and a timestamp) so the partner can check they came from us, and carry only the fields the data-sharing agreement lists.
- [ ] Partner-facing API documentation the team can share during set-up.
- [ ] A data-sharing agreement template (Legal) that the page's promise relies on.

**Where it plugs in.** Nothing on the website unless the claims change; if
any of the above is not true, tell the web team so `content/business.yaml` can
be corrected.

---

## BT-07: Keep the security claims on the EzyAgric Business page true

**Owner:** Engineering (with Legal and Product). The page says these as fact
(in the "Two promises" band; the approver point is in the EzyProduce chapter,
`modules` in `content/business.yaml`, and Product still has to confirm it), so
they must stay true:

- [ ] Each person sees only what their role allows; the partner invites the team and chooses what each role can see.
- [ ] API connections use API keys over HTTPS (see BT-06).
- [ ] In EzyCredits, customers' data for credit scoring is shared with their consent.
- [ ] In EzyProduce, an authorised approver signs off purchase orders, credit sales and journals, and each approval is recorded under their name.

And these, which the EzyAgric team confirmed for the live site on 29 Oct
2026 (Engineering and Legal to check they hold, and tell the web team if not):

- [ ] "Your data is encrypted in transit and at rest", for all four modules, the web portal and the APIs.
- [ ] "Cloud-hosted: your team works in a web browser", with no servers or hardware needed on the client's side (never name the hosting provider).
- [ ] "Our team maintains and updates the platform", for every EzyAgric Business client.
- [ ] Legal: "We handle personal data in line with Uganda's Data Protection and Privacy Act, 2019" (never "compliant", "certified" or "registered").

**Where it plugs in.** If any line stops being true, tell the web team so the
line in `content/business.yaml` can be reworded or removed (or marked
`pending: true` again, which hides it on the live site).

---

## BT-08: App link for "Finish in the EzyAgric App"

**Owner:** Mobile, then the web team. **Optional:** the site works without it.

**Today.** After choosing a plan on the website, the visitor is told to open
Ka-Ezy in the app and tap "View Ka-Ezy Plans", next to the store badges
(Play Store links carry a referrer: README, "Analytics and privacy").

**Build** an Android App Link (and later an iOS Universal Link), for example
`https://ezyagric.com/app/kaezy-plans/?plan=kaezy-3m`, that opens the app on
the Ka-Ezy plans screen with that plan selected, and falls back to the Play
Store when the app is not installed.

**Acceptance criteria**
- [ ] Mobile supplies the package name and the SHA-256 fingerprint of the Play App Signing key. `https://ezyagric.com/.well-known/assetlinks.json` returns them as `application/json` with `200` and no redirect, and `adb shell pm get-app-links <package>` shows the domain as `verified`.
- [ ] The app accepts only known plan ids (BT-04) in `plan`, and otherwise opens the plans screen with nothing selected.

**Where it plugs in.** The web team adds `public/.well-known/assetlinks.json`,
a fallback page at `/app/kaezy-plans/` (with a trailing slash, like every page
on the site) that links to the Play Store, and an "Open in the app" button
beside the store badges in `HireKaEzy.tsx`. nginx needs no change: it already
serves `/.well-known/`.

---

## BT-09: Redirects from old URLs

**Owner:** DevOps and Marketing.

**Build.** List the old site's URLs that still get traffic or links (Search
Console, analytics, printed materials) and add `301` redirects to the new
pages in `nginx/nginx.conf`.

**Acceptance criteria**
- [ ] Every old URL with traffic in the last 12 months redirects with `301` to the closest new page.
- [ ] No redirect chains: every target ends in `/` (the site uses `trailingSlash: true`, so `/ka-ezy` itself 301s to `/ka-ezy/`). Checked with `curl -sI` on each old URL: one `301`, then `200`.
- [ ] `/.git/HEAD` and other unknown paths still return `404`.

---

## BT-10: Live count for the home page's impact number (EzyCRM)

**Owner:** Backend (EzyCRM), with DevOps for nginx and Product and Marketing
for the figure. **Optional:** the site works without it.

**Today.** The home page's "Our impact" band shows "554,662+ Farmers and
agribusinesses reached across Uganda", typed into `content/site.yaml`
(`impact.items[0]`): 500,000 plus EzyCRM's total awareness on 16 Sep 2026
(54,662), updated by hand.

**The website is ready.** `LiveCount` (`src/components/home/LiveCount.tsx`):
built with `NEXT_PUBLIC_IMPACT_API=/api/impact`, the page shows the typed
number first, then 500,000 (`impact.items[0].live.base`) plus the count from
this endpoint, on load and every five minutes while the page is open and in
view. No answer within 8 seconds, an error, or a count that is not a whole
number from 1 to 100 million keeps what is shown.

**Decided (the EzyAgric team, 29 Oct 2026).** The figure added to 500,000 is
EzyCRM's total awareness: every farmer who signed up and verified their
phone, whether or not they have bought, borrowed or sold, plus EzyProduce
organisations. So the label says "reached", not "served".

**Still to confirm (Product).** What the 500,000 covers (for example, farmers
reached before EzyCRM), so no one is counted twice. Change `live.base` in
`content/site.yaml` if needed.

**What EzyCRM has today** (from the EzyAgric_CRM work, October 2026):
- The CRM API is the `neo4j_ezycrm` service at `https://crm-api.ezyagric.com`
  (`crmApi` in `lib/data/api_endpoints.dart` of the EzyAgric app repo,
  overridable with `--dart-define`).
- Its endpoints need a signed-in CRM user: a call without one gets `401`. So
  the website can't use them, and a staff sign-in must never be put in nginx.
- `GET /funnel/counts` returns the count per funnel stage (`awareness`,
  `onboarded`, `transacted`, after-sales), with no date filter.
- "Total awareness" is not one API figure: the CRM's Awareness card adds the
  funnel's Awareness stage (farmers who signed up and verified their phone) and
  every EzyProduce organisation, in the CRM app itself
  (`customers_controller.dart:398-399`).

**Build** one public, read-only endpoint on `neo4j_ezycrm` that does that sum
on the server (de-duplicated), for example
`GET https://crm-api.ezyagric.com/public/counts/awareness`, returning:

```json
{ "count": 52345, "asOf": "2026-10-29T08:00:00Z" }
```

`count` is the whole number added to the base; `asOf` is optional (not shown
today).

**Acceptance criteria**
- [ ] Returns the one aggregate number only: no names, phone numbers, IDs or breakdowns.
- [ ] Defined in writing (which records count, de-duplicated by person or business), matching the decision above.
- [ ] Answers from a precomputed or cached figure (refreshed at most every few minutes) within 1 second, with `Cache-Control: public, max-age=300`.
- [ ] Needs no sign-in, by design: it returns this one number and nothing else, so no CRM user's token or password is ever put in nginx, the repo or a browser.
- [ ] Rate-limited per caller. nginx keeps each answer for five minutes (`proxy_cache`), so EzyCRM is asked at most once every five minutes however busy the site is.
- [ ] Tested on staging: after a change in EzyCRM, the home page shows it within about ten minutes (EzyCRM's own refresh, plus up to five minutes in nginx; browsers keep no copy). With EzyCRM down, the page keeps the last count nginx holds, and shows the typed number only when nginx has none (after a restart, or an hour with no requests).
- [ ] The container starts, and every page loads, with crm-api.ezyagric.com unresolvable: `/api/impact` then answers `502` (or the last cached count) and the page keeps its number.

**Where it plugs in.** DevOps uncomments the `proxy_cache_path` line and the
`location = /api/impact` block in `nginx/nginx.conf`, sets its path to the
endpoint built here (the template has `/public/counts/awareness`) and its
`resolver` to the host's DNS (as BT-02 step 1), adds `~^/api/ "";` to the `$ezy_cache_control` map if BT-02 has not
(else nginx would add an hour's `Cache-Control`), and builds with
`--build-arg NEXT_PUBLIC_IMPACT_API=/api/impact`, staging first (check the
config with `nginx -t` in the image first). No website
code changes; if the label changes, edit `impact.items[0].label` in
`content/site.yaml`.
