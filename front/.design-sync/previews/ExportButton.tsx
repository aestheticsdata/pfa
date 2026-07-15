import { CardSectionHeader, ExportButton, FilterChip, GlowCard } from "pfa-next";

const CHIP = "gap-1.5 rounded-full px-3 capitalize";

export const Default = () => <ExportButton />;

export const InCardHeader = () => (
  <GlowCard as="section" className="p-5">
    <CardSectionHeader title="Achats exceptionnels" action={<ExportButton />} />
    <p className="mt-3 text-2xs text-ink-4">
      Mai 2026 · <span className="num">8</span> dépenses · <span className="num">780,00 €</span>
    </p>
  </GlowCard>
);

/** The real call site: pushed to the far right of the statistics filter bar. */
export const InFilterBar = () => (
  <section className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface-elev p-3">
    <FilterChip active accentColor="oklch(0.80 0.09 150)" className={CHIP}>
      Alimentation
    </FilterChip>
    <FilterChip active accentColor="oklch(0.80 0.09 350)" className={CHIP}>
      Transport
    </FilterChip>
    <FilterChip active={false} className={CHIP}>
      Loyer
    </FilterChip>
    <ExportButton className="ml-auto" />
  </section>
);
