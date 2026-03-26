"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAVBAR_HEIGHT = 52;

export default function Navbar() {
  const pathname = usePathname();

  const linkStyle = (href: string) => ({
    textDecoration: pathname === href ? "underline" : "none",
  });

  return (
    <nav
      style={{
        zIndex: 1000,
        height: `${NAVBAR_HEIGHT}px`,
        display: "flex",
        gap: "12px",
        alignItems: "center",
        padding: "12px",
        background: "var(--background)",
        borderBottom: "1px solid rgba(127, 127, 127, 0.25)",
      }}
    >
      <b>AffectiveVisSTAR</b>
      <Link href="/" style={linkStyle("/")}>
        Classification Table
      </Link>
      <Link href="/heatmap" style={linkStyle("/heatmap")}>
        Heatmap
      </Link>
      {/* <Link href="/design-space" style={linkStyle("/design-space")}>
        Design Space
      </Link> */}
    </nav>
  );
}

export { NAVBAR_HEIGHT };
