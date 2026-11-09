import type { PaperMetadata } from "@/lib/types";

type PaperDetailPanelProps = {
  authorYear: string;
  metadata: PaperMetadata | undefined;
  onClose: () => void;
};

// Side panel with the details of the one paper clicked in the Corpus table.
export default function PaperDetailPanel({ authorYear, metadata, onClose }: PaperDetailPanelProps) {
  const doi = metadata?.DOI ?? "";
  const doiHref = doi.startsWith("http") ? doi : `https://doi.org/${doi}`;

  return (
    <aside
      className="w-96 shrink-0 overflow-y-auto border-l border-neutral-300 bg-white p-4 text-sm text-neutral-800"
      aria-label="Paper details"
      aria-live="polite"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{authorYear}</h2>
        <button
          type="button"
          className="rounded px-2 text-lg leading-none text-neutral-600 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-blue-600"
          aria-label="Close paper details"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      {!metadata ? (
        <p className="mt-3 text-neutral-500">Metadata not found.</p>
      ) : (
        <article className="mt-3 rounded-md border border-neutral-200 p-2">
          <p>{metadata.Title}</p>

          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            <dt className="font-semibold">Journal</dt>
            <dd>{metadata.Journal || "Unknown"}</dd>
            <dt className="font-semibold">Domain</dt>
            <dd>{metadata.DomainApp || "Unknown"}</dd>
            <dt className="font-semibold">Country</dt>
            <dd>{metadata.Country || "Unknown"}</dd>
          </dl>

          {metadata.Abstract && (
            <>
              <h3 className="mt-3 font-semibold">Abstract</h3>
              <p className="mt-1">{metadata.Abstract}</p>
            </>
          )}

          {doi && (
            <p className="mt-3 text-neutral-500">
              DOI:{" "}
              <a href={doiHref} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                {doi}
              </a>
            </p>
          )}
        </article>
      )}
    </aside>
  );
}
