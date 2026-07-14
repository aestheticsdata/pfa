import { cn } from "@lib/utils";
import { useState } from "react";

import type { ReactNode } from "react";

interface DropzoneProps {
  /** `accept` attribute for the file input, e.g. "image/jpeg,image/png". */
  accept: string;
  /** Receives the picked/dropped file (undefined when the selection is empty). */
  onFile: (file: File | undefined) => void;
  /** Layout/shape chrome: flex direction, radius, padding, text alignment… */
  className?: string;
  children: ReactNode;
}

/**
 * Headless file dropzone — a label wrapping a hidden file input, with an internal
 * drag state that tints the dashed border. Layout and content come from the caller
 * via `className`/`children`; type/size validation lives in `onFile`.
 */
function Dropzone({ accept, onFile, className, children }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <label
      onDragEnter={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        onFile(e.dataTransfer.files?.[0]);
      }}
      className={cn(
        // children are pointer-events-none so drag events target the label
        // itself (no flicker when hovering child elements)
        "flex cursor-pointer border-[1.5px] border-dashed transition-colors [&_*]:pointer-events-none",
        isDragging ? "border-elec bg-elec/[0.06]" : "border-line hover:border-elec hover:bg-elec/[0.06]",
        className,
      )}
    >
      {children}
      <input
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.currentTarget.value = "";
        }}
      />
    </label>
  );
}

export { Dropzone };
