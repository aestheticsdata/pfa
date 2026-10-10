/** Error-rate colouring of the handoff: amber above 1.5 %, red above 5 %. */
export function errorClass(rate: number): string | undefined {
  if (rate > 5) return "text-bad";
  if (rate > 1.5) return "text-warn";
  return undefined;
}
