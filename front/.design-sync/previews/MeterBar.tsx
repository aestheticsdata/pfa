import { MeterBar, MoneyAmount, Overline } from "pfa-next";

export const Default = () => (
  <div className="w-72">
    <div className="flex items-baseline justify-between">
      <span className="text-sm text-ink">Alimentation</span>
      <MoneyAmount value={286.4} className="num text-sm font-medium text-ink" />
    </div>
    <MeterBar value={72} height={6} className="mt-2" />
    <p className="mt-2 text-2xs tracking-caps text-ink-4">72 % DU PLAFOND · 400,00 €</p>
  </div>
);

export const FillLevels = () => (
  <div className="flex w-72 flex-col gap-3">
    <Overline>Répartition du mois</Overline>
    {[
      { label: "Loyer", value: 100, amount: 780 },
      { label: "Courses", value: 64, amount: 286.4 },
      { label: "Transport", value: 38, amount: 118.9 },
      { label: "Pharmacie", value: 12, amount: 41.35 },
    ].map((row) => (
      <div key={row.label}>
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-ink-2">{row.label}</span>
          <MoneyAmount value={row.amount} className="num text-xs text-ink-3" />
        </div>
        <MeterBar value={row.value} height={6} className="mt-1.5" />
      </div>
    ))}
  </div>
);

export const OverBudget = () => (
  <div className="w-72">
    <div className="flex items-baseline justify-between">
      <span className="text-sm text-ink">Plafond hebdomadaire</span>
      <MoneyAmount value={286.4} className="num text-sm font-medium text-neg" />
    </div>
    <MeterBar value={100} height={6} fill="var(--neg)" className="mt-2" />
    <p className="mt-2 text-2xs tracking-caps text-neg">DÉPASSÉ DE 36,40 € · PLAFOND 250,00 €</p>
  </div>
);

export const Exceptional = () => (
  <div className="w-72">
    <div className="flex items-baseline justify-between">
      <span className="text-sm text-ink">Achats exceptionnels</span>
      <MoneyAmount value={412.8} className="num text-sm font-medium text-exc" />
    </div>
    <MeterBar value={46} height={6} fill="var(--exc)" className="mt-2" />
    <p className="mt-2 text-2xs tracking-caps text-ink-4">46 % DE L'ENVELOPPE ANNUELLE</p>
  </div>
);

export const Heights = () => (
  <div className="flex w-72 flex-col gap-5">
    <div>
      <p className="mb-1.5 text-2xs tracking-caps text-ink-4">HEIGHT 6 · MÉTRIQUE DE CARTE</p>
      <MeterBar value={58} height={6} />
    </div>
    <div>
      <p className="mb-1.5 text-2xs tracking-caps text-ink-4">HEIGHT 7 · DÉPENSES FIXES</p>
      <MeterBar value={58} height={7} opacity={0.9} />
    </div>
    <div>
      <p className="mb-1.5 text-2xs tracking-caps text-ink-4">HEIGHT 22 · JOUR DE LA SEMAINE</p>
      <MeterBar value={58} height={22} opacity={0.85} />
    </div>
  </div>
);

export const WeekendFill = () => (
  <div className="flex w-72 flex-col gap-2">
    <Overline>Dépenses par jour</Overline>
    {[
      { day: "Jeudi", width: 46, weekend: false },
      { day: "Vendredi", width: 62, weekend: false },
      { day: "Samedi", width: 100, weekend: true },
      { day: "Dimanche", width: 71, weekend: true },
    ].map((row) => (
      <div key={row.day} className="flex items-center gap-3 text-sm">
        <span className={row.weekend ? "w-24 text-ink" : "w-24 text-ink-2"}>{row.day}</span>
        <MeterBar
          value={row.width}
          fill={row.weekend ? "linear-gradient(90deg, oklch(0.50 0.13 25), oklch(0.72 0.16 25))" : "var(--bar-fill)"}
          height={22}
          opacity={0.85}
          className="grow"
        />
      </div>
    ))}
  </div>
);
