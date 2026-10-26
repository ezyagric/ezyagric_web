import { ChevronDown } from "lucide-react";
import { getSite, type Video } from "@/lib/content";
import { Section, SectionHeader } from "@/components/ui/Container";
import { VideoPlayer } from "@/components/ui/VideoPlayer";

const FEATURED_TOPICS: Video["topic"][] = ["farmers", "agents"];

function VideoGrid({ videos }: { videos: Video[] }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((video) => (
        <li key={video.id}>
          <VideoPlayer id={video.id} title={video.title} />
        </li>
      ))}
    </ul>
  );
}

/**
 * Farmer and agent stories first. Product how-tos and company videos sit in
 * a closed <details>, so phones don't fetch every thumbnail up front.
 */
export function Stories() {
  const { stories, videos } = getSite();
  const featured = videos.filter((v) => FEATURED_TOPICS.includes(v.topic));
  const more = videos.filter((v) => !FEATURED_TOPICS.includes(v.topic));

  return (
    <Section id="stories" labelledBy="stories-title">
      {/* Keeps old links to /#testimonials working. */}
      <span id="testimonials" aria-hidden="true" />
      <SectionHeader id="stories-title" title={stories.title} intro={stories.intro} />

      <VideoGrid videos={featured} />

      {more.length > 0 ? (
        <details className="group mt-10">
          <summary className="inline-flex min-h-12 cursor-pointer list-none items-center gap-2 rounded-full border-2 border-brand-700 bg-white px-5 font-bold text-brand-700 hover:bg-brand-50 [&::-webkit-details-marker]:hidden">
            More videos ({more.length})
            <ChevronDown
              aria-hidden="true"
              className="size-5 transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="mt-6">
            <VideoGrid videos={more} />
          </div>
        </details>
      ) : null}
    </Section>
  );
}
