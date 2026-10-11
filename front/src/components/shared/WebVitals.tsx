"use client";

import { reportWebVital } from "@lib/report";
import { useReportWebVitals } from "next/web-vitals";

/**
 * Hands Next's Core Web Vitals to the Iknos reporter (PFA-212). Renders nothing.
 *
 * `reportWebVital` is a module function, so the callback is the same on every render and Next
 * never re-subscribes.
 */
export function WebVitals() {
  useReportWebVitals(reportWebVital);
  return null;
}
