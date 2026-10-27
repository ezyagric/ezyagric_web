"use client";

import { useRef, useState, type MouseEvent } from "react";
import { acresText, fill, formatAcres, type Profile, type TryIt } from "./personalise";
import { demo, newId, type Conversation, type MapResult } from "./store";
import { SMALL_PRIMARY, SMALL_SECONDARY, Thread, type ThreadLabels } from "./Thread";

// The practice field: 200 m x 140 m, one SVG unit per metre.
const WIDTH = 200;
const HEIGHT = 140;
const SQUARE_METRES_PER_ACRE = 4046.856;
const MAX_CORNERS = 12;
const SAMPLE: [number, number][] = [
  [32, 28],
  [148, 18],
  [172, 92],
  [96, 122],
  [26, 96],
];

type Point = [number, number];

/**
 * The corners in order around the garden (by angle from their centre), so
 * tapping them in any order still draws and measures one clean shape.
 */
function aroundTheEdge(points: Point[]): Point[] {
  const cx = points.reduce((sum, [x]) => sum + x, 0) / points.length;
  const cy = points.reduce((sum, [, y]) => sum + y, 0) / points.length;
  return [...points].sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx));
}

/** At least 0.01 acre: three taps on one spot or on a line is not a garden. */
const isGarden = (map: MapResult | null): map is MapResult => !!map && Math.round(map.acres * 100) > 0;

function measure(points: Point[]): MapResult {
  let twiceArea = 0;
  let perimeter = 0;
  points.forEach(([x1, y1], i) => {
    const [x2, y2] = points[(i + 1) % points.length];
    twiceArea += x1 * y2 - x2 * y1;
    perimeter += Math.hypot(x2 - x1, y2 - y1);
  });
  const m2 = Math.abs(twiceArea) / 2;
  return { m2: Math.round(m2), acres: m2 / SQUARE_METRES_PER_ACRE, perimeter: Math.round(perimeter) };
}

/**
 * Garden Mapping: Ka-Ezy's guide to mapping a garden by GPS, and a practice
 * field where tapping the corners stands in for walking the boundary. The
 * result can fill the land size in "Your farm" or start a farm plan.
 */
export function MappingPanel({
  copy,
  profile,
  conversation,
  avatar,
  hireHref,
  labels,
  onPlan,
}: {
  copy: TryIt;
  profile: Profile;
  conversation: Conversation | undefined;
  avatar: string;
  hireHref: string;
  labels: ThreadLabels;
  /** Open the Farm Plan tab. */
  onPlan: () => void;
}) {
  const m = copy.mapping;
  const [taps, setPoints] = useState<Point[]>([]);
  const [across, setAcross] = useState("");
  const [down, setDown] = useState("");
  const svgRef = useRef<SVGSVGElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const messages = conversation?.messages ?? [];
  const points = taps.length >= 3 ? aroundTheEdge(taps) : taps;
  const live = points.length >= 3 ? measure(points) : null;

  /** The keyboard way to add a corner: metres across and down from the top-left. */
  function addByDistance() {
    const x = Number(across);
    const y = Number(down);
    if (!Number.isFinite(x) || !Number.isFinite(y) || across === "" || down === "") return;
    if (taps.length >= MAX_CORNERS) return;
    setPoints((list) => [...list, [Math.min(WIDTH, Math.max(0, Math.round(x))), Math.min(HEIGHT, Math.max(0, Math.round(y)))]]);
    setAcross("");
    setDown("");
  }

  function addCorner(event: MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix || taps.length >= MAX_CORNERS) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    const x = Math.min(WIDTH, Math.max(0, Math.round(point.x)));
    const y = Math.min(HEIGHT, Math.max(0, Math.round(point.y)));
    setPoints((list) => [...list, [x, y]]);
  }

  function finish() {
    const map = points.length >= 3 ? measure(points) : null;
    if (!isGarden(map)) return;
    const text = fill(m.result, profile, {
      mapped: acresText(map.acres),
      m2: map.m2.toLocaleString("en-US"),
      perimeter: String(map.perimeter),
    });
    demo.append(
      "mapping",
      [
        { id: newId(), from: "you", text: `Mapped a garden with ${points.length} corners` },
        { id: newId(), from: "map", text, map },
        { id: newId(), from: "kaezy", text: m.nudge },
      ],
      "Garden map",
    );
    setPoints([]);
    // Bring the result into view inside the panel, then move focus to it.
    window.setTimeout(() => {
      const scroller = scrollRef.current;
      const questions = threadRef.current?.querySelectorAll<HTMLElement>("[data-from='you']");
      const last = questions?.[questions.length - 1];
      if (scroller && last) {
        scroller.scrollTop += last.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 12;
      }
      threadRef.current?.focus({ preventScroll: true });
    }, 0);
  }

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
      <div className="px-4 pt-5">
        <p className="text-base text-pretty text-muted">{m.intro}</p>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-base text-body marker:font-heading marker:text-accent">
          {m.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        <p className="mt-5 font-heading text-title">{m.tryTitle}</p>
        <div className="mt-2 overflow-hidden rounded-control border border-line">
          {/* Tapping stands in for walking; the buttons below do the same from the keyboard. */}
          <svg
            ref={svgRef}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="img"
            aria-label={`Practice field, 200 by 140 metres. ${points.length} corners marked.`}
            onClick={addCorner}
            className="block w-full cursor-crosshair touch-manipulation bg-accent-soft"
          >
            {Array.from({ length: WIDTH / 10 - 1 }, (_, i) => (
              <line key={`v${i}`} x1={(i + 1) * 10} y1={0} x2={(i + 1) * 10} y2={HEIGHT} className="stroke-line" strokeWidth={0.4} />
            ))}
            {Array.from({ length: HEIGHT / 10 - 1 }, (_, i) => (
              <line key={`h${i}`} x1={0} y1={(i + 1) * 10} x2={WIDTH} y2={(i + 1) * 10} className="stroke-line" strokeWidth={0.4} />
            ))}
            {points.length >= 2 ? (
              <polygon
                points={points.map((p) => p.join(",")).join(" ")}
                className={`stroke-accent ${points.length >= 3 ? "fill-accent-bright/30" : "fill-none"}`}
                strokeWidth={1.2}
                strokeLinejoin="round"
              />
            ) : null}
            {points.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={2.6} className="fill-brand stroke-card" strokeWidth={0.8} />
            ))}
            {/* Scale: 10 m */}
            <g aria-hidden="true">
              <line x1={WIDTH - 22} y1={HEIGHT - 6} x2={WIDTH - 12} y2={HEIGHT - 6} className="stroke-title" strokeWidth={1} />
              <text x={WIDTH - 17} y={HEIGHT - 9} textAnchor="middle" className="fill-title" fontSize={5}>
                10 m
              </text>
            </g>
          </svg>
        </div>
        <p aria-live="polite" className="mt-2 text-sm font-label text-title">
          {points.length === 0
            ? "Tap where each corner of the garden is."
            : isGarden(live)
              ? `${points.length} corners: ${acresText(live.acres)} so far`
              : points.length >= 3
                ? `${points.length} corners: spread them out around the garden`
                : `${points.length} ${points.length === 1 ? "corner" : "corners"}: add at least 3`}
        </p>
        <details className="mt-2 text-sm">
          <summary className="min-h-11 cursor-pointer content-center font-label text-link">
            Add a corner by distance (keyboard)
          </summary>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <label className="text-sm text-body">
              Metres across (0 to 200)
              <input
                type="number"
                min={0}
                max={WIDTH}
                value={across}
                onChange={(e) => setAcross(e.target.value)}
                className="mt-1 block min-h-11 w-28 rounded-control border-2 border-line bg-canvas px-2 text-base text-title"
              />
            </label>
            <label className="text-sm text-body">
              Metres down (0 to 140)
              <input
                type="number"
                min={0}
                max={HEIGHT}
                value={down}
                onChange={(e) => setDown(e.target.value)}
                className="mt-1 block min-h-11 w-28 rounded-control border-2 border-line bg-canvas px-2 text-base text-title"
              />
            </label>
            <button type="button" onClick={addByDistance} className={SMALL_SECONDARY}>
              Add corner
            </button>
          </div>
        </details>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => setPoints(SAMPLE)} className={SMALL_SECONDARY}>
            {m.sample}
          </button>
          <button
            type="button"
            disabled={points.length === 0}
            onClick={() => setPoints((list) => list.slice(0, -1))}
            className={`${SMALL_SECONDARY} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {m.undo}
          </button>
          <button
            type="button"
            disabled={points.length === 0}
            onClick={() => setPoints([])}
            className={`${SMALL_SECONDARY} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {m.clear}
          </button>
          <button
            type="button"
            disabled={!isGarden(live)}
            onClick={finish}
            data-track="kaezy_try_map"
            className={`${SMALL_PRIMARY} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {m.finish}
          </button>
        </div>
      </div>

      {messages.length > 0 ? (
        <div className="mt-4 flex border-t border-line">
          <Thread
            threadRef={threadRef}
            messages={messages}
            thinking={false}
            avatar={avatar}
            hireHref={hireHref}
            label="Garden maps from Ka-Ezy"
            labels={labels}
            onMapAction={(action, map) => {
              if (isGarden(map)) demo.setProfile({ acres: formatAcres(map.acres) });
              if (action === "plan") {
                // A fresh plan for this garden (the last one stays in Past conversations).
                demo.newConversation("plan");
                onPlan();
              }
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
