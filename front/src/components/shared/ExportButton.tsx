"use client";

import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@components/ui/button";
import { cn } from "@lib/utils";

interface ExportButtonProps {
  className?: string;
}

/** The shared "Exporter" action — identical on every page. MOCK: export is not
 *  implemented yet, so it only surfaces a toast. */
const ExportButton = ({ className }: ExportButtonProps) => (
  <Button
    type="button"
    variant="outline"
    size="sm"
    className={cn(className)}
    onClick={() =>
      toast("Export à venir", { description: "Bientôt disponible." })
    }
  >
    <Download className="size-3.5" />
    Exporter
  </Button>
);

export default ExportButton;
