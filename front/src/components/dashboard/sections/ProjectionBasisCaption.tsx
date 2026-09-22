"use client";

import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";

import type { ProjectionSource } from "@src/schemas/dashboard";

interface ProjectionBasisCaptionProps {
  /** Which month the projection reads from. "none" renders nothing at all —
   *  there is no projection to explain. */
  source: ProjectionSource;
  className?: string;
}

/**
 * The footnote naming the month a projection rests on.
 *
 * Shared by the sparkline's dashed tail and the per-category breakdown
 * (PFA-181): both are cut from the same reference month, so both name it with
 * the same words and a reader never has to wonder whether two figures on the
 * same screen were built from different history.
 */
const ProjectionBasisCaption = ({ source, className }: ProjectionBasisCaptionProps) => {
  const { projectionBasis } = useTranslations("dashboard");

  if (source === "none") return null;

  return <p className={cn("mt-1.5 text-right text-3xs text-ink-4", className)}>{projectionBasis[source]}</p>;
};

export default ProjectionBasisCaption;
