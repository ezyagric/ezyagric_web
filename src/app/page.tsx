import type { Metadata } from "next";
import { getSite } from "@/lib/content";
import { pageOpenGraph } from "@/lib/metadata";
import { Hero } from "@/components/home/Hero";
import { ProductGrid } from "@/components/home/ProductGrid";
import { Journey } from "@/components/home/Journey";
import { AlsoInApp } from "@/components/home/AlsoInApp";
import { Impact } from "@/components/home/Impact";
import { Stories } from "@/components/home/Stories";
import { Organisations } from "@/components/home/Organisations";
import { Agents } from "@/components/home/Agents";
import { Faq } from "@/components/home/Faq";
import { Contact } from "@/components/home/Contact";
import { Partners } from "@/components/home/Partners";

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
      <ProductGrid />
      <Journey />
      <AlsoInApp />
      <Impact />
      <Stories />
      <Organisations />
      <Agents />
      <Faq />
      <Contact />
      <Partners />
    </>
  );
}
