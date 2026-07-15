import { Checkbox, GlowCard, Label, MoneyAmount, Overline } from "pfa-next";

const ROW = "flex items-center gap-2.5";
const TEXT = "text-sm text-ink-2";

export const FormRows = () => (
  <GlowCard
    as="section"
    className="w-[380px] p-5"
  >
    <Overline>Nouvelle dépense</Overline>
    <div className="mt-4 flex flex-col gap-3.5">
      <div className={ROW}>
        <Checkbox
          id="cb-recurring"
          defaultChecked
        />
        <Label
          htmlFor="cb-recurring"
          className={TEXT}
        >
          Récurrente mensuelle
        </Label>
      </div>
      <div className={ROW}>
        <Checkbox id="cb-exceptional" />
        <Label
          htmlFor="cb-exceptional"
          className={TEXT}
        >
          Achat exceptionnel
        </Label>
      </div>
      <div className={ROW}>
        <Checkbox id="cb-receipt" />
        <Label
          htmlFor="cb-receipt"
          className={TEXT}
        >
          Joindre un reçu
        </Label>
      </div>
    </div>
  </GlowCard>
);

export const States = () => (
  <div className="flex flex-col gap-3.5">
    <div className={ROW}>
      <Checkbox id="cb-s-off" />
      <Label
        htmlFor="cb-s-off"
        className={TEXT}
      >
        Non cochée — Joindre un reçu
      </Label>
    </div>
    <div className={ROW}>
      <Checkbox
        id="cb-s-on"
        checked
      />
      <Label
        htmlFor="cb-s-on"
        className={TEXT}
      >
        Cochée — Récurrente mensuelle
      </Label>
    </div>
    <div className={ROW}>
      <Checkbox
        id="cb-s-disabled"
        disabled
      />
      <Label
        htmlFor="cb-s-disabled"
        className={TEXT}
      >
        Désactivée — Plafond hebdomadaire
      </Label>
    </div>
    <div className={ROW}>
      <Checkbox
        id="cb-s-disabled-on"
        disabled
        checked
      />
      <Label
        htmlFor="cb-s-disabled-on"
        className={TEXT}
      >
        Désactivée cochée — Dépenses fixes
      </Label>
    </div>
  </div>
);

export const CategoryFilter = () => (
  <GlowCard
    as="section"
    className="w-[380px] p-5"
  >
    <Overline>Filtrer par catégorie</Overline>
    <div className="mt-4 flex flex-col gap-3.5">
      {[
        { id: "cat-food", name: "Alimentation", total: 412.8, on: true },
        { id: "cat-transport", name: "Transport", total: 118.4, on: true },
        { id: "cat-rent", name: "Loyer", total: 780, on: false },
        { id: "cat-pharmacy", name: "Pharmacie", total: 41.35, on: false },
      ].map((c) => (
        <div
          key={c.id}
          className="flex items-center justify-between gap-3"
        >
          <div className={ROW}>
            <Checkbox
              id={c.id}
              checked={c.on}
            />
            <Label
              htmlFor={c.id}
              className={TEXT}
            >
              {c.name}
            </Label>
          </div>
          <MoneyAmount
            value={c.total}
            unit="€"
            className={c.on ? "num text-sm text-ink" : "num text-sm text-ink-4"}
            decimalClassName="text-2xs"
          />
        </div>
      ))}
    </div>
  </GlowCard>
);
