import Link from "next/link";

export default function NavigationBar() {
  return (
    <nav
      aria-label="Main navigation"
      className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-6"
    >
      <Link
        href="/"
        className="text-sm font-semibold tracking-tight text-neutral-900"
      >
        AffectiveVisSTAR
      </Link>

      <div className="flex items-center gap-6 text-sm">
        <Link href="/" className="text-neutral-700 transition hover:text-neutral-950">
          Corpus Classification Table
        </Link>
        <Link
          href="/emotions"
          className="text-neutral-700 transition hover:text-neutral-950"
        >
          Emotions by Everything
        </Link>
      </div>
    </nav>
  );
}