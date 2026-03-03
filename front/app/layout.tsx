import "../styles/globals.css";
import Providers from "@app/providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-grey1">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
