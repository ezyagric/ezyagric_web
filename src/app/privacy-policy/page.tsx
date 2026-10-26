import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, FileDown } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { buttonClasses } from "@/components/ui/Button";
import { PendingBadge } from "@/components/ui/Pending";
import { CookieSettingsButton } from "@/components/analytics/CookieSettingsButton";
import { GA_ENABLED } from "@/components/analytics/config";
import { pageOpenGraph } from "@/lib/metadata";

// Ported word for word from the old site (legacy/privacy-policy/index.html,
// last updated 13 February 2026). The PDF in public/docs/ is the same text.
// Only "Analytics and embedded videos" at the end is new, and it needs
// legal review before launch.

const TITLE = "Privacy policy | EzyAgric";
const DESCRIPTION =
  "How EzyAgric collects, uses, shares and protects your personal information when you use our website, apps and services.";

// A file-based share image only applies to its own route segment, and this
// page's openGraph replaces the inherited one, so point at the site's share
// image (src/app/opengraph-image.tsx) explicitly.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/privacy-policy/" },
  openGraph: {
    ...pageOpenGraph({ url: "/privacy-policy/", title: TITLE, description: DESCRIPTION }),
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "EzyAgric: Ka-Ezy, Agrishop, EzyCredits and Produce Market in one farming app",
      },
    ],
  },
};

function PolicySection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-8">
      <h2 id={id} className="text-xl font-heading text-heading sm:text-2xl">
        {title}
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-6 marker:text-accent-bright">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-subtle py-8 sm:py-14">
      <Container>
        {/* Card: bg-card, 1px border-line, rounded-card. */}
        <article className="mx-auto max-w-3xl rounded-card border border-line bg-card p-5 text-body sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-x-6">
            <Link prefetch={false}
              href="/"
              className="inline-flex min-h-12 items-center gap-2 font-label text-link hover:underline"
            >
              <ArrowLeft aria-hidden="true" className="size-5" />
              Home
            </Link>
            <a
              href="/docs/privacy-policy.pdf"
              type="application/pdf"
              className="inline-flex min-h-12 items-center gap-2 font-label text-link hover:underline"
            >
              <FileDown aria-hidden="true" className="size-5" />
              Download PDF version (110 KB)
            </a>
          </div>

          <h1 className="mt-4 text-3xl font-heading tracking-heading text-heading sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-muted">
            Last updated: <time dateTime="2026-02-13">February 13, 2026</time>
          </p>

          <p className="mt-6">
            EzyAgric (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) values your privacy. This
            Privacy Policy explains how we collect, use, disclose, and protect your personal
            information when you use our website, mobile applications, and related services.
          </p>

          <PolicySection id="information-we-collect" title="1. Information We Collect">
            <p>We may collect the following categories of information:</p>
            <List
              items={[
                "Identification and contact details such as your name, phone number, email address, and location.",
                "Farm and business information, including crop details, farm records, and transaction history.",
                "Device and technical information such as IP address, browser type, operating system, and usage logs.",
                "Communication data from customer support interactions, surveys, and feedback.",
              ]}
            />
          </PolicySection>

          <PolicySection id="how-we-use-information" title="2. How We Use Information">
            <p>We use personal information to:</p>
            <List
              items={[
                "Provide, manage, and improve our services.",
                "Process transactions and deliver products and advisory services.",
                "Communicate important updates, service notices, and support responses.",
                "Enhance platform security, prevent fraud, and enforce our terms.",
                "Comply with legal and regulatory obligations.",
              ]}
            />
          </PolicySection>

          <PolicySection id="sharing-of-information" title="3. Sharing of Information">
            <p>
              We may share information with trusted service providers, business partners, and
              affiliates who support service delivery. We may also disclose information where
              required by law, court order, or lawful request.
            </p>
            <p>We do not sell your personal information to third parties.</p>
          </PolicySection>

          <PolicySection id="data-retention" title="4. Data Retention">
            <p>
              We retain personal information for as long as necessary to fulfill the purposes
              described in this policy, comply with legal obligations, resolve disputes, and
              enforce our agreements.
            </p>
          </PolicySection>

          <PolicySection id="data-security" title="5. Data Security">
            <p>
              We use reasonable administrative, technical, and physical safeguards to protect
              your information against unauthorized access, disclosure, alteration, or
              destruction.
            </p>
          </PolicySection>

          <PolicySection id="your-rights-and-choices" title="6. Your Rights and Choices">
            <p>
              Subject to applicable law, you may request access to, correction of, or deletion
              of your personal information. You may also object to or restrict certain
              processing activities.
            </p>
          </PolicySection>

          <PolicySection id="third-party-services" title="7. Third-Party Services">
            <p>
              Our services may contain links to third-party websites or tools. We are not
              responsible for the privacy practices of those third parties.
            </p>
          </PolicySection>

          <PolicySection id="childrens-privacy" title="8. Children's Privacy">
            <p>
              Our services are not intended for children without guardian supervision. We do
              not knowingly collect personal information from children in violation of
              applicable law.
            </p>
          </PolicySection>

          <PolicySection id="updates-to-this-policy" title="9. Updates to This Policy">
            <p>
              We may update this Privacy Policy from time to time. Material updates will be
              posted on this page with a revised effective date.
            </p>
          </PolicySection>

          <PolicySection id="policy-contact" title="10. Contact Us">
            <p>
              For questions about this Privacy Policy or our data practices, contact us at:{" "}
              <a
                href="mailto:info@ezyagric.com"
                data-track="email_click"
                data-track-position="privacy_policy"
                className="font-label text-link underline"
              >
                info@ezyagric.com
              </a>
              .
            </p>
          </PolicySection>

          {/* New for the rebuilt site; not in the PDF yet. */}
          <section
            aria-labelledby="analytics-and-embedded-videos"
            className="mt-10 rounded-card border-2 border-dashed border-line bg-subtle p-5 sm:p-6"
          >
            <h2
              id="analytics-and-embedded-videos"
              className="text-xl font-heading text-heading sm:text-2xl"
            >
              Analytics and embedded videos
              <PendingBadge note="New section — legal to review before launch" />
            </h2>
            <div className="mt-3 space-y-3">
              <p>
                We use Google Analytics 4 to understand how people use this website. It runs
                only if you choose &quot;Accept&quot; on the cookie banner. If you choose
                &quot;No thanks&quot;, Google Analytics is not loaded and no analytics cookies
                are set.
              </p>
              <p>
                You can change your choice at any time with &quot;Cookie settings&quot; in the
                footer of every page.
              </p>
              <p>
                Videos on this website are hosted on YouTube. A video loads from
                youtube-nocookie.com only when you tap play. YouTube then handles that viewing
                under its own privacy policy.
              </p>
              {GA_ENABLED ? (
                <p>
                  <CookieSettingsButton className={buttonClasses("secondary")}>
                    Change cookie settings
                  </CookieSettingsButton>
                </p>
              ) : null}
            </div>
          </section>
        </article>
      </Container>
    </div>
  );
}
