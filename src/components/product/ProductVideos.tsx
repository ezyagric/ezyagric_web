import { ExternalLink } from "lucide-react";
import { getSite, getVideo, type Accent, type Product, type Video } from "@/lib/content";
import { ACCENTS } from "@/components/ui/accents";
import { Section, SectionHeader } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import type { BandTone } from "./tones";

/** The product's videos that exist in site.yaml (ids without an entry are skipped). */
export function productVideos(product: Product): Video[] {
  return product.videoIds.flatMap((id) => {
    const video = getVideo(id);
    return video ? [video] : [];
  });
}

// The channel card takes the product's accent as a soft tint, with a large
// faint play mark in a corner (the tints and marks of the home page's
// service cards). Full class strings so Tailwind can find them.
const TINTS: Record<Accent, { tint: string; mark: string }> = {
  brand: { tint: "bg-brand-soft", mark: "text-brand/10" },
  accent: { tint: "bg-accent-soft", mark: "text-accent-bright/15" },
  deep: { tint: "bg-brand-soft-strong", mark: "text-inverse/10" },
};

// Side by side, the title sits top left with the channel card under it and
// the videos on the right, spanning both rows: the eyebrow's top is level
// with the videos' top, and the card stretches so its bottom is level with
// theirs, standing as a tile (mark at the top, label at the foot; for one
// video only from md, as at sm the column leaves it too little height). One
// video from sm (half and half); two from lg, where the title takes a third
// and each video about as much width as a home-page video tile (below lg,
// two beside the title would be too small). Three or more stay stacked, in
// a grid. Stacked, the card is one row closing the section.
// As a tile the card also shows a strip of three of our other videos'
// thumbnails (decorative), so it fills its height with a reason to visit the
// channel instead of empty tint.
const LAYOUTS = {
  one: {
    grid: "sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:grid-rows-[auto_1fr] sm:gap-x-6 lg:gap-x-10",
    list: "sm:col-start-2 sm:row-span-2 sm:row-start-1",
    card: "sm:col-start-1 sm:row-start-2 sm:mt-0 md:flex-col md:items-stretch md:justify-between",
    thumbs: "hidden md:grid",
  },
  two: {
    grid: "lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:grid-rows-[auto_1fr] lg:gap-x-10",
    list: "sm:grid-cols-2 lg:col-start-2 lg:row-span-2 lg:row-start-1",
    card: "lg:col-start-1 lg:row-start-2 lg:mt-0 lg:flex-col lg:items-stretch lg:justify-between",
    thumbs: "hidden lg:grid",
  },
  many: { grid: "", list: "sm:grid-cols-2 lg:grid-cols-3", card: "", thumbs: "hidden" },
};

/**
 * How-to videos beside (or above) a card linking to all our videos on
 * YouTube; see LAYOUTS. The title starts at the container's edge, like every
 * other section's, and on phones the videos take the full width. Each video
 * loads YouTube only after the visitor taps play.
 */
export function ProductVideos({ product, tone }: { product: Product; tone: BandTone }) {
  const videos = productVideos(product);
  if (videos.length === 0) return null;
  const { stories, videos: allVideos } = getSite();
  const { channel } = stories;
  const layout = LAYOUTS[videos.length === 1 ? "one" : videos.length === 2 ? "two" : "many"];
  // Three other videos (site order, skipping this page's) for the tile's strip.
  const others = allVideos.filter((v) => !product.videoIds.includes(v.id)).slice(0, 3);

  return (
    <Section id="videos" tone={tone} labelledBy="videos-title">
      <div className={`grid grid-cols-1 ${layout.grid}`}>
        <SectionHeader id="videos-title" eyebrow="Watch" title="See how it works" />
        <ul role="list" className={`grid gap-4 ${layout.list}`}>
          {videos.map((video) => (
            // grid: the player's card fills its cell, so cards in a row end level.
            <li key={video.id} className="grid">
              <VideoPlayer id={video.id} title={video.title} />
            </li>
          ))}
        </ul>
        {channel ? (
          <ChannelCard
            href={channel.url}
            label={channel.label}
            accent={product.accent}
            position={`videos-${product.slug}`}
            thumbs={others.map((v) => v.id)}
            thumbsClassName={layout.thumbs}
            className={`mt-4 ${layout.card}`}
          />
        ) : null}
      </div>
    </Section>
  );
}

/**
 * The YouTube channel (site.yaml, stories.channel) as a card in the
 * product's tint: the YouTube mark in a circle of the product's colour, then
 * the label and the new-tab icon. The label wraps in a narrow column instead
 * of overflowing. As a tile, a strip of video thumbnails sits between them.
 */
function ChannelCard({
  href,
  label,
  accent,
  position,
  thumbs,
  thumbsClassName,
  className,
}: {
  href: string;
  label: string;
  accent: Accent;
  position: string;
  /** YouTube ids of the thumbnails in the strip (their self-hosted posters). */
  thumbs: string[];
  /** When the strip shows (only as a tile). */
  thumbsClassName: string;
  /** Spacing, grid placement and the tile arrangement (LAYOUTS). */
  className: string;
}) {
  const { tint, mark } = TINTS[accent];
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      data-track="youtube_channel_click"
      data-track-position={position}
      className={`group relative isolate flex items-center gap-3 overflow-hidden rounded-card p-3 ring-1 ring-line transition-shadow hover:shadow-raised sm:p-4 ${tint} ${className}`}
    >
      <Icon name="play-circle" className={`absolute -right-6 -bottom-10 -z-10 size-40 -rotate-12 ${mark}`} />
      <span
        aria-hidden="true"
        className={`flex size-12 shrink-0 items-center justify-center rounded-full ${ACCENTS[accent].icon}`}
      >
        <SocialIcon name="YouTube" className="size-6" />
      </span>
      {thumbs.length > 0 ? (
        <span aria-hidden="true" className={`w-full grid-cols-3 gap-2 ${thumbsClassName}`}>
          {thumbs.map((id) => (
            // eslint-disable-next-line @next/next/no-img-element -- pre-optimised thumbnail
            <img
              key={id}
              src={`/images/videos/${id}.webp`}
              alt=""
              width={480}
              height={270}
              loading="lazy"
              decoding="async"
              className="aspect-video w-full rounded-control object-cover shadow-card ring-1 ring-line"
            />
          ))}
        </span>
      ) : null}
      {/* w-full rather than flex-1: as a tile (a column) the label stays at the foot. */}
      <span className="flex w-full min-w-0 items-center gap-3">
        <span className="min-w-0 flex-1 font-heading text-link underline-offset-4 group-hover:underline">
          {label}
          <span className="sr-only"> (opens in a new tab)</span>
        </span>
        <ExternalLink
          aria-hidden="true"
          className="size-5 shrink-0 text-link motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
        />
      </span>
    </a>
  );
}
