import { useEffect, useState } from "react";

/**
 * Returns `value` delayed by `delayMs`, resetting the timer on every change — so
 * a fast-typed search box only propagates once the user pauses. Used by the
 * whole-history spending search (COS-114) to avoid a request per keystroke.
 */
const useDebouncedValue = <T>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
};

export default useDebouncedValue;
