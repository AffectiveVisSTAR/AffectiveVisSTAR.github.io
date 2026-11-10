import Image from "next/image";
import Link from "next/link";

type Figure = {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  legend?: { label: string; color: string }[];
};

const teaser: Figure = {
  src: "/images/survey-teaser.webp",
  width: 2400,
  height: 937,
  alt: "Survey overview: each paper in the affective visualization study corpus is analyzed for how it modulates emotion and how that modulation is evaluated. Studies are then situated in the visualization pipeline (collect, transform, map, render) and located in a responsible affective design space spanned by emotional valence and responsible versus irresponsible engagement.",
  caption:
    "Survey overview. For each study we ask how it modulates emotion and how that modulation is evaluated, situate it in the visualization pipeline, and locate it within the responsible affective design space.",
};

const conceptualModels: Figure = {
  src: "/images/conceptual-models-v2.webp",
  width: 2188,
  height: 608,
  alt: "Conceptual diagrams of three of the most common models of emotion used in AffectVis empirical studies. Adapted from Russel J. A., 1980, Scherer K. R., 2005, and Plutchkir R., 1980.",
  caption:
    "Conceptual diagrams of three of the most common models of emotion used in AffectVis empirical studies. Adapted from Russel J. A., 1980, Scherer K. R., 2005, and Plutchkir R., 1980.",
};

const litSearch: Figure = {
  src: "/images/lit-search-approach-v2.webp",
  width: 2400,
  height: 374,
  alt: "Stages of corpus collection including: keyword strategy, title and abstract screening, full reading and snowballing that resulted in 70 papers for classification and analysis.",
  caption:
    "Stages of corpus collection including: keyword strategy, title and abstract screening, full reading and snowballing that resulted in 70 papers for classification and analysis.",
};

const sideBySideFigures: Figure[] = [
  {
    src: "/images/responsible-engagement-framework.webp",
    width: 1221,
    height: 925,
    alt: "2x2 matrix outlining our Responsible Emotional Engagement design space. Along the horizontal axis runs emotional valence, from negative (left) to positive (right). Along the vertical axis is designer intent in engagement, from irresponsible (bottom) to responsible (top). The space maps design strategies according to what emotion(s) are evoked and how they are used.",
    caption:
      "2x2 matrix outlining our Responsible Emotional Engagement design space. Along the horizontal axis runs emotional valence, from negative (left) to positive (right). Along the vertical axis is designer intent in engagement, from irresponsible (bottom) to responsible (top). The space maps design strategies according to what emotion(s) are evoked and how they are used.",
  },
  {
    src: "/images/domainbyyear.webp",
    width: 1802,
    height: 1624,
    alt: "Stacked bar chart of papers published per year from 2009 to 2025, colored by domain. Output is sparse before 2020 and rises sharply, reaching 15 papers in 2024 and 17 in 2025.",
    caption:
      "Number of papers published by primary application domain and year. Half-units represent one study that focused on two domains. Studies that included three or more domains are categorized as Various.",
    // Swatch colors sampled from the chart image.
    legend: [
      { label: "Climate", color: "#8CC466" },
      { label: "Social/Civic", color: "#8ACBF9" },
      { label: "Public Health", color: "#FBD675" },
      { label: "Medicine", color: "#3AAD96" },
      { label: "Journalism", color: "#6E8FDD" },
      { label: "Culture/Humanities", color: "#B87B50" },
      { label: "Industry", color: "#C1677F" },
      { label: "Science Education", color: "#C2A3F6" },
      { label: "Domain Agnostic", color: "#928F9E" },
      { label: "Various", color: "#E18CE4" },
    ],
  },
];

function FigureBlock({
  figure,
  priority = false,
  sizes = "(min-width: 64rem) 47rem, 100vw",
  style,
}: {
  figure: Figure;
  priority?: boolean;
  sizes?: string;
  style?: React.CSSProperties;
}) {
  return (
    <figure className="min-w-0" style={style}>
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
        <Image
          src={figure.src}
          alt={figure.alt}
          width={figure.width}
          height={figure.height}
          priority={priority}
          sizes={sizes}
          className="h-auto w-full"
        />
      </div>
      <figcaption className="mt-2 text-sm leading-6 text-neutral-600">
        {figure.legend && (
          <ul
            aria-label="Legend"
            className="mb-1.5 flex flex-wrap gap-x-2.5 text-xs leading-5"
          >
            {figure.legend.map((item) => (
              <li key={item.label} className="flex items-center gap-1 text-neutral-800">
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </li>
            ))}
          </ul>
        )}
        {figure.caption}
      </figcaption>
    </figure>
  );
}

const authors = [
  "R. Ziman",
  "K. Enge",
  "W. Aigner",
  "N. Mahyar",
  "H. Hauser",
  "L. Garrison",
];

const supplementaryUrl =
  "https://osf.io/zhdfg/overview?view_only=cd134a11373f4f81acf42f861ebb0d23";

const views = [
  {
    href: "/corpus",
    title: "Corpus Classification Table",
    description:
      "Browse all 70 papers and how each was characterized by emotion theory, study design, visual strategy, and findings.",
    cta: "Explore the corpus",
  },
  {
    href: "/emotions",
    title: "Emotions by Everything",
    description:
      "View the corpus organized by the emotions that the surveyed studies targeted.",
    cta: "Explore emotions",
  },
];

export default function Home() {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-neutral-50">
      <div className="mx-auto w-full max-w-6xl px-6 py-8 sm:py-10">
        <header className="max-w-4xl">
          <h1 className="text-3xl font-semibold tracking-tight text-balance text-neutral-950 sm:text-5xl sm:leading-[1.1]">
            Responsible Affective Visualization
          </h1>
          <p className="mt-2 text-xl leading-snug text-balance text-neutral-600 sm:text-2xl">
            A Survey of Methods Towards Responsible Affective Visualization
          </p>
          <p className="mt-4 text-base text-neutral-800">
            {authors.map((author, index) => (
              <span key={author} className="whitespace-nowrap">
                {author}
                {index < authors.length - 2 && ", "}
                {index === authors.length - 2 && ", and "}
              </span>
            ))}
          </p>
        </header>

        {/* Explore links come first in the DOM so they lead on small screens; on large screens they
            sit in the right column and stay pinned while the main column scrolls. */}
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
          <aside
            aria-labelledby="explore-heading"
            className="lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1 lg:self-start"
          >
            <h2
              id="explore-heading"
              className="text-lg font-semibold text-neutral-900"
            >
              Explore the corpus
            </h2>
            <div className="mt-2 flex flex-col gap-3">
              {views.map((view) => (
                <Link
                  key={view.href}
                  href={view.href}
                  className="group rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  <h3 className="text-base font-semibold text-neutral-900 group-hover:text-blue-800">
                    {view.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">
                    {view.description}
                  </p>
                  <span className="mt-3 inline-block text-sm font-medium text-blue-700">
                    {view.cta}
                  </span>
                </Link>
              ))}
            </div>
          </aside>

          <div className="flex min-w-0 flex-col gap-8 lg:col-start-1 lg:row-start-1">
            <FigureBlock figure={teaser} priority />

            <section aria-labelledby="abstract-heading">
              <h2
                id="abstract-heading"
                className="text-lg font-semibold text-neutral-900"
              >
                Abstract
              </h2>
              <div className="mt-2 space-y-3 text-justify text-[1.0625rem] leading-7 hyphens-auto text-neutral-700">
                <p>
                  Visualizations designed to have emotive power can have consequences for
                  audience understanding and decision-making. As data visualizations
                  increasingly employ design strategies to elicit emotions (called{" "}
                  <strong className="font-semibold text-neutral-900">
                    affective visualization, or AffectVis
                  </strong>
                  ), we must consider how these approaches can be used in a{" "}
                  <strong className="font-semibold text-neutral-900">responsible</strong>{" "}
                  way. Recognition of the impact of audience affective, i.e., emotional,
                  engagement in visualization has resulted in a perfusion of studies
                  attempting to better characterize and harness affect for desired
                  outcomes. To-date, no work surveys the empirical design space to
                  synthesize and identify gaps, challenges, and opportunities in how the
                  visualization community fundamentally understands the consequences of
                  affective design.
                </p>
                <p>
                  We surveyed literature across core and adjacent venues for empirical
                  AffectVis research. This resulted in a corpus of 70 papers that we
                  characterize through a lens of responsibility according to theoretical
                  underpinnings of emotion, study design, visual strategies that have been
                  evaluated, and study findings. Through this characterization, we find a
                  broad-ranging conceptual backbone to affective empirical research with
                  little agreement on the meaning or virtues of responsible engagement.
                  Additionally, we find a similarly wide array of design possibilities
                  which are empirically evaluated in scenarios that, often, offer only
                  limited conclusions on the nature of affect for a desired domain and
                  audience. Our survey critically reflects on these and other findings to
                  consider a roadmap for future empirical research towards responsible
                  AffectVis design.
                </p>
              </div>

              <a
                href={supplementaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm transition hover:border-neutral-400 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Supplementary materials on OSF
              </a>
            </section>

            <section aria-labelledby="figures-heading">
              <h2 id="figures-heading" className="text-lg font-semibold text-neutral-900">
                Figures
              </h2>
              <div className="mt-2 space-y-6">
                {/* Narrow figures share a row. Growing each by its aspect ratio, with a basis equal to
                    the card's horizontal padding + border (2 × 24px + 2 × 1px at md+), gives both
                    images exactly the same height. */}
                <div className="flex flex-col gap-6 md:flex-row">
                  {sideBySideFigures.map((figure) => (
                    <FigureBlock
                      key={figure.src}
                      figure={figure}
                      sizes="(min-width: 64rem) 24rem, (min-width: 48rem) 50vw, 100vw"
                      style={{ flex: `${figure.width / figure.height} 1 50px` }}
                    />
                  ))}
                </div>
                <FigureBlock figure={conceptualModels} />
                <FigureBlock figure={litSearch} />
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
