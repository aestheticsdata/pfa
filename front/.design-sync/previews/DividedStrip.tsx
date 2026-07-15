import { TrendingUp, TriangleAlert, Wallet } from "lucide-react";
import { DividedStrip, MoneyAmount, Overline, StatTile } from "pfa-next";

import type { ReactNode } from "react";

/** Page-level composition used by the dashboard ribbon — each cell owns its opaque `bg-card` fill. */
const Insight = ({
  tone,
  icon,
  label,
  children,
}: {
  tone: string;
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) => (
  <div className="flex items-start gap-3 bg-card px-4.5 py-3.5">
    <span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-md ${tone}`}>{icon}</span>
    <div className="flex flex-col gap-0.5">
      <Overline className="text-ink-3">{label}</Overline>
      <span className="text-sm text-ink-2">{children}</span>
    </div>
  </div>
);

export const Default = () => (
  <DividedStrip className="grid-cols-3">
    <StatTile
      className="bg-card px-5 py-4"
      label="Total du mois"
      value={<MoneyAmount value={1240.5} />}
      sub="12 prélèvements"
    />
    <StatTile
      className="bg-card px-5 py-4"
      label="Reste à vivre"
      value={<MoneyAmount value={780} />}
      sub="d'ici le 31 mai"
    />
    <StatTile
      className="bg-card px-5 py-4"
      label="Transactions"
      value="24"
      sub="sur 7 jours"
    />
  </DividedStrip>
);

export const TwoUp = () => (
  <DividedStrip className="grid-cols-2">
    <StatTile
      className="bg-card px-5 py-4"
      label="Dépenses fixes"
      value={<MoneyAmount value={912.3} />}
      sub="Loyer · Abonnement Netflix · Mutuelle"
    />
    <StatTile
      className="bg-card px-5 py-4"
      label="Achats exceptionnels"
      value={<MoneyAmount value={328.2} />}
      subClassName="text-xs text-exc"
      sub="3 achats en mai 2026"
    />
  </DividedStrip>
);

export const SummaryStrip = () => (
  <DividedStrip className="grid-cols-5">
    <div className="bg-card px-5 py-4">
      <Overline className="mb-2 block">Budget restant</Overline>
      <div className="num text-4xl font-medium leading-none tracking-tight text-ink">
        780<span className="text-lg font-normal text-ink-3">,00 €</span>
      </div>
    </div>
    <StatTile
      className="bg-card px-5 py-4"
      label="Total semaine"
      value={<MoneyAmount value={286.4} decimalClassName="text-lg" />}
      sub={<span className="text-accent-strong">−36 € sous plafond</span>}
    />
    <StatTile
      className="bg-card px-5 py-4"
      label="Transactions"
      value="24"
      sub="sur 7 jours · 3,4/jour"
    />
    <StatTile
      className="bg-card px-5 py-4"
      label="Moyenne / jour"
      value={<MoneyAmount value={40.91} decimalClassName="text-lg" />}
      sub={<span className="text-neg">+12 € vs sem. dernière</span>}
    />
    <StatTile
      className="bg-card px-5 py-4"
      label="Plus grosse"
      value={<MoneyAmount value={78.2} decimalClassName="text-lg" />}
      sub="Courses · 14 mai"
    />
  </DividedStrip>
);

export const Insights = () => (
  <DividedStrip className="grid-cols-3">
    <Insight
      tone="bg-accent-strong/10 text-accent-strong"
      icon={<TrendingUp className="size-3.5" />}
      label="Sur le rythme"
    >
      Tu consommes <b className="font-semibold text-ink">~16% moins vite</b> que ta moyenne 3 mois. À ce rythme, tu
      termines le mois <b className="font-semibold text-ink">sous ton budget</b>.
    </Insight>
    <Insight
      tone="bg-neg/10 text-neg"
      icon={<TriangleAlert className="size-3.5" />}
      label="Catégorie en hausse"
    >
      <b className="font-semibold text-ink">Alimentation</b> à <b className="num font-semibold text-ink">+24%</b> vs le
      mois dernier.
    </Insight>
    <Insight
      tone="bg-surface-hi text-ink-2"
      icon={<Wallet className="size-3.5" />}
      label="Reste à vivre"
    >
      Il te reste <b className="num font-semibold text-ink">46 €</b>/jour à dépenser d&apos;ici le{" "}
      <b className="font-semibold text-ink">31 mai</b> pour rester dans ton budget.
    </Insight>
  </DividedStrip>
);
