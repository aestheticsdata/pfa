import { isFindChord } from "@lib/keyboard";
import { describe, expect, it } from "vitest";

const key = (init: Partial<KeyboardEvent>) =>
  ({ key: "f", metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, ...init }) as KeyboardEvent;

describe("isFindChord", () => {
  it("is ⌘F on a Mac, not Ctrl+F", () => {
    expect(isFindChord(key({ metaKey: true }), true)).toBe(true);
    expect(isFindChord(key({ ctrlKey: true }), true)).toBe(false);
  });

  it("is Ctrl+F elsewhere, not ⌘F", () => {
    expect(isFindChord(key({ ctrlKey: true }), false)).toBe(true);
    expect(isFindChord(key({ metaKey: true }), false)).toBe(false);
  });

  it("accepts Caps Lock's uppercase F", () => {
    expect(isFindChord(key({ key: "F", metaKey: true }), true)).toBe(true);
  });

  it("rejects extra modifiers and other keys", () => {
    expect(isFindChord(key({ metaKey: true, shiftKey: true }), true)).toBe(false);
    expect(isFindChord(key({ metaKey: true, altKey: true }), true)).toBe(false);
    expect(isFindChord(key({ metaKey: true, ctrlKey: true }), true)).toBe(false);
    expect(isFindChord(key({ key: "k", metaKey: true }), true)).toBe(false);
  });
});
