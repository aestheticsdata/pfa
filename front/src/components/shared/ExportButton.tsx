"use client";

import { Button } from "@components/ui/button";
import { cn } from "@lib/utils";
import { Download } from "lucide-react";
import { toast } from "sonner";

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
    onClick={() => toast("Export à venir", { description: "Bientôt disponible." })}
  >
    <Download className="size-3.5" />
    Exporter
  </Button>
);

export default ExportButton;
