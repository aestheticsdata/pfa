import { Button, CardSectionHeader, GlowCard, MeterBar, MoneyAmount, Overline } from "pfa-next";

export const WithMeta = () => (
  <GlowCard className="max-w-md p-5">
    <CardSectionHeader title="Dépenses fixes" meta="12 prélèvements" />
    <div className="mt-4 flex items-baseline justify-between">
      <MoneyAmount value={1240.5} className="num text-2xl font-medium text-ink" />
      <span className="text-xs text-ink-3">soit 14 886,00 € / an</span>
    </div>
    <MeterBar value={72} height={6} className="mt-4" />
  </GlowCard>
);

export const WithAction = () => (
  <GlowCard className="max-w-md p-5">
    <CardSectionHeader
      title="Achats exceptionnels"
      action={
        <Button variant="ghost" size="sm">
          Tout voir
        </Button>
      }
    />
    <ul className="mt-4 space-y-3">
      <li className="flex items-baseline justify-between">
        <span className="text-sm text-ink-2">Réparation voiture</span>
        <MoneyAmount value={780} className="num text-sm text-exc" />
      </li>
      <li className="flex items-baseline justify-between">
        <span className="text-sm text-ink-2">Pharmacie · ordonnance</span>
        <MoneyAmount value={41.35} className="num text-sm text-exc" />
      </li>
    </ul>
  </GlowCard>
);

export const TitleOnly = () => (
  <GlowCard className="max-w-md p-5">
    <CardSectionHeader title="Reste à vivre" />
    <div className="mt-3 num text-display font-medium leading-none tracking-tight text-accent-strong">
      <MoneyAmount value={412.8} />
    </div>
    <p className="mt-3 text-xs text-ink-3">13,76 € par jour jusqu'au 31 mai</p>
  </GlowCard>
);

export const Stacked = () => (
  <div className="flex max-w-md flex-col gap-4">
    <GlowCard className="p-5">
      <CardSectionHeader title="Plafond hebdomadaire" meta="semaine du 18 mai" />
      <div className="mt-4 flex items-baseline justify-between">
        <MoneyAmount value={286.4} className="num text-xl font-medium text-neg" />
        <Overline>36,40 € au-dessus</Overline>
      </div>
    </GlowCard>
    <GlowCard className="p-5">
      <CardSectionHeader
        title="Catégories"
        action={
          <Button variant="outline" size="sm">
            Gérer
          </Button>
        }
      />
      <p className="mt-4 text-xs text-ink-3">Alimentation · Transport · Loyer · Courses</p>
    </GlowCard>
  </div>
);
