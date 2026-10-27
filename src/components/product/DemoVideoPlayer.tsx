"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import type { ImageData } from "@/lib/content";
import { track } from "@/lib/track";

/**
 * A self-hosted product video that downloads nothing but its poster until
 * the visitor taps play (the MP4s run from 4 to 28 MB, a lot on mobile data).
 *
 * The poster is a real link to the MP4, so it still plays in the browser's
 * own player with JavaScript off (or before the page has loaded); with
 * JavaScript on, a plain tap swaps in a <video> and plays it in place.
 */
export function DemoVideoPlayer({
  src,
  poster,
  title,
  portrait = false,
  className = "",
}: {
  src: string;
  poster: ImageData;
  title: string;
  /** Phone-shaped (9:16) video instead of 16:9. */
  portrait?: boolean;
  /** Extra classes for the box, e.g. to let it fill a taller frame. */
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className={`relative bg-inverse ${portrait ? "aspect-[9/16]" : "aspect-video"} ${className}`}>
      {playing ? (
        <video
          // Move focus to the player: the link that had focus is gone now.
          // play() as well as autoPlay, for browsers that only honour one.
          ref={(el) => {
            if (!el) return;
            el.focus();
            el.play().catch(() => {});
          }}
          className="absolute inset-0 size-full focus-visible:-outline-offset-4 focus-visible:outline-focus-inverse"
          src={src}
          poster={poster.src}
          controls
          autoPlay
          playsInline
          preload="none"
          aria-label={title}
        />
      ) : (
        <a
          href={src}
          type="video/mp4"
          onClick={(event) => {
            // Let ctrl/cmd/shift/middle clicks open the MP4 as usual.
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
              return;
            }
            event.preventDefault();
            setPlaying(true);
            track("video_play", { video_id: src });
          }}
          className="group absolute inset-0 block size-full focus-visible:-outline-offset-4 focus-visible:outline-transparent"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- pre-optimised poster */}
          <img
            src={poster.src}
            alt={poster.alt}
            width={poster.width}
            height={poster.height}
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
          {/* Guide icon style: white glyph in a solid green circle. On keyboard
              focus the poster darkens and this overlay draws the white focus
              ring over it (about 3.8:1 on the posters' near-white edges). The
              link's own ring would sit under the overlay, so it is transparent
              (still shown in forced-colours mode). */}
          <span className="absolute inset-0 flex items-center justify-center transition-colors group-hover:bg-shade/10 group-focus-visible:bg-shade/50 group-focus-visible:outline-3 group-focus-visible:-outline-offset-4 group-focus-visible:outline-focus-inverse">
            <span className="flex size-16 items-center justify-center rounded-full bg-accent-bright text-on-accent ring-4 ring-on-inverse transition-colors group-hover:bg-accent group-focus-visible:bg-accent sm:size-20">
              <Play aria-hidden="true" className="ml-1 size-7 fill-current sm:size-8" />
            </span>
          </span>
          <span className="sr-only">Play video: {title}</span>
        </a>
      )}
    </div>
  );
}
