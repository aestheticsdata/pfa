import { MoneyAmount, StatTile } from "pfa-next";

export const Default = () => <StatTile label="Total du mois" value={<MoneyAmount value={1240.5} />} sub="12 prélèvements" />;

export const Row = () => (
  <div className="grid grid-cols-4 gap-6">
    <StatTile label="Total semaine" value={<MoneyAmount value={286.4} />} sub="+36,40 € vs plafond" />
    <StatTile label="Transactions" value="24" sub="sur 7 jours" />
    <StatTile label="Moyenne / jour" value={<MoneyAmount value={40.91} />} sub="plafond 250,00 €" />
    <StatTile label="Plus grosse" value={<MoneyAmount value={78.2} />} sub="Courses · jeudi" />
  </div>
);

export const WithoutCaption = () => <StatTile label="Transactions" value="24" />;

export const Emphasised = () => (
  <StatTile
    label="Dépassement"
    value={<MoneyAmount value={36.4} />}
    valueClassName="num text-display font-medium leading-none tracking-tight text-neg"
    sub="au-delà du plafond hebdomadaire"
    subClassName="text-xs text-neg"
  />
);
