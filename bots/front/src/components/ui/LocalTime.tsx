"use client";

import { TIME_FORMAT } from "@components/ui/timeFormat";
import { clockTime, dayTime } from "@lib/format/format";
import { useEffect, useState } from "react";

import type { LocalTimeProps } from "@components/ui/interfaces/uiTypes";

/**
 * A time on the operator's clock. Formatted in the browser only: the server runs on UTC (ks-b),
 * and a first paint in UTC that React keeps after hydration would show every time 1–2 h off.
 */
const LocalTime = ({ iso, format = TIME_FORMAT.clock }: LocalTimeProps) => {
  const [text, setText] = useState("");
  useEffect(() => {
    setText(format === TIME_FORMAT.day ? dayTime(iso) : clockTime(iso));
  }, [iso, format]);
  return (
    <time
      dateTime={iso}
      className="tabular"
    >
      {text}
    </time>
  );
};

export default LocalTime;
