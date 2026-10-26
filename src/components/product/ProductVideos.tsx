import { getVideo, type Product, type Video } from "@/lib/content";
import { Section, SectionHeader } from "@/components/ui/Container";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import type { BandTone } from "./tones";

/** The product's videos that exist in site.yaml (ids without an entry are skipped). */
export function productVideos(product: Product): Video[] {
  return product.videoIds.flatMap((id) => {
    const video = getVideo(id);
    return video ? [video] : [];
  });
}

/** How-to videos. Each loads YouTube only after the visitor taps play. */
export function ProductVideos({ product, tone }: { product: Product; tone: BandTone }) {
  const videos = productVideos(product);
  if (videos.length === 0) return null;

  return (
    <Section id="videos" tone={tone} labelledBy="videos-title">
      <SectionHeader id="videos-title" eyebrow="Watch" title="See how it works" />
      <ul className="grid gap-6 sm:grid-cols-2">
        {videos.map((video) => (
          <li key={video.id}>
            <VideoPlayer id={video.id} title={video.title} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
