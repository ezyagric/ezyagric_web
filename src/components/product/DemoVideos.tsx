import type { Product } from "@/lib/content";
import { Highlight, plainText } from "@/components/home/parts";
import { Section, SectionHeader } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { DemoVideoPlayer } from "./DemoVideoPlayer";
import type { BandTone } from "./tones";

type FeatureVideo = NonNullable<Product["demoVideos"]>["items"][number];

/** The feature videos (16:9). The portrait Ka-Ezy demo plays in the Ka-Ezy banner instead. */
function featureVideos(product: Product): FeatureVideo[] {
  return (product.demoVideos?.items ?? []).filter((video) => video.orientation !== "portrait");
}

/** True when the product has self-hosted feature videos to show (Ka-Ezy). */
export function hasDemoVideos(product: Product): boolean {
  return featureVideos(product).length > 0;
}

// From sm each video sits beside its caption, 18rem (288px) wide: enough for
// its 80px play button to leave most of the picture in view. The lead card
// and the rows share these columns, so their pictures and captions line up
// (except from lg when the lead heads the left column: see DemoVideos).
const BESIDE = "sm:grid sm:grid-cols-[18rem_minmax(0,1fr)] sm:items-center sm:gap-5";

/**
 * Short self-hosted feature videos as a playlist: the first leads on a navy
 * card, the others are numbered rows of one white card. Each plays in place
 * and downloads nothing but its poster until tapped (DemoVideoPlayer). (The
 * phone-shaped Ka-Ezy demo is the centrepiece of the Ka-Ezy banner, so it is
 * not repeated here.)
 *
 * On phones each video stands above its caption; from sm it sits beside it.
 * From lg, with three or more rows, the title and the lead share the left
 * column (five twelfths: room for Ka-Ezy's title on one line from about
 * 1120px; the lead's video as wide as the column, on top of its card) and
 * the rows fill the right: their card's top is level with the eyebrow and
 * its bottom with the lead card's. The rows share any spare height; when
 * they run taller, the lead's caption takes it. With fewer rows the right
 * column would be mostly empty, so everything stays stacked.
 */
export function DemoVideos({ product, tone }: { product: Product; tone: BandTone }) {
  const demo = product.demoVideos;
  const videos = featureVideos(product);
  if (!demo || videos.length === 0) return null;
  const [lead, ...rest] = videos;
  const split = rest.length >= 3;

  return (
    <Section id="demo-videos" tone={tone} labelledBy="demo-videos-title">
      <div
        className={`grid gap-4 ${split ? "lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-x-8 xl:gap-x-10" : ""}`}
      >
        <div className="flex flex-col">
          <SectionHeader
            id="demo-videos-title"
            eyebrow="Watch"
            title={demo.title}
            intro={demo.intro}
            wide
          />
          {/* lg:items-stretch undoes BESIDE's centring: centred in the column,
              the video's box (it has no width of its own) would shrink to nothing. */}
          <figure
            className={`relative isolate flex flex-1 flex-col gap-4 overflow-hidden rounded-card bg-inverse p-4 text-on-inverse shadow-card ${BESIDE} ${
              split ? "lg:flex lg:items-stretch lg:gap-0 lg:p-0" : ""
            }`}
          >
            <Icon
              name="play-circle"
              className="absolute -right-8 -bottom-10 -z-10 size-44 -rotate-12 text-on-inverse/10"
            />
            {/* From lg (split) the video is the card's top edge: the card's corners clip it. */}
            <div className={`overflow-hidden ${split ? "max-lg:rounded-media" : "rounded-media"}`}>
              <DemoVideoPlayer src={lead.src} poster={lead.poster} title={lead.title} />
            </div>
            <figcaption className={split ? "lg:flex-1 lg:p-5 xl:p-6" : ""}>
              <Caption video={lead} n={1} lead large={split} />
            </figcaption>
          </figure>
        </div>

        {rest.length > 0 ? (
          // role="list": Safari drops the list role from unstyled lists.
          <ol
            role="list"
            start={2}
            className="flex flex-col divide-y divide-line overflow-hidden rounded-card bg-card shadow-card ring-1 ring-line"
          >
            {rest.map((video, i) => (
              <li key={video.src} className="flex flex-1">
                <figure className={`flex min-w-0 flex-1 flex-col gap-4 p-4 ${BESIDE}`}>
                  {/* The ring keeps the light posters off the white card. */}
                  <div className="overflow-hidden rounded-media ring-1 ring-line">
                    <DemoVideoPlayer src={video.src} poster={video.poster} title={video.title} />
                  </div>
                  <figcaption>
                    <Caption video={video} n={i + 2} />
                  </figcaption>
                </figure>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </Section>
  );
}

/**
 * The video's number and title, its line and (when given) its length and
 * size. The lead's number is green and its text white on navy; there the
 * copy stays plain (green product names fall below 4.5:1 on navy), while
 * the rows highlight product names as elsewhere.
 */
function Caption({
  video,
  n,
  lead = false,
  large = false,
}: {
  video: FeatureVideo;
  n: number;
  lead?: boolean;
  /** A step larger title, for the lead when it heads the left column (lg). */
  large?: boolean;
}) {
  return (
    <>
      <div className="flex items-center gap-3">
        {/* The number is decoration: the videos are read in order anyway. */}
        <span
          aria-hidden="true"
          className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-heading tabular-nums ${
            lead ? "bg-accent text-on-accent" : "bg-brand-soft text-brand"
          }`}
        >
          {String(n).padStart(2, "0")}
        </span>
        <h3
          className={`min-w-0 text-lg font-heading text-balance ${lead ? "text-on-inverse" : "text-title"} ${
            large ? "lg:text-xl" : ""
          }`}
        >
          {video.title}
        </h3>
      </div>
      <p className={`mt-2 text-base text-pretty ${lead ? "text-on-inverse" : "text-muted"}`}>
        {lead ? plainText(video.text) : <Highlight text={video.text} />}
      </p>
      {video.meta ? (
        <p className={`mt-1 text-sm ${lead ? "text-on-inverse" : "text-muted"}`}>{video.meta}</p>
      ) : null}
    </>
  );
}
