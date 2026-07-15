import { ChartPie, ListFilter, Tags } from "lucide-react";
import { CardSectionHeader, GlowCard, MoneyAmount, StatTile, Tabs, TabsContent, TabsList, TabsTrigger } from "pfa-next";

export const Default = () => (
  <Tabs defaultValue="depenses" className="w-full max-w-md">
    <TabsList>
      <TabsTrigger value="depenses">Dépenses</TabsTrigger>
      <TabsTrigger value="categories">Catégories</TabsTrigger>
      <TabsTrigger value="statistiques">Statistiques</TabsTrigger>
    </TabsList>
    <TabsContent value="depenses" className="pt-3">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-2">Courses</span>
          <MoneyAmount value={78.2} className="num text-ink" />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-2">Pharmacie</span>
          <MoneyAmount value={23.9} className="num text-ink" />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-2">Uber</span>
          <MoneyAmount value={16.4} className="num text-ink" />
        </div>
      </div>
    </TabsContent>
    <TabsContent value="categories" className="pt-3">
      <p className="text-sm text-ink-3">8 catégories actives en mai 2026.</p>
    </TabsContent>
    <TabsContent value="statistiques" className="pt-3">
      <p className="text-sm text-ink-3">Répartition mensuelle des dépenses.</p>
    </TabsContent>
  </Tabs>
);

export const Periods = () => (
  <Tabs defaultValue="mois" className="w-full max-w-md">
    <TabsList>
      <TabsTrigger value="semaine">Semaine</TabsTrigger>
      <TabsTrigger value="mois">Mois</TabsTrigger>
      <TabsTrigger value="annee">Année</TabsTrigger>
    </TabsList>
    <TabsContent value="semaine" className="pt-3">
      <StatTile label="Total semaine" value={<MoneyAmount value={286.4} />} sub="plafond hebdomadaire 250,00 €" />
    </TabsContent>
    <TabsContent value="mois" className="pt-3">
      <StatTile label="Total du mois" value={<MoneyAmount value={1240.5} />} sub="mai 2026 · 24 dépenses" />
    </TabsContent>
    <TabsContent value="annee" className="pt-3">
      <StatTile label="Total de l'année" value={<MoneyAmount value={14320.75} />} sub="2026 · 287 dépenses" />
    </TabsContent>
  </Tabs>
);

export const WithIcons = () => (
  <Tabs defaultValue="repartition" className="w-full max-w-md">
    <TabsList>
      <TabsTrigger value="liste">
        <ListFilter />
        Liste
      </TabsTrigger>
      <TabsTrigger value="repartition">
        <ChartPie />
        Répartition
      </TabsTrigger>
      <TabsTrigger value="categories">
        <Tags />
        Catégories
      </TabsTrigger>
    </TabsList>
    <TabsContent value="repartition" className="pt-3">
      <p className="text-sm text-ink-3">
        <b className="font-semibold text-ink">Alimentation</b> pèse <b className="num font-semibold text-ink">33%</b> de
        tes dépenses de mai 2026.
      </p>
    </TabsContent>
  </Tabs>
);

export const WithDisabledTab = () => (
  <Tabs defaultValue="mois" className="w-full max-w-md">
    <TabsList>
      <TabsTrigger value="mois">Mois</TabsTrigger>
      <TabsTrigger value="annee">Année</TabsTrigger>
      <TabsTrigger value="comparaison" disabled>
        Comparaison
      </TabsTrigger>
    </TabsList>
    <TabsContent value="mois" className="pt-3">
      <p className="text-sm text-ink-3">La comparaison N-1 demande un second mois de données.</p>
    </TabsContent>
  </Tabs>
);

export const InCard = () => (
  <GlowCard as="section" className="w-full max-w-md p-5">
    <CardSectionHeader title="Achats exceptionnels" meta="mai 2026" />
    <Tabs defaultValue="valides" className="mt-4">
      <TabsList>
        <TabsTrigger value="valides">Validés</TabsTrigger>
        <TabsTrigger value="attente">En attente</TabsTrigger>
      </TabsList>
      <TabsContent value="valides" className="pt-3">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-2">Réparation vélo</span>
            <MoneyAmount value={189} className="num text-exc" />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-2">Billet de train</span>
            <MoneyAmount value={139.2} className="num text-exc" />
          </div>
        </div>
      </TabsContent>
      <TabsContent value="attente" className="pt-3">
        <p className="text-sm text-ink-3">Aucun achat en attente de validation.</p>
      </TabsContent>
    </Tabs>
  </GlowCard>
);
