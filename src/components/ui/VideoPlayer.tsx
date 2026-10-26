"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { track } from "@/lib/track";

/**
 * Shows a self-hosted thumbnail and only loads YouTube (youtube-nocookie.com)
 * after the visitor taps play. This saves data on mobile and sets no YouTube
 * cookies for people who never watch.
 */
export function VideoPlayer({ id, title }: { id: string; title: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <figure className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-line">
      <div className="relative aspect-video bg-ink">
        {playing ? (
          <iframe
            className="absolute inset-0 size-full"
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setPlaying(true);
              track("video_play", { video_id: id });
            }}
            className="group absolute inset-0 size-full"
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
              <span className="flex size-16 items-center justify-center rounded-full bg-white/95 text-brand-700 shadow-lg">
                <Play aria-hidden="true" className="ml-1 size-7 fill-current" />
              </span>
            </span>
            <span className="sr-only">Play video: {title}</span>
          </button>
        )}
      </div>
      <figcaption className="px-4 py-3 text-sm font-semibold text-ink">{title}</figcaption>
    </figure>
  );
}
