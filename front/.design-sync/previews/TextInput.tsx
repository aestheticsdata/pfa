import { TextInput } from "pfa-next";

const FIELD = "w-64";

export const Base = () => (
  <div className="flex flex-col gap-3">
    <TextInput className={FIELD} placeholder="Libellé de la dépense" />
    <TextInput className={FIELD} defaultValue="Courses Monoprix" />
  </div>
);

export const Amount = () => (
  <div className="flex flex-col gap-3">
    <TextInput className={`${FIELD} num`} type="number" step="0.01" defaultValue="1240.50" />
    <TextInput className={`${FIELD} num`} type="date" defaultValue="2026-05-14" />
  </div>
);

export const Disabled = () => (
  <div className="flex flex-col gap-3">
    <TextInput className={FIELD} disabled placeholder="Plafond hebdomadaire" />
    <TextInput className={`${FIELD} num`} disabled defaultValue="780,00 €" />
  </div>
);

export const Invalid = () => (
  <div className="flex flex-col gap-3">
    <TextInput className={`${FIELD} num`} aria-invalid defaultValue="-12,00" />
    <TextInput className={FIELD} aria-invalid placeholder="Champ requis" />
  </div>
);
