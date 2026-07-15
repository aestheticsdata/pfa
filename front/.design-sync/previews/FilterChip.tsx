import { FilterChip } from "pfa-next";

const SHAPE = "gap-1.5 rounded-full px-3 capitalize";

export const States = () => (
  <div className="flex flex-wrap items-center gap-2">
    <FilterChip active className={SHAPE}>
      Toutes
    </FilterChip>
    <FilterChip active={false} className={SHAPE}>
      Alimentation
    </FilterChip>
    <FilterChip active={false} className={SHAPE}>
      Transport
    </FilterChip>
  </div>
);

export const Accents = () => (
  <div className="flex flex-wrap items-center gap-2">
    <FilterChip active accent="accent" className={SHAPE}>
      Courantes
    </FilterChip>
    <FilterChip active accent="exc" className={SHAPE}>
      Exceptionnels
    </FilterChip>
  </div>
);

/** Category colours come from the backend as hex — the active tint is `${accentColor}1f`, so hex is required. */
const Dot = ({ color }: { color: string }) => (
  <span className="size-2 shrink-0 rounded-xs" style={{ background: color }} />
);

export const CategoryColours = () => (
  <div className="flex flex-wrap items-center gap-2">
    <FilterChip active accentColor="#9fcc95" className={SHAPE}>
      <Dot color="#9fcc95" />
      Alimentation
      <span className="num text-2xs opacity-70">24</span>
    </FilterChip>
    <FilterChip active accentColor="#eba6c6" className={SHAPE}>
      <Dot color="#eba6c6" />
      Subsistance
      <span className="num text-2xs opacity-70">8</span>
    </FilterChip>
    <FilterChip active={false} className={SHAPE}>
      <Dot color="#72cede" />
      Pharmacie
      <span className="num text-2xs text-ink-4">2</span>
    </FilterChip>
  </div>
);
