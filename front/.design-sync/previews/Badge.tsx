import { Badge } from "pfa-next";

export const Default = () => <Badge>Récurrent</Badge>;

export const Variants = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Badge variant="default">Récurrent</Badge>
    <Badge variant="secondary">Alimentation</Badge>
    <Badge variant="destructive">Dépassé</Badge>
    <Badge variant="outline">Non catégorisé</Badge>
  </div>
);

export const WithIcon = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Badge variant="secondary">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m12 3 1.9 5.8h6.1l-4.9 3.6 1.9 5.8-4.9-3.6-4.9 3.6 1.9-5.8L4.1 8.8h6.1Z" />
      </svg>
      Achat exceptionnel
    </Badge>
    <Badge variant="destructive">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 9v4" />
        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        <path d="M12 17h.01" />
      </svg>
      Plafond dépassé
    </Badge>
  </div>
);

export const WithCount = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Badge variant="secondary">
      Transport <span className="num">12</span>
    </Badge>
    <Badge variant="outline">
      Pharmacie <span className="num">3</span>
    </Badge>
    <Badge variant="default">
      <span className="num">+18,4</span> %
    </Badge>
  </div>
);

export const InRow = () => (
  <div className="flex items-center justify-between gap-4 border-b border-line-soft py-2.5">
    <div className="flex items-center gap-2.5">
      <span className="text-sm text-ink">Abonnement Netflix</span>
      <Badge variant="secondary">Récurrent</Badge>
    </div>
    <span className="num text-sm text-ink-2">19,99 €</span>
  </div>
);
