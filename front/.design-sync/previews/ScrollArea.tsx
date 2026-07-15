import { Badge, CardSectionHeader, GlowCard, MoneyAmount, Overline, ScrollArea, ScrollBar, Separator } from "pfa-next";

const spendings = [
  { label: "Courses", category: "Alimentation", date: "14 mai 2026", amount: 78.2 },
  { label: "Uber", category: "Transport", date: "13 mai 2026", amount: 16.4 },
  { label: "Pharmacie", category: "Santé", date: "12 mai 2026", amount: 23.9 },
  { label: "Abonnement Netflix", category: "Loisirs", date: "11 mai 2026", amount: 13.49 },
  { label: "Boulangerie", category: "Alimentation", date: "11 mai 2026", amount: 8.6 },
  { label: "Essence", category: "Transport", date: "10 mai 2026", amount: 62.3 },
  { label: "Mutuelle", category: "Santé", date: "5 mai 2026", amount: 41.35 },
  { label: "Loyer", category: "Logement", date: "5 mai 2026", amount: 780 },
];

const categories = [
  { name: "Alimentation", total: 412.8 },
  { name: "Transport", total: 186.7 },
  { name: "Logement", total: 780 },
  { name: "Santé", total: 65.25 },
  { name: "Loisirs", total: 94.1 },
  { name: "Courses", total: 231.4 },
];

export const Default = () => (
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

export const Horizontal = () => (
  <ScrollArea type="always" className="w-full max-w-sm whitespace-nowrap rounded-lg border border-line">
    <div className="flex w-max gap-3 p-4">
      {categories.map((c) => (
        <div key={c.name} className="flex w-36 shrink-0 flex-col gap-1 rounded-md bg-surface-hi px-3.5 py-3">
          <Overline>{c.name}</Overline>
          <MoneyAmount value={c.total} className="num text-lg font-medium text-ink" />
        </div>
      ))}
    </div>
    <ScrollBar orientation="horizontal" />
  </ScrollArea>
);

export const InCard = () => (
  <GlowCard as="section" className="w-full max-w-sm p-5">
    <CardSectionHeader title="Dépenses fixes" meta="12 prélèvements" />
    <ScrollArea type="always" className="mt-4 h-56 pr-3">
      <div className="flex flex-col gap-2.5">
        {spendings.map((s) => (
          <div key={s.label} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink-2">{s.label}</span>
              <Badge variant="secondary">{s.category}</Badge>
            </div>
            <MoneyAmount value={s.amount} className="num text-sm text-ink" />
          </div>
        ))}
      </div>
    </ScrollArea>
  </GlowCard>
);
