import "@styles/globals.css";
import Providers from "@app/providers";
import { Geist, Geist_Mono, Keania_One } from "next/font/google";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

// Brand wordmark only ("PFA") — scoped to the `font-wordmark` utility, never the body.
const keania = Keania_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-keania",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${keania.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-surface-base text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
