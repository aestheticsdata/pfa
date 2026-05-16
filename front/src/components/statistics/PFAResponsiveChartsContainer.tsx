import type { ReactNode } from "react";
import { SurfaceCard } from "@components/ui/surface-card";

interface PFAResponsiveChartsContainerProps {
  children: ReactNode;
  title?: string;
}

const PFAResponsiveChartsContainer = ({
  children,
  title,
}: PFAResponsiveChartsContainerProps) => (
  <SurfaceCard className="flex flex-col gap-3 w-full lg:w-1/2 p-6">
    {title && (
      <div className="text-gray-100 text-lg font-medium">{title}</div>
    )}
    <div className="h-[420px] w-full">{children}</div>
  </SurfaceCard>
);

export default PFAResponsiveChartsContainer;
