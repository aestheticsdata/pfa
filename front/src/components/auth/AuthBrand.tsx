import Logo from "@components/shared/brand/Logo";

/**
 * Card brand block — large glowing logo + title + optional subtitle.
 * (Login 2026.html .login-brand)
 */
export default function AuthBrand({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-7.5 flex flex-col items-center gap-4 text-center">
      <Logo
        size={58}
        glow
      />
      <h1 className="text-xl font-semibold tracking-snug text-ink">{title}</h1>
      {subtitle && <p className="text-sm text-ink-3">{subtitle}</p>}
    </div>
  );
}
