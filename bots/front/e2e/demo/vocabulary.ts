/** The storyboard's verbs, plus `mark`: where an element is, noted for the edit with no pointer and no time. */
export const VERB = {
  moveTo: "moveTo",
  click: "click",
  fill: "fill",
  type: "type",
  press: "press",
  scroll: "scroll",
  glide: "glide",
  dwell: "dwell",
  mark: "mark",
  drag: "drag",
} as const;

/** Where on a target the pointer should land: `text` aims near the leading edge. */
export const AIM = { center: "center", text: "text" } as const;
