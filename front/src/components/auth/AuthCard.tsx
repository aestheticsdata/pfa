import { cn } from "@lib/utils";

/**
 * Auth glass card — radial halo behind, 1px gradient border, blurred glass
 * fill with a top sheen. Ported from Login 2026.html (.card-halo/.card-border/
 * .login-card). Shared by Login / Signup / About / Forgot-password.
 */
export default function AuthCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="relative">
      {/* halo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-[90px] -inset-y-[70px] -z-10 blur-[20px] [background:radial-gradient(60%_55%_at_50%_40%,oklch(0.55_0.13_185/0.20)_0%,transparent_70%),radial-gradient(45%_45%_at_60%_70%,oklch(0.60_0.14_150/0.14)_0%,transparent_70%)]"
      />
      {/* gradient border */}
      <div className="rounded-[26px] p-px shadow-hero [background:linear-gradient(165deg,oklch(0.75_0.10_200/0.55)_0%,oklch(0.40_0.03_250/0.18)_28%,oklch(0.30_0.02_250/0.14)_62%,oklch(0.72_0.13_155/0.45)_100%)]">
        {/* glass */}
        <div
          className={cn(
            "relative w-[400px] max-w-[calc(100vw-48px)] overflow-hidden rounded-[25px] px-[34px] pt-[38px] pb-7 backdrop-blur-[24px] [background:linear-gradient(180deg,oklch(0.215_0.010_245/0.92)_0%,oklch(0.185_0.008_250/0.94)_100%)]",
            className,
          )}
        >
          {/* top sheen */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-[10%] top-0 h-px [background:linear-gradient(90deg,transparent,oklch(1_0_0/0.35),transparent)]"
          />
          {children}
        </div>
      </div>
    </div>
  );
}
