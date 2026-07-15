import { CardSectionHeader, EmptyState, GlowCard } from "pfa-next";

/** The default `py-6` density, as used under a list that came back empty. */
export const Default = () => <EmptyState>Aucune dépense fixe ce mois.</EmptyState>;

/** The roomier `py-10` variant — for cards whose body would otherwise collapse. */
export const Roomy = () => <EmptyState className="py-10">Aucune dépense ce mois.</EmptyState>;

/** Canonical usage: the placeholder standing in for the rows of a card. */
export const InCard = () => (
  <GlowCard
    as="section"
    className="flex flex-col gap-4 px-6 py-5"
  >
    <CardSectionHeader title="Dépenses fixes" meta="mai 2026" />
    <EmptyState>Aucune dépense fixe ce mois.</EmptyState>
  </GlowCard>
);

/** The "no data yet" wording, used before a month has any history to chart. */
export const NoDataYet = () => (
  <GlowCard
    as="section"
    className="flex flex-col gap-4 px-6 py-5"
  >
    <CardSectionHeader title="Plafond hebdomadaire" meta="4 semaines" />
    <EmptyState className="py-10">Pas encore de données.</EmptyState>
  </GlowCard>
);
