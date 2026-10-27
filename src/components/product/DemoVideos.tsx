import type { Product } from "@/lib/content";
import { Section, SectionHeader } from "@/components/ui/Container";
import { DemoVideoPlayer } from "./DemoVideoPlayer";
import type { BandTone } from "./tones";

/** The feature videos (16:9). The portrait Ka-Ezy demo plays in the Ka-Ezy banner instead. */
function featureVideos(product: Product) {
  return (product.demoVideos?.items ?? []).filter((video) => video.orientation !== "portrait");
}

/** True when the product has self-hosted feature videos to show (Ka-Ezy). */
export function hasDemoVideos(product: Product): boolean {
  return featureVideos(product).length > 0;
}

/**
 * Short self-hosted feature videos, each a card (guide card style) with the
 * player on top and a title and line below. Videos download only when
 * tapped; see DemoVideoPlayer. (The phone-shaped Ka-Ezy demo is the
 * centrepiece of the Ka-Ezy banner, so it is not repeated here.)
 */
export function DemoVideos({ product, tone }: { product: Product; tone: BandTone }) {
  const demo = product.demoVideos;
  const videos = featureVideos(product);
  if (!demo || videos.length === 0) return null;

  return (
    <Section id="demo-videos" tone={tone} labelledBy="demo-videos-title">
      <SectionHeader id="demo-videos-title" eyebrow="Watch" title={demo.title} intro={demo.intro} />
      <ul className="grid gap-6 md:grid-cols-2">
        {videos.map((video) => (
          <li key={video.src}>
            <figure className="h-full overflow-hidden rounded-card border border-line bg-card">
              <DemoVideoPlayer src={video.src} poster={video.poster} title={video.title} />
              <figcaption className="p-5">
                <span className="block text-lg font-heading text-title">{video.title}</span>
                <span className="mt-1 block text-base text-pretty text-muted">{video.text}</span>
                {video.meta ? <span className="mt-2 block text-sm text-muted">{video.meta}</span> : null}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </Section>
  );
}
