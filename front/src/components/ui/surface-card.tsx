import { cn } from "@lib/utils";
import { cva } from "class-variance-authority";

import type { VariantProps } from "class-variance-authority";

const surfaceCardVariants = cva("rounded-xl border shadow-xl", {
  variants: {
    variant: {
      default: "bg-gradient-to-br from-[#121212] via-[#0a0a0a] to-black border-gray-800/50",
      accent: "bg-gradient-to-br from-cyan-600 to-blue-600 border-transparent shadow-lg shadow-cyan-500/20",
      nested: "bg-gradient-to-r from-gray-800/60 to-gray-800/40 border-gray-700/50",
      flat: "bg-card border-border",
    },
    padding: {
      none: "",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
    },
  },
  defaultVariants: {
    variant: "default",
    padding: "lg",
  },
});

export interface SurfaceCardProps extends React.ComponentProps<"div">, VariantProps<typeof surfaceCardVariants> {
  asChild?: boolean;
}

function SurfaceCard({ className, variant, padding, ...props }: SurfaceCardProps) {
  return (
    <div
      data-slot="surface-card"
      className={cn(surfaceCardVariants({ variant, padding }), className)}
      {...props}
    />
  );
}

export { SurfaceCard, surfaceCardVariants };
