import { Button, CardTitle, GlowCard, MoneyAmount, Overline } from "pfa-next";

export const Default = () => <CardTitle>Dépenses du mois</CardTitle>;

export const InCard = () => (
  <GlowCard className="max-w-md p-5">
    <CardTitle>Alimentation</CardTitle>
    <div className="mt-3 num text-2xl font-medium text-ink">
      <MoneyAmount value={286.4} />
    </div>
    <p className="mt-1 text-2xs text-ink-4">18 % des dépenses · 24 fois</p>
  </GlowCard>
);

export const StackedSubtitle = () => (
  <GlowCard className="max-w-md p-5">
    <div className="flex flex-col gap-1">
      <CardTitle>Abonnement Netflix</CardTitle>
      <span className="text-xs text-ink-4">Prélevé le 5 de chaque mois · depuis mars 2025</span>
    </div>
    <div className="mt-4 num text-xl font-medium text-ink">
      <MoneyAmount value={19.99} />
    </div>
  </GlowCard>
);

export const WithInlineControl = () => (
  <GlowCard className="max-w-md p-5">
    <div className="flex items-baseline justify-between gap-3">
      <div className="flex flex-col gap-1">
        <Overline>Budget</Overline>
        <CardTitle>Courses de la semaine</CardTitle>
      </div>
      <Button variant="ghost" size="sm">
        Modifier
      </Button>
    </div>
    <p className="mt-4 text-xs text-ink-3">Plafond 250,00 € · 24 mai 2026</p>
  </GlowCard>
);
