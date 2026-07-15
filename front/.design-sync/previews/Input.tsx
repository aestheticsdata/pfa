import { Input } from "pfa-next";

const FIELD = "w-64";

export const Base = () => (
  <div className="flex flex-col gap-3">
    <Input className={FIELD} placeholder="Libellé de la dépense" />
    <Input className={FIELD} defaultValue="Courses Monoprix" />
  </div>
);

export const Types = () => (
  <div className="flex flex-col gap-3">
    <Input className={FIELD} type="text" defaultValue="Abonnement Netflix" />
    <Input className={`${FIELD} num`} type="number" step="0.01" defaultValue="41.35" />
    <Input className={`${FIELD} num`} type="date" defaultValue="2026-05-14" />
  </div>
);

export const Disabled = () => (
  <div className="flex flex-col gap-3">
    <Input className={FIELD} disabled placeholder="Catégorie verrouillée" />
    <Input className={FIELD} disabled defaultValue="Loyer" />
  </div>
);

export const Invalid = () => (
  <div className="flex flex-col gap-3">
    <Input className={`${FIELD} num`} aria-invalid defaultValue="-12,00" />
    <Input className={FIELD} aria-invalid placeholder="Champ requis" />
  </div>
);
