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
      <b>Responsible Affective Visualization Survey</b>
      <Link href="/" style={linkStyle("/")}>
        Corpus Classification Table
      </Link>
      <Link href="/emotions-everything-dup" style={linkStyle("/emotions-everything-dup")}>
        Emotions by Everything
      </Link>
    </nav>
  );
}

export { NAVBAR_HEIGHT };
