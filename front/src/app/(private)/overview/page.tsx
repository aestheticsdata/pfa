import { Suspense } from "react";
import OverviewPageClient from "@components/overview/OverviewPageClient";

export default function OverviewPage() {
  return (
    <Suspense fallback={null}>
      <OverviewPageClient />
    </Suspense>
  );
}
