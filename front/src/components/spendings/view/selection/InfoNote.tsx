import { Info } from "lucide-react";

import type { ReactNode } from "react";

interface InfoNoteProps {
  children: ReactNode;
}

/** Blue informational note of the grouping / shared-receipt modals (PFA-189). */
const InfoNote = ({ children }: InfoNoteProps) => (
  <div className="flex items-start gap-2.5 rounded-md border border-elec/28 bg-elec/8 px-3.5 py-3 text-sm text-ink-2">
    <Info className="mt-px size-3.75 shrink-0 text-elec" />
    <span>{children}</span>
  </div>
);

export default InfoNote;
