import type { Product } from "@/lib/content";
import { Section, SectionHeader } from "@/components/ui/Container";
import { DemoVideoPlayer } from "./DemoVideoPlayer";
import type { BandTone } from "./tones";

/** True when the product has self-hosted demo videos to show (Ka-Ezy). */
export function hasDemoVideos(product: Product): boolean {
  return (product.demoVideos?.items.length ?? 0) > 0;
}

/**
 * Short self-hosted feature videos, each a card (guide card style) with the
 * player on top and a navy title and line below. Videos download only when
 * tapped; see DemoVideoPlayer.
 */
export function DemoVideos({ product, tone }: { product: Product; tone: BandTone }) {
  const demo = product.demoVideos;
  if (!demo || demo.items.length === 0) return null;

  return (
    <Section id="demo-videos" tone={tone} labelledBy="demo-videos-title">
      <SectionHeader id="demo-videos-title" eyebrow="Watch" title={demo.title} intro={demo.intro} />
      <ul className="grid gap-6 md:grid-cols-2">
        {demo.items.map((video) => (
          <li key={video.src}>
            <figure className="h-full overflow-hidden rounded-lg border border-line bg-white">
              <DemoVideoPlayer src={video.src} poster={video.poster} title={video.title} />
              <figcaption className="p-5">
                <span className="block text-lg font-bold text-ink">{video.title}</span>
                <span className="mt-1 block text-base text-pretty text-muted">{video.text}</span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </Section>
  );
}
