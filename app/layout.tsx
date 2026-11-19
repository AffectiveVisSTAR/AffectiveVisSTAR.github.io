import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NavigationBar from "@/components/corpus/NavigationBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AffectiveVisSTAR",
  description:
    "Responsible Affective Visualization: A Survey of Methods Towards Responsible Affective Visualization. Interactive corpus of 70 empirical AffectVis papers.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-screen flex-col">
        <NavigationBar />
        {children}
      </body>
    </html>
  );
}
