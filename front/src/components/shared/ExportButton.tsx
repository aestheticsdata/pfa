"use client";

import { Button } from "@components/ui/button";
import { cn } from "@lib/utils";
import common from "@text/common";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface ExportButtonProps {
  className?: string;
}

/** The shared "Exporter" action — identical on every page. MOCK: export is not
 *  implemented yet, so it only surfaces a toast. */
const ExportButton = ({ className }: ExportButtonProps) => {
  const { export: t } = common;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(className)}
      onClick={() => toast(t.toastTitle, { description: t.toastDescription })}
    >
      <Download className="size-3.5" />
      {t.label}
    </Button>
  );
};

export default ExportButton;
