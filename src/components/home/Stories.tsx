import { ChevronDown, ExternalLink } from "lucide-react";
import { getSite, type Video } from "@/lib/content";
import { Section, SectionHeader } from "@/components/ui/Container";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { ButtonLink, buttonClasses } from "@/components/ui/Button";

// The first row: videos marked `featured` in content/site.yaml, then farmer
// stories. Everything else waits behind "More videos".
const STORY_TOPICS: Video["topic"][] = ["farmers"];

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
 * Featured videos and farmer stories first. Product how-tos and company
 * videos sit in a closed <details>, so phones don't fetch every thumbnail up
 * front. A link to the YouTube channel closes the section.
 */
export function Stories() {
  const { stories, videos } = getSite();
  const featured = [
    ...videos.filter((v) => v.featured),
    ...videos.filter((v) => !v.featured && STORY_TOPICS.includes(v.topic)),
  ];
  const more = videos.filter((v) => !featured.includes(v));

  return (
    <Section id="stories" labelledBy="stories-title">
      {/* Keeps old links to /#testimonials working. */}
      <span id="testimonials" aria-hidden="true" />
      <SectionHeader id="stories-title" title={stories.title} intro={stories.intro} />

      <VideoGrid videos={featured} />

      {more.length > 0 ? (
        <details className="group mt-10">
          {/* Styled as the guide's secondary button: secondary outline on canvas. */}
          <summary className={`${buttonClasses("secondary")} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
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

      {stories.channel ? (
        <div className="mt-8">
          <ButtonLink href={stories.channel.url} variant="secondary" track="youtube_channel_click">
            {stories.channel.label}
            <ExternalLink aria-hidden="true" className="size-4" />
          </ButtonLink>
        </div>
      ) : null}
    </Section>
  );
}
