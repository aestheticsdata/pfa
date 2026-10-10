import PfaLogo from "@components/brand/PfaLogo";

import type { AppLogoProps } from "@components/brand/interfaces/brandTypes";

/** Logos the back-office knows; any other app gets its first letter in a rounded square. */
const LOGOS = { pfa: PfaLogo };

const AppLogo = ({ app, size }: AppLogoProps) => {
  const Logo = LOGOS[app.id as keyof typeof LOGOS];
  if (Logo) return <Logo size={size} />;
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-[28%] border border-line bg-panel2 font-mono font-semibold uppercase text-muted"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {app.name[0]}
    </span>
  );
};

export default AppLogo;
