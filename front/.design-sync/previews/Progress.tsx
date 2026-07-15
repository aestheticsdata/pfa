import { MoneyAmount, Overline, Progress } from "pfa-next";

export const Default = () => (
  <div className="w-72">
    <div className="flex items-baseline justify-between">
      <span className="text-sm text-ink">Alimentation</span>
      <MoneyAmount value={286.4} className="num text-sm font-medium text-ink" />
    </div>
    <Progress value={72} className="mt-2 h-2" />
    <p className="mt-2 text-2xs tracking-caps text-ink-4">72 % DU PLAFOND · 400,00 €</p>
  </div>
);

export const Values = () => (
  <div className="flex w-72 flex-col gap-3">
    <Overline>Consommation des plafonds</Overline>
    {[
      { label: "Pharmacie", value: 8 },
      { label: "Courses", value: 61 },
      { label: "Loyer", value: 100 },
    ].map((row) => (
      <div key={row.label}>
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-ink-2">{row.label}</span>
          <span className="num text-xs text-ink-3">{row.value} %</span>
        </div>
        <Progress value={row.value} className="mt-1.5 h-2" />
      </div>
    ))}
  </div>
);

export const Empty = () => (
  <div className="w-72">
    <div className="flex items-baseline justify-between">
      <span className="text-sm text-ink-3">Achats exceptionnels</span>
      <MoneyAmount value={0} className="num text-sm text-ink-3" />
    </div>
    <Progress value={0} className="mt-2 h-2" />
    <p className="mt-2 text-2xs tracking-caps text-ink-4">AUCUNE DÉPENSE CE MOIS-CI</p>
  </div>
);

export const Thicknesses = () => (
  <div className="flex w-72 flex-col gap-5">
    <div>
      <p className="mb-1.5 text-2xs tracking-caps text-ink-4">H-2 · HAUTEUR PAR DÉFAUT</p>
      <Progress value={58} />
    </div>
    <div>
      <p className="mb-1.5 text-2xs tracking-caps text-ink-4">H-3</p>
      <Progress value={58} className="h-3" />
    </div>
    <div>
      <p className="mb-1.5 text-2xs tracking-caps text-ink-4">H-4</p>
      <Progress value={58} className="h-4" />
    </div>
  </div>
);
