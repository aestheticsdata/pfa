import { GlowCard, Label, Overline, Switch } from "pfa-next";

const PILL = "inline-flex items-center gap-2 rounded-sm border border-line px-2.5 py-1.5 text-xs";
const ROW = "flex items-center justify-between gap-6";
const TEXT = "text-sm text-ink-2";

export const FilterToggles = () => (
  <div className="flex flex-wrap items-center gap-2">
    <div className={`${PILL} bg-surface-elev`}>
      <Switch
        id="sw-compare"
        checked
        className="data-[state=checked]:bg-accent-strong"
      />
      <Label
        htmlFor="sw-compare"
        className="text-xs text-ink-3"
      >
        Comparer à <span className="num text-ink-2">2025</span>
      </Label>
    </div>
    <div className={`${PILL} bg-transparent`}>
      <Switch
        id="sw-exceptionals"
        checked
        className="data-[state=checked]:bg-exc"
      />
      <Label
        htmlFor="sw-exceptionals"
        className="text-xs text-ink-2"
      >
        Achats exceptionnels
      </Label>
    </div>
    <div className={`${PILL} bg-transparent`}>
      <Switch id="sw-fixed" />
      <Label
        htmlFor="sw-fixed"
        className="text-xs text-ink-3"
      >
        Dépenses fixes
      </Label>
    </div>
  </div>
);

export const States = () => (
  <div className="flex flex-col gap-3.5">
    <div className="flex items-center gap-2.5">
      <Switch id="sw-off" />
      <Label
        htmlFor="sw-off"
        className={TEXT}
      >
        Inactif — Comparer à l’an dernier
      </Label>
    </div>
    <div className="flex items-center gap-2.5">
      <Switch
        id="sw-on"
        checked
      />
      <Label
        htmlFor="sw-on"
        className={TEXT}
      >
        Actif — Comparer à l’an dernier
      </Label>
    </div>
    <div className="flex items-center gap-2.5">
      <Switch
        id="sw-off-disabled"
        disabled
      />
      <Label
        htmlFor="sw-off-disabled"
        className={TEXT}
      >
        Désactivé — Plafond hebdomadaire
      </Label>
    </div>
    <div className="flex items-center gap-2.5">
      <Switch
        id="sw-on-disabled"
        disabled
        checked
      />
      <Label
        htmlFor="sw-on-disabled"
        className={TEXT}
      >
        Désactivé actif — Achats exceptionnels
      </Label>
    </div>
  </div>
);

export const SettingsCard = () => (
  <GlowCard
    as="section"
    className="w-[420px] p-4"
  >
    <Overline>Préférences d’affichage</Overline>
    <div className="mt-3 flex flex-col gap-3">
      <div className={ROW}>
        <div className="flex flex-col gap-0.5">
          <Label
            htmlFor="sw-p-exc"
            className={TEXT}
          >
            Achats exceptionnels
          </Label>
          <span className="text-2xs text-ink-4">Inclus dans le reste à vivre</span>
        </div>
        <Switch
          id="sw-p-exc"
          checked
          className="data-[state=checked]:bg-exc"
        />
      </div>
      <div className={ROW}>
        <div className="flex flex-col gap-0.5">
          <Label
            htmlFor="sw-p-cap"
            className={TEXT}
          >
            Plafond hebdomadaire
          </Label>
          <span className="text-2xs text-ink-4">
            Alerte au-delà de <span className="num">180,00 €</span>
          </span>
        </div>
        <Switch
          id="sw-p-cap"
          checked
        />
      </div>
      <div className={ROW}>
        <div className="flex flex-col gap-0.5">
          <Label
            htmlFor="sw-p-fixed"
            className={TEXT}
          >
            Dépenses fixes
          </Label>
          <span className="text-2xs text-ink-4">Masquer les prélèvements</span>
        </div>
        <Switch id="sw-p-fixed" />
      </div>
    </div>
  </GlowCard>
);
