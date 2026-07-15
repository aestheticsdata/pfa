import { MoneyAmount, Overline, ScrollArea, ScrollBar, Separator } from "pfa-next";

// ScrollBar is never mounted on its own — it only renders inside a ScrollArea,
// which already ships a vertical one. `type="always"` keeps it painted in a
// static capture (the Radix default only reveals it on hover/scroll).

const spendings = [
  { label: "Courses", date: "14 mai 2026", amount: 78.2, fixed: false },
  { label: "Uber", date: "13 mai 2026", amount: 16.4, fixed: false },
  { label: "Pharmacie", date: "12 mai 2026", amount: 23.9, fixed: false },
  { label: "Abonnement Netflix", date: "11 mai 2026", amount: 13.49, fixed: true },
  { label: "Boulangerie", date: "11 mai 2026", amount: 8.6, fixed: false },
  { label: "Essence", date: "10 mai 2026", amount: 62.3, fixed: false },
  { label: "Mutuelle", date: "5 mai 2026", amount: 41.35, fixed: true },
  { label: "Loyer", date: "5 mai 2026", amount: 780, fixed: true },
];

/** Monthly drift so the matrix reads like real history — fixed debits stay flat. */
const drift = [0.87, 1.12, 0.94, 1.21, 1, 0.79];
const monthly = (s: (typeof spendings)[number], i: number) =>
  s.fixed ? s.amount : Math.round(s.amount * drift[i] * 100) / 100;

const months = [
  { name: "Janvier", total: 1180.4 },
  { name: "Février", total: 1042.9 },
  { name: "Mars", total: 1310.15 },
  { name: "Avril", total: 998.6 },
  { name: "Mai", total: 1240.5 },
  { name: "Juin", total: 1087.3 },
];

/** The vertical bar ScrollArea mounts by itself — no explicit ScrollBar child needed. */
export const Vertical = () => (
  <ScrollArea type="always" className="h-64 w-full max-w-sm rounded-lg border border-line p-4">
    <Overline className="mb-3 block">Dépenses de mai 2026</Overline>
    <div className="flex flex-col">
      {spendings.map((s) => (
        <div key={s.label}>
          <div className="flex items-center justify-between py-2.5">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm text-ink-2">{s.label}</span>
              <span className="num text-xs text-ink-4">{s.date}</span>
            </div>
            <MoneyAmount value={s.amount} className="num text-sm text-ink" />
          </div>
          <Separator className="bg-line-soft" />
        </div>
      ))}
    </div>
  </ScrollArea>
);

/** `orientation="horizontal"` is the one axis you must add yourself. */
export const Horizontal = () => (
  <ScrollArea type="always" className="w-full max-w-sm whitespace-nowrap rounded-lg border border-line">
    <div className="flex w-max gap-3 p-4">
      {months.map((m) => (
        <div key={m.name} className="flex w-32 shrink-0 flex-col gap-1 rounded-md bg-surface-hi px-3.5 py-3">
          <Overline>{m.name} 2026</Overline>
          <MoneyAmount value={m.total} className="num text-base font-medium text-ink" />
        </div>
      ))}
    </div>
    <ScrollBar orientation="horizontal" />
  </ScrollArea>
);

/** Both axes overflow: the vertical bar, the horizontal bar and the corner all paint. */
export const BothAxes = () => (
  <ScrollArea type="always" className="h-56 w-full max-w-sm rounded-lg border border-line">
    <div className="w-max p-4">
      <Overline className="mb-3 block">Dépenses par mois</Overline>
      <table className="border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th className="px-3 py-2 text-left text-2xs font-medium uppercase tracking-caps text-ink-4">Dépense</th>
            {months.map((m) => (
              <th key={m.name} className="px-3 py-2 text-right text-2xs font-medium uppercase tracking-caps text-ink-4">
                {m.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {spendings.map((s) => (
            <tr key={s.label}>
              <td className="whitespace-nowrap px-3 py-2 text-ink-2">{s.label}</td>
              {months.map((m, i) => (
                <td key={m.name} className="px-3 py-2 text-right">
                  <MoneyAmount value={monthly(s, i)} className="num text-ink" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <ScrollBar orientation="horizontal" />
  </ScrollArea>
);
