import type { Metadata } from "next";
import { getSite } from "@/lib/content";
import { pageOpenGraph } from "@/lib/metadata";
import { Hero } from "@/components/home/Hero";
import { ProductGrid } from "@/components/home/ProductGrid";
import { Journey } from "@/components/home/Journey";
import { AlsoInApp } from "@/components/home/AlsoInApp";
import { Impact } from "@/components/home/Impact";
import { Poultry } from "@/components/home/Poultry";
import { Stories } from "@/components/home/Stories";
import { Organisations } from "@/components/home/Organisations";
import { Faq } from "@/components/home/Faq";
import { Contact } from "@/components/home/Contact";
import { Partners } from "@/components/home/Partners";
import { KaEzyBanner } from "@/components/promo/KaEzyBanner";

const site = getSite();

// Title and description come from the layout; pageOpenGraph() keeps the
// layout's shared Open Graph fields alongside the page URL.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: pageOpenGraph({
    url: "/",
    title: site.seo.title,
    description: site.seo.description,
  }),
};

export default function HomePage() {
  return (
    <>
      <Hero />
      {/* The Ka-Ezy banner: once, straight after the hero. */}
      <KaEzyBanner id="kaezy-banner" position="home-top" />
      <ProductGrid />
      <Journey />
      <AlsoInApp />
      <Impact />
      <Poultry />
      <Stories />
      <Organisations />
      <Faq />
      <Contact />
      <Partners />
    </>
  );
}
