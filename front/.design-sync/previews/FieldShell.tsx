import { FieldShell, TextInput } from "pfa-next";

const FIELD = "w-64";

export const Base = () => (
  <FieldShell label="Libellé" htmlFor="fs-label" className={FIELD}>
    <TextInput id="fs-label" placeholder="Courses, Uber, Pharmacie…" />
  </FieldShell>
);

export const Filled = () => (
  <FieldShell label="Montant" htmlFor="fs-amount" className={FIELD}>
    <TextInput id="fs-amount" className="num" type="number" step="0.01" defaultValue="41.35" />
  </FieldShell>
);

export const WithError = () => (
  <FieldShell
    label="Montant"
    htmlFor="fs-amount-err"
    error="Le montant doit être supérieur à 0."
    className={FIELD}
  >
    <TextInput id="fs-amount-err" className="num" aria-invalid defaultValue="0,00" />
  </FieldShell>
);

export const Disabled = () => (
  <FieldShell label="Catégorie" htmlFor="fs-category" className={FIELD}>
    <TextInput id="fs-category" disabled defaultValue="Alimentation" />
  </FieldShell>
);

export const Form = () => (
  <div className={`flex flex-col gap-4 ${FIELD}`}>
    <FieldShell label="Libellé" htmlFor="fs-form-label">
      <TextInput id="fs-form-label" defaultValue="Abonnement Netflix" />
    </FieldShell>
    <FieldShell label="Montant" htmlFor="fs-form-amount">
      <TextInput id="fs-form-amount" className="num" type="number" step="0.01" defaultValue="13.49" />
    </FieldShell>
    <FieldShell label="Date" htmlFor="fs-form-date" error="Date hors du mois en cours.">
      <TextInput id="fs-form-date" className="num" type="date" aria-invalid defaultValue="2026-05-14" />
    </FieldShell>
  </div>
);
