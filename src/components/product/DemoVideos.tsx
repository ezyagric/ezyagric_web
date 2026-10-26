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
 * player on top and a title and line below. Videos download only when
 * tapped; see DemoVideoPlayer.
 */
export function DemoVideos({ product, tone }: { product: Product; tone: BandTone }) {
  const demo = product.demoVideos;
  if (!demo || demo.items.length === 0) return null;
  const portrait = demo.items.filter((v) => v.orientation === "portrait");
  const landscape = demo.items.filter((v) => v.orientation !== "portrait");

  return (
    <Section id="demo-videos" tone={tone} labelledBy="demo-videos-title">
      <SectionHeader id="demo-videos-title" eyebrow="Watch" title={demo.title} intro={demo.intro} />
      {/* Portrait (phone-shaped) videos come first, as wide cards with a tall
          player beside the text; the 16:9 feature videos follow in a grid. */}
      {portrait.map((video) => (
        <figure
          key={video.src}
          className="mb-6 flex flex-col overflow-hidden rounded-card border border-line bg-card sm:flex-row sm:items-center"
        >
          <div className="mx-auto w-full max-w-[17rem] shrink-0 sm:mx-0 sm:w-64">
            <DemoVideoPlayer src={video.src} poster={video.poster} title={video.title} portrait />
          </div>
          <figcaption className="p-5 sm:p-8">
            <span className="block text-2xl font-heading tracking-heading text-title">{video.title}</span>
            <span className="mt-2 block text-lg text-pretty text-body">{video.text}</span>
            {video.meta ? <span className="mt-3 block text-sm text-muted">{video.meta}</span> : null}
          </figcaption>
        </figure>
      ))}
      <ul className="grid gap-6 md:grid-cols-2">
        {landscape.map((video) => (
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
