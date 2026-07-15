import { Checkbox, GlowCard, Label, Overline, Switch, TextInput } from "pfa-next";

const TEXT = "text-sm text-ink-2";

export const FieldLabels = () => (
  <GlowCard
    as="section"
    className="w-[420px] p-5"
  >
    <Overline>Nouvelle dépense</Overline>
    <div className="mt-3 grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="lb-label"
          className={TEXT}
        >
          Label
        </Label>
        <TextInput
          id="lb-label"
          placeholder="Ex : Boulangerie"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="lb-amount"
          className={TEXT}
        >
          Montant
        </Label>
        <TextInput
          id="lb-amount"
          className="num"
          defaultValue="41,35 €"
        />
      </div>
    </div>
  </GlowCard>
);

export const WithMeta = () => (
  <div className="w-[420px]">
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="lb-req"
          className={TEXT}
        >
          Catégorie
          <span className="text-neg">*</span>
        </Label>
        <TextInput
          id="lb-req"
          placeholder="Alimentation"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="lb-cap"
          className={`${TEXT} flex items-baseline justify-between gap-2`}
        >
          Plafond hebdomadaire
          <span className="num text-2xs tracking-caps text-ink-4">Restant 180,00 €</span>
        </Label>
        <TextInput
          id="lb-cap"
          className="num"
          placeholder="0,00 €"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="lb-err"
          className={TEXT}
        >
          Date de prélèvement
        </Label>
        <TextInput
          id="lb-err"
          className="num"
          aria-invalid
          defaultValue="32/05/2026"
        />
        <p className="text-xs text-neg">Date invalide.</p>
      </div>
    </div>
  </div>
);

export const WithControls = () => (
  <div className="flex flex-col gap-3.5">
    <div className="flex items-center gap-2.5">
      <Checkbox
        id="lb-cb"
        defaultChecked
      />
      <Label
        htmlFor="lb-cb"
        className={TEXT}
      >
        Récurrente mensuelle
      </Label>
    </div>
    <div className="flex items-center gap-2.5">
      <Checkbox id="lb-cb2" />
      <Label
        htmlFor="lb-cb2"
        className={TEXT}
      >
        Joindre un reçu
      </Label>
    </div>
    <div className="flex items-center gap-2.5">
      <Switch
        id="lb-sw"
        checked
        className="data-[state=checked]:bg-exc"
      />
      <Label
        htmlFor="lb-sw"
        className={TEXT}
      >
        Achats exceptionnels
      </Label>
    </div>
  </div>
);

export const DisabledPeer = () => (
  <div className="flex flex-col gap-3.5">
    <div className="flex items-center gap-2.5">
      <Checkbox
        id="lb-d-cb"
        disabled
        checked
      />
      <Label
        htmlFor="lb-d-cb"
        className={TEXT}
      >
        Dépenses fixes — verrouillé
      </Label>
    </div>
    <div className="flex items-center gap-2.5">
      <Switch
        id="lb-d-sw"
        disabled
      />
      <Label
        htmlFor="lb-d-sw"
        className={TEXT}
      >
        Plafond hebdomadaire — indisponible
      </Label>
    </div>
    <div className="flex items-center gap-2.5">
      <Checkbox id="lb-e-cb" />
      <Label
        htmlFor="lb-e-cb"
        className={TEXT}
      >
        Achat exceptionnel — actif
      </Label>
    </div>
  </div>
);
