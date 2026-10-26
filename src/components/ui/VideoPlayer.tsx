"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { track } from "@/lib/track";

/**
 * Shows a self-hosted thumbnail and only loads YouTube (youtube-nocookie.com)
 * after the visitor taps play. This saves data on mobile and sets no YouTube
 * cookies for people who never watch.
 *
 * The thumbnail is a real link to the video on YouTube, so it still works
 * with JavaScript off (or before the page has loaded); with JavaScript on,
 * a plain tap plays the video in place instead.
 */
export function VideoPlayer({ id, title }: { id: string; title: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    // Brand guide card: white, 1px #E4E8F2 border, 8px radius.
    <figure className="overflow-hidden rounded-lg border border-line bg-white">
      <div className="relative aspect-video bg-ink">
        {playing ? (
          <iframe
            // Move focus to the player: the link that had focus is gone now.
            ref={(el) => el?.focus()}
            className="absolute inset-0 size-full"
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <a
            href={`https://www.youtube.com/watch?v=${id}`}
            target="_blank"
            rel="noopener"
            onClick={(event) => {
              // Let ctrl/cmd/shift/middle clicks open YouTube as usual.
              if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                return;
              }
              event.preventDefault();
              setPlaying(true);
              track("video_play", { video_id: id });
            }}
            // The figure clips anything outside it, so the focus ring is
            // drawn inside the thumbnail (white, to show on the photo).
            className="group absolute inset-0 block size-full focus-visible:-outline-offset-4 focus-visible:outline-white"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- pre-optimised thumbnail */}
            <img
              src={`/images/videos/${id}.webp`}
              alt=""
              width={480}
              height={270}
              loading="lazy"
              className="size-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-ink/20 transition-colors group-hover:bg-ink/35">
              {/* Play in the guide's icon style: white glyph in a solid
                  green circle (a white ring instead of a drop shadow). */}
              <span className="flex size-16 items-center justify-center rounded-full bg-leaf-500 text-white ring-4 ring-white transition-colors group-hover:bg-leaf-700 group-focus-visible:bg-leaf-700">
                <Play aria-hidden="true" className="ml-1 size-7 fill-current" />
              </span>
            </span>
            <span className="sr-only">Play video: {title}</span>
          </a>
        )}
      </div>
      <figcaption className="px-4 py-3 text-sm font-semibold text-ink">{title}</figcaption>
    </figure>
  );
}
