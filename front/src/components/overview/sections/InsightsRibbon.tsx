"use client";

// MOCK — the insight framing + thresholds ("~16% slower", the category spike)
// are placeholders that need real trend/business logic. "Reste à vivre" is
// derived from the real remaining budget. See REFACTO_NOTES.md §6.

import type { ReactNode } from "react";
import getDaysInMonth from "date-fns/getDaysInMonth";
import getDate from "date-fns/getDate";
import { TrendingUp, TriangleAlert, Wallet } from "lucide-react";
import useDashboard from "@components/spendings/services/useDashboard";
import { euro0 } from "@components/overview/format";
import { cn } from "@lib/utils";

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
  <div className="flex items-start gap-3 px-5 py-4">
    <span
      className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg", tone)}
    >
      {icon}
    </span>
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">
        {label}
      </span>
      <span className="text-[13px] text-ink-2">{children}</span>
    </div>
  </div>
);

const InsightsRibbon = () => {
  const { remaining } = useDashboard();
  const now = new Date();
  const daysLeft = Math.max(1, getDaysInMonth(now) - getDate(now) + 1);
  const perDay = Math.max(0, Math.round(remaining / daysLeft));

  return (
    <section className="pfa-card grid grid-cols-1 divide-y divide-line-soft sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      <Insight
        tone="bg-accent-strong/10 text-accent-strong"
        icon={<TrendingUp className="size-4" />}
        label="Sur le rythme"
      >
        {/* MOCK */}
        <b className="font-semibold text-ink">~16% plus lent</b> que ta moyenne 3
        mois
      </Insight>
      <Insight
        tone="bg-neg/10 text-neg"
        icon={<TriangleAlert className="size-4" />}
        label="Catégorie en hausse"
      >
        {/* MOCK */}
        <b className="font-semibold text-ink">Alimentation</b> +22% ce mois
      </Insight>
      <Insight
        tone="bg-exc/10 text-exc"
        icon={<Wallet className="size-4" />}
        label="Reste à vivre"
      >
        <b className="font-semibold text-ink">{euro0(perDay)} €/j</b> sur{" "}
        {daysLeft} j restants
      </Insight>
    </section>
  );
};

export default InsightsRibbon;
