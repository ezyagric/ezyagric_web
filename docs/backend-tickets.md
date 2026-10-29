# Backend tickets (BT) for the EzyAgric website

What the website needs from the backend, mobile and DevOps teams. Each
ticket says what the site does today, what to build, how we know it is done,
the security rules, and where it plugs into this repo. The code points back
here by ticket number (search the repo for `BT-01`, `BT-05`, ...).

The website is a static site (Next.js static export served by nginx, see the
README). It has no server code and no database, so everything below lives on
the EzyAgric backend or in nginx. Every browser call goes to the site's own
origin (`/api/...`), which nginx proxies to the backend: no CORS, and no
change to the Content-Security-Policy (`connect-src 'self'`).

**Never** expose the farmer app's own Ka-Ezy, subscription or payment APIs to
the website: they trust a signed-in app, not a public page.

| Ticket | What | Owner | Blocks | Status |
|---|---|---|---|---|
| [BT-01](#bt-01-ka-ezy-guest-demo-endpoint) | Ka-Ezy guest demo endpoint (live answers in "Try Ka-Ezy") | Backend (Ka-Ezy) | BT-02 | Open |
| [BT-02](#bt-02-turn-on-the-apikaezy-demo-proxy) | Turn on the `/api/kaezy-demo` proxy and build flag | DevOps | | Open, needs BT-01 |
| [BT-03](#bt-03-web-sign-in-for-farmers-phone-and-otp) | Web sign-in for farmers (phone and OTP) | Backend | BT-05 | Open |
| [BT-04](#bt-04-ka-ezy-plans-endpoint) | Ka-Ezy plans endpoint (public, read-only) | Backend | BT-05 | Open |
| [BT-05](#bt-05-web-payment-for-ka-ezy-plans) | Web payment for Ka-Ezy plans (MTN MoMo, Airtel Money) | Backend, then web team | | Open, needs BT-03 and BT-04 |
| [BT-06](#bt-06-ezyagric-business-api-access-for-partners) | EzyAgric Business API access for partners | Backend and Product | | Open |
| [BT-07](#bt-07-confirm-the-security-claims-on-the-ezyagric-business-page) | Confirm the security claims on the EzyAgric Business page | Engineering | | Open |
| [BT-08](#bt-08-app-link-for-finish-in-the-ezyagric-app) | App link for "Finish in the EzyAgric App" (optional) | Mobile | | Open |
| [BT-09](#bt-09-redirects-from-old-urls) | 301 redirects from the old site's URLs | DevOps and Marketing | | Open |

When a ticket is done, tick its acceptance criteria, change its status here,
and do the website step under "Where it plugs in".

---

## BT-01: Ka-Ezy guest demo endpoint

**Owner:** Backend (Ka-Ezy). **Priority:** high: "Ask Ka-Ezy, then hire it" is
live on the Ka-Ezy page (confirmed by the EzyAgric team, 29 Oct 2026) and
answers only from sample answers until this exists.

**Today.** The chat in "Try Ka-Ezy" (`src/components/product/kaezy/`) answers
four starter questions from sample text in `content/products/ka-ezy.yaml`, and
says "only the app can check it" for a visitor's own photo. The live client is
already written and waiting: `liveChatService` in
`src/components/product/kaezy/service.ts`.

**Build** a public guest route on the Ka-Ezy backend, for example
`POST https://ezyassistant-api.ezyagric.com/web/demo-query` (the nginx
template in BT-02 already points there).

Request: `multipart/form-data`, the same fields as the app's `POST /ai-query`:

| Field | Required | Value |
|---|---|---|
| `question` | yes | The visitor's text. For `farm_plan`: the app's plan form as a JSON string. For `diagnosis`: the app's diagnosis form `{"type", "symptoms", "notes"}` as a JSON string. |
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

`ui_attachments` is optional. `response` may also be `{ "response": "..." }`.
The page shows proposed records and keeps them on the visitor's device only.

Errors the page understands:

| Status | Page shows |
|---|---|
| `429` (rate limit) or `402` (usage limit) | "You've used the free questions: hire Ka-Ezy" |
| any other non-2xx, an empty answer, or no answer within 120 s | the app's "Server is busy" |
| network failure | the app's "Unable to connect" |

**Acceptance criteria**
- [ ] Answers as a dedicated demo identity, never a real farmer's account.
- [ ] Saves nothing for guests: no records, cart items, orders, subscriptions or farmer profiles.
- [ ] Caps questions per visitor (IP) per hour and per day, and in total per day; returns `429` when a cap is hit.
- [ ] Accepts requests only from the website (the nginx proxy in BT-02); rejects others.
- [ ] Accepts a 1 MB request (one photo); rejects larger with `413`.
- [ ] Answers within 120 s, or the page gives up.
- [ ] Logs no more than needed to run and limit the service. Questions, photos and farm details are kept only as long as the privacy policy allows (Legal to confirm the wording before launch: README "Hand-off checklist").
- [ ] Tested with all three modes and the four starter questions, a photo check, a `429`, and a `402`.

**Security.** Treat every field as untrusted text. Strip EXIF from photos
before storing or forwarding them. No identity, so no session and no CSRF
surface; abuse is handled by the caps above plus nginx's per-IP limit (BT-02).

**Where it plugs in.** Nothing to change in the code: once BT-02 is done the
page switches from sample to live answers on its own.

---

## BT-02: Turn on the `/api/kaezy-demo` proxy

**Owner:** DevOps. **Needs:** BT-01.

**Build**
1. In `nginx/nginx.conf`, uncomment the `limit_req_zone` line at the top and
   the `location = /api/kaezy-demo` block, and point `proxy_pass` at the
   BT-01 route.
2. Behind a load balancer, set `real_ip_header` and `set_real_ip_from`, so
   the per-visitor limit sees the visitor's IP, not the balancer's.
3. Build the production image with
   `--build-arg NEXT_PUBLIC_KAEZY_DEMO_API=/api/kaezy-demo` (README,
   "Environment variables"). It is read at build time, so each environment
   needs its own build.

**Acceptance criteria**
- [ ] `POST /api/kaezy-demo` on the website reaches BT-01. The limit is 6 a minute with a burst of 3: five questions sent at once from one IP get four answers and one `429`.
- [ ] A 2 MB upload gets `413` from nginx.
- [ ] "Try Ka-Ezy" on `/ka-ezy/` gives live answers on staging, then production.
- [ ] The security headers (CSP and others) are unchanged on every page.

---

## BT-03: Web sign-in for farmers (phone and OTP)

**Owner:** Backend. **Blocks:** BT-05.

**Today.** The website has no sign-in. "Partner login" goes to
`https://sso.ezyagric.com` (EzyAgric Business partners), which is a separate
thing and stays as it is.

**Build** a same-origin sign-in for farmers who pay on the website: phone
number, then a one-time code by SMS, giving a session for the existing
EzyAgric App account with that number (or creating none: paying needs an app
account).

- `POST /api/web/otp/start` `{ "phone": "2567XXXXXXXX" }` sends a code.
- `POST /api/web/otp/verify` `{ "phone", "code" }` sets the session.
- `GET /api/web/session` returns `{ "signedIn": true, "firstName", "phoneLast3" }` or `{ "signedIn": false }`.
- `POST /api/web/sign-out`.

**Acceptance criteria**
- [ ] The session is an `HttpOnly`, `Secure`, `SameSite=Lax` cookie on the website's own domain, short-lived (for example 30 minutes, sliding). No tokens in `localStorage` or in URLs.
- [ ] Codes: 6 digits, single use, expire within 5 minutes, at most 5 tries per code.
- [ ] Rate limits: per phone (for example 3 codes an hour) and per IP; a bot check (for example Cloudflare Turnstile) before sending a code.
- [ ] The same answer whether or not a number has an account, so the form cannot be used to find out who is a customer.
- [ ] State-changing requests check the `Origin` header (CSRF).
- [ ] Never returns or logs full phone numbers or codes.

**Where it plugs in.** The web team adds a sign-in step to the hire flow in
`src/components/product/kaezy/HireKaEzy.tsx` (BT-05).

---

## BT-04: Ka-Ezy plans endpoint

**Owner:** Backend. **Blocks:** BT-05.

**Today.** The website's plans (1, 3 and 6 months at UGX 5,000, 4,900 and
4,750 a month) are typed into `content/products/ka-ezy.yaml` (`pricing.tiers`),
copied from the app. They can drift from the app's database.

**Build** `GET /api/web/kaezy-plans` (public, cacheable), returning the plans
the app sells:

```json
[{ "id": "kaezy-1m", "name": "1 month", "months": 1, "monthlyUgx": 5000, "totalUgx": 5000, "highlight": false }]
```

**Acceptance criteria**
- [ ] Returns exactly the plans and prices the app shows, from the same source.
- [ ] `Cache-Control` of a few minutes; no personal data.
- [ ] The web team either fetches it at build time (and keeps the YAML as the fallback) or the marketing team updates the YAML from it before each release. Decide which in the ticket.

---

## BT-05: Web payment for Ka-Ezy plans

**Owner:** Backend, then the web team. **Needs:** BT-03 and BT-04.

**Today.** On the live site, "Hire Ka-Ezy" ends at "Finish in the EzyAgric
App" with the store badges (`appHandoff` in `content/products/ka-ezy.yaml`).
Preview and staging builds show a simulated payment (`demoService().pay` in
`src/components/product/kaezy/service.ts`) with the notice "Demo: no request
leaves this page and no money is taken."

**Build** a payment API that trusts only the BT-03 session and the payment
provider's callback:

- `POST /api/web/kaezy-payments` `{ "planId", "network": "mtn" | "airtel", "payingNumber" }` creates a payment intent for the signed-in account and sends the Mobile Money prompt. Returns `{ "id", "status" }`.
- `GET /api/web/kaezy-payments/{id}` returns the status: `sending`, `instructions_sent`, `successful`, `fulfilled`, `failed` or `expired` (the names the page already uses, `PayStatus` in `service.ts`, from the app's payment intents).
- The provider's callback (server to server) marks it `successful`, and the backend then adds the plan to the account (`fulfilled`).

**Acceptance criteria**
- [ ] The amount comes from the plan on the server (BT-04), never from the browser.
- [ ] The plan is added only after a verified provider callback (signature or IP allow-list, and amount and reference checked), never because the browser says so.
- [ ] Idempotent: a repeated request or callback never charges or credits twice (idempotency key per intent).
- [ ] Intents expire (for example after 5 minutes without approval) and report `expired`.
- [ ] Only the signed-in owner can read an intent.
- [ ] Rate limits per account and per IP; amounts and paying numbers are validated (Ugandan MTN or Airtel numbers).
- [ ] Tested end to end on staging with real MTN and Airtel sandbox numbers: approved, declined and timed out.

**Where it plugs in (web team, after the backend is live).**
1. Add a live payment service beside `demoService` in
   `src/components/product/kaezy/service.ts`, implementing `pay()` with the
   endpoints above (poll the status every 2-3 seconds until it ends).
2. In `src/components/product/kaezy/TryKaEzy.tsx`, switch `payMode` from
   `"app"` to the live flow for production, and add the BT-03 sign-in step to
   `HireKaEzy.tsx` before payment.
3. Remove the demo notice and the "Demo only" ending switch from production
   builds (they already only show when `payMode` is `"demo"`).
4. Update `appHandoff` and the README ("Pay: what each build does").

---

## BT-06: EzyAgric Business API access for partners

**Owner:** Backend and Product.

**Today.** The EzyAgric Business page (`content/business.yaml`, "Two ways to
connect") tells enterprises they can "Connect your ERP or financial
management system and other systems" and get "Secure access with API keys
over HTTPS", set up "with our team, under a data-sharing agreement" (confirmed
by the EzyAgric team, 29 Oct 2026). The page shows no endpoints or formats.

**Build or confirm**
- [ ] API keys per partner organisation, sent over HTTPS only; partners can have keys rotated and revoked; keys never appear in URLs.
- [ ] Each key is scoped to that partner's modules (EzySupplier, EzyProduce, EzyCredits, EzyServices) and data.
- [ ] Every API call is logged per key (who, what, when) and rate-limited.
- [ ] Partner-facing API documentation the team can share during set-up.
- [ ] A data-sharing agreement template (Legal) that the page's promise relies on.

**Where it plugs in.** Nothing on the website unless the claims change; if
any of the above is not true, tell the web team so `content/business.yaml` can
be corrected.

---

## BT-07: Confirm the security claims on the EzyAgric Business page

**Owner:** Engineering (with Legal and Product). The page's "Two promises"
band says these as fact, so they must stay true:

- [ ] Each person sees only what their role allows; the partner invites the team and chooses what each role can see.
- [ ] API connections use API keys over HTTPS (see BT-06).
- [ ] In EzyCredits, customers' data for credit scoring is shared with their consent.
- [ ] In EzyProduce, an authorised approver signs off purchase orders, credit sales and journals, and each approval is recorded under their name.

And these, which the EzyAgric team confirmed for the live site on 29 Oct
2026 (engineering and Legal to check they hold, and tell the web team if not):

- [ ] "Your data is encrypted in transit and at rest", for all four modules, the web portal and the APIs.
- [ ] "Cloud-hosted: your team works in a web browser", with no servers or hardware needed on the client's side (never name the hosting provider).
- [ ] "Our team maintains and updates the platform", for every EzyAgric Business client.
- [ ] Legal: "We handle personal data in line with Uganda's Data Protection and Privacy Act, 2019" (never "compliant", "certified" or "registered").

**Where it plugs in.** If any line stops being true, tell the web team so the
line in `content/business.yaml` (`promises`) can be reworded or removed (or
marked `pending: true` again, which hides it on the live site).

---

## BT-08: App link for "Finish in the EzyAgric App"

**Owner:** Mobile. **Optional:** the site works without it.

**Today.** After choosing a plan on the website, the visitor is told to open
Ka-Ezy in the app and tap "View Ka-Ezy Plans", next to the store badges
(Play Store links carry a referrer: README, "Analytics and privacy").

**Build** an Android App Link (and later an iOS Universal Link), for example
`https://ezyagric.com/app/kaezy-plans?plan=kaezy-3m`, that opens the app on
the Ka-Ezy plans screen with that plan selected, and falls back to the Play
Store when the app is not installed.

**Where it plugs in.** The web team adds an "Open in the app" button beside the
store badges in `HireKaEzy.tsx`, and nginx serves the fallback page and
`/.well-known/assetlinks.json`.

---

## BT-09: Redirects from old URLs

**Owner:** DevOps and Marketing.

**Build.** List the old site's URLs that still get traffic or links (Search
Console, analytics, printed materials) and add `301` redirects to the new
pages in `nginx/nginx.conf`.

**Acceptance criteria**
- [ ] Every old URL with traffic in the last 12 months redirects with `301` to the closest new page.
- [ ] No redirect chains; `/.git/HEAD` and other unknown paths still return `404`.
