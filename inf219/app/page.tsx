import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-neutral-50">
      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col justify-center px-6 py-16">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
          AffectiveVisSTAR
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl">
          Explore responsible affective engagement in visualization research
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-600">
          Browse and explore the corpus to see trends and opportunities for research in ethical
          affective visualization.
        </p>

        <section
          aria-label="Explore the research collections"
          className="mt-10 grid gap-5 sm:grid-cols-2"
        >
          <Link
            href="/corpus"
            className="group rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <h2 className="text-xl font-semibold text-neutral-900 group-hover:text-blue-800">
              Corpus classification table
            </h2>
            <p className="mt-3 leading-7 text-neutral-600">
              Browse papers and their classifications in the research corpus.
            </p>
            <span className="mt-6 inline-block text-sm font-medium text-blue-700">
              Explore the corpus <span aria-hidden="true">→</span>
            </span>
          </Link>

          <Link
            href="/emotions"
            className="group rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <h2 className="text-xl font-semibold text-neutral-900 group-hover:text-blue-800">
              Emotions by Everything
            </h2>
            <p className="mt-3 leading-7 text-neutral-600">
              Explore the emotion-focused view of the research data.
            </p>
            <span className="mt-6 inline-block text-sm font-medium text-blue-700">
              Explore emotions <span aria-hidden="true">→</span>
            </span>
          </Link>
        </section>
      </div>
    </main>
  );
}