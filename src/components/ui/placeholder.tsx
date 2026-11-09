import { DocumentIcon } from "./icons";

/**
 * Ownership notice for screens whose functional logic is built by another
 * module, or in a later sprint. It is rendered under the screen's real
 * wireframe structure so the screen never looks empty or broken: it names the
 * wireframe ID, what the screen does, the owning module and the sprint.
 *
 * All text is passed in already translated by the page, which keeps this
 * component free of locale logic and usable from any area.
 */
export function Placeholder({
  wireframe,
  description,
  owner,
  sprint,
  tone = "sprint1",
}: {
  /** Already-translated wireframe badge, e.g. "Wireframe H-03". */
  wireframe: string;
  description: string;
  owner: string;
  sprint: string;
  tone?: "sprint1" | "sprint2";
}) {
  return (
    <section
      aria-label={wireframe}
      className="mt-6 rounded-2xl border border-dashed border-ink-300 bg-ink-50/70 px-4 py-4 sm:px-5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="badge badge-neutral">{wireframe}</span>
        <span className={tone === "sprint2" ? "badge badge-pending" : "badge badge-verified"}>
          {sprint}
        </span>
      </div>
      <div className="mt-2 flex items-start gap-2 text-sm leading-6 text-ink-700">
        <DocumentIcon className="mt-1 h-4 w-4 shrink-0 text-ink-400" />
        <div className="min-w-0">
          <p>{description}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-500">{owner}</p>
        </div>
      </div>
    </section>
  );
}
