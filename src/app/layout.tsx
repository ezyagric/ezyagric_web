import type { Metadata, Viewport } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import { getSite } from "@/lib/content";
import { SITE_ENV, SITE_URL } from "@/lib/env";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PreviewBanner } from "@/components/layout/PreviewBanner";

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
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_UG",
  },
  twitter: { card: "summary_large_image", site: "@ezyagric" },
};

export const viewport: Viewport = {
  themeColor: "#1f6da3",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={nunitoSans.variable}>
      <body className="flex min-h-dvh flex-col">
        <PreviewBanner />
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
