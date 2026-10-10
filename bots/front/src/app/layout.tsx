import "@styles/globals.css";

import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";

import type { Metadata, Viewport } from "next";

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains",
});
const geist = Geist({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "bot-runner · admin",
  robots: { index: false, follow: false },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/bot-runner.svg", type: "image/svg+xml" },
    ],
    apple: "/bot-runner-180.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#171b24",
};

/** The fonts of both theme layers, loaded once; each theme picks its own through `--sans` / `--mono`. */
const RootLayout = ({ children }: LayoutProps<"/">) => (
  <html
    lang="en"
    className={`${jetbrains.variable} ${geist.variable} ${geistMono.variable}`}
  >
    <body className="theme-runner bg-bg text-text">{children}</body>
  </html>
);

export default RootLayout;
