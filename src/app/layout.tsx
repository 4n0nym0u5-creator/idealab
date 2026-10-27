import type { Metadata } from "next";
import { IBM_Plex_Mono, Newsreader, Outfit } from "next/font/google";
import { Shell } from "@/components/shell";
import { writeMode } from "@/lib/session";
import "./globals.css";

const sans = Outfit({ subsets: ["latin"], variable: "--font-sans" });
const serif = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-serif" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: { default: "IdeaLab", template: "%s · IdeaLab" },
  description: "Research, score, compare and track a portfolio of small niche software products.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const themeScript = `try{var t=localStorage.getItem("idealab-theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let mode: Awaited<ReturnType<typeof writeMode>> = "locked";
  try {
    mode = await writeMode();
  } catch {
    mode = "locked";
  }
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Shell mode={mode}>{children}</Shell>
      </body>
    </html>
  );
}
