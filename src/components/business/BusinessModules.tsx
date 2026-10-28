import { getBusiness, getBusinessModules } from "@/lib/content";
import { Section, SectionHeader } from "@/components/ui/Container";
import { IconCircle } from "@/components/ui/IconCircle";
import type { BandTone } from "@/components/product/tones";
import { ModuleChapter } from "./ModuleChapter";
import { ModuleIndex } from "./ModuleIndex";

/**
 * The four modules as the record book's chapters (ModuleChapter), under a
 * header with a note on where the screens come from, and the sticky module
 * index from lg (ModuleIndex). overflow-x-clip, never overflow-hidden: a
 * clip is no scroll container, so the index can still stick; it only guards
 * against the screens' spill, which already stays inside the container.
 */
export function BusinessModules({ tone }: { tone: BandTone }) {
  const { modules } = getBusiness();

  return (
    <Section id="modules" tone={tone} labelledBy="modules-title" className="overflow-x-clip">
      <SectionHeader id="modules-title" eyebrow={modules.eyebrow} title={modules.title} intro={modules.intro} wide>
        {modules.screensNote ? (
          <p className="mt-4 flex items-start gap-3">
            <IconCircle name="shield-check" color="brand" size="sm" />
            <span className="min-w-0 pt-2 text-sm font-caption text-pretty text-muted">{modules.screensNote}</span>
          </p>
        ) : null}
      </SectionHeader>
      {/* data-chapters: the scope of the index's scroll timelines (globals.css). */}
      <div data-chapters>
        <ModuleIndex label={modules.indexLabel} />
        <div className="space-y-20 sm:space-y-24 lg:space-y-32">
          {getBusinessModules().map((module, i) => (
            <ModuleChapter key={module.id} module={module} number={i + 1} flip={i % 2 === 1} />
          ))}
        </div>
      </div>
    </Section>
  );
}
