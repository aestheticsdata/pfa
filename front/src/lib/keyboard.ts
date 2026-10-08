export const isMacPlatform = () => navigator.userAgent.includes("Mac");

/**
 * Whether a keydown is the platform's "find" chord: ⌘F on a Mac (Ctrl+F there is
 * Cocoa's "caret forward one character" in every text field), Ctrl+F elsewhere,
 * where ⌘ is not a key the keyboard has. Lowercased: with Caps Lock on, the key
 * arrives as "F" while `shiftKey` stays false — still the same chord.
 */
export const isFindChord = (event: KeyboardEvent, isMac: boolean) => {
  if (event.key.toLowerCase() !== "f" || event.altKey || event.shiftKey) return false;
  return isMac ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
};
