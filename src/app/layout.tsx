import type { Metadata, Viewport } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import { getSite } from "@/lib/content";
import { SITE_ENV, SITE_URL } from "@/lib/env";
import { OPEN_GRAPH_BASE } from "@/lib/metadata";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PreviewBanner } from "@/components/layout/PreviewBanner";
import { Analytics } from "@/components/analytics/Analytics";
import { SiteJsonLd } from "@/components/seo/JsonLd";

// Nunito Sans is the farmer app's font. next/font downloads it at build time
// and serves it from this site, so visitors make no request to Google Fonts.
const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito-sans",
  display: "swap",
});

const site = getSite();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: site.seo.title, template: "%s" },
  description: site.seo.description,
  applicationName: site.name,
  verification: { google: site.seo.googleSiteVerification },
  // Only the production build may be indexed.
  robots: SITE_ENV === "production" ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: OPEN_GRAPH_BASE,
  twitter: { card: "summary_large_image", site: "@ezyagric" },
};

export const viewport: Viewport = {
  themeColor: "#1f6da3",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-scroll-behavior lets Next turn smooth scrolling off during page
    // changes (Next 16), so only in-page anchor links scroll smoothly.
    <html lang="en" data-scroll-behavior="smooth" className={nunitoSans.variable}>
      <body className="flex min-h-dvh flex-col">
        <PreviewBanner />
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        {/* Organization + MobileApplication structured data, on every page. */}
        <SiteJsonLd />
        {/* GA4 consent banner; renders nothing unless NEXT_PUBLIC_GA_ID is set. */}
        <Analytics />
      </body>
    </html>
  );
}
