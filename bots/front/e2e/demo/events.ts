import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import type { Locator } from "@playwright/test";
import type { Box, EventLogFile, EventLogMeta, Gesture, Key, Press } from "./interfaces/demoTypes";

/**
 * Everything the hand did during the take, on the film's clock — so an edit made
 * afterwards can frame it.
 *
 * The take is one continuous recording and needs no editing to be watched. A cut
 * made from it — the landing page's Remotion films — needs more than its pixels:
 * where the pointer was at every moment, when it pressed, what it typed, and the
 * box of the element each gesture was aimed at. That is what lets the edit zoom
 * onto a click, spotlight a widget and redraw the pointer at any size without
 * anyone placing a keyframe by hand, and what lets it name a beat by the mark it
 * touched (`budget-edit`) rather than by a second that moves on every re-take.
 *
 * Every time is milliseconds since the film's first frame — the zero the recorder
 * and the chapter clock are rebased to in `Demo.open`, so a gesture before it
 * (the pointer parked before the page loads) comes out negative. Every position is
 * in CSS pixels of the viewport; the mp4 carries `captureScale` frame pixels for
 * each of them.
 *
 * Written beside the mp4 as `events.json` on every take. It costs one `evaluate`
 * per gesture, which the pacing does not notice.
 */

/** A tenth of a pixel is below anything a frame can show, and it halves the file. */
const tenth = (value: number) => Math.round(value * 10) / 10;

export class EventLog {
  private readonly pointerSteps: [number, number, number][] = [];
  private readonly pressList: Press[] = [];
  private readonly keyList: Key[] = [];
  private readonly gestureList: Gesture[] = [];
  private pressed: { at: number; x: number; y: number } | null = null;

  constructor(private startedAt: number) {}

  /** Move the clock's zero. `Demo.open` does it once, with the recorder and the chapters. */
  rebase(startedAt: number) {
    this.startedAt = startedAt;
  }

  /** Milliseconds on the film's clock. */
  now() {
    return Date.now() - this.startedAt;
  }

  pointer(x: number, y: number) {
    this.pointerSteps.push([this.now(), tenth(x), tenth(y)]);
  }

  down(x: number, y: number) {
    this.pressed = { at: this.now(), x: tenth(x), y: tenth(y) };
  }

  up() {
    if (!this.pressed) return;
    this.pressList.push({ ...this.pressed, release: this.now() });
    this.pressed = null;
  }

  key(key: string) {
    this.keyList.push({ at: this.now(), key });
  }

  gesture(gesture: Gesture) {
    this.gestureList.push(gesture);
  }

  write(to: string, meta: EventLogMeta) {
    mkdirSync(dirname(to), { recursive: true });
    const file: EventLogFile = {
      version: 1,
      ...meta,
      pointer: this.pointerSteps,
      presses: this.pressList,
      keys: this.keyList,
      gestures: this.gestureList,
    };
    writeFileSync(to, `${JSON.stringify(file)}\n`, "utf8");
  }
}

/**
 * The target as the log files it: family, member and box, read in the same breath as
 * the box so the element is known to be there. Never called after a press — a submit
 * button is gone by then, and a locator waiting for it would hold the take.
 */
export async function describe(target: Locator, box: Box) {
  const { testid, data } = await target.evaluate((node) => {
    const family = node.closest("[data-testid]") ?? node;
    const members: Record<string, string> = {};
    for (const attribute of Array.from(family.attributes)) {
      if (attribute.name.startsWith("data-") && attribute.name !== "data-testid") {
        members[attribute.name.slice(5)] = attribute.value;
      }
    }
    return { testid: family.getAttribute("data-testid"), data: members };
  });
  return {
    testid,
    data,
    selector: String(target),
    box: { x: tenth(box.x), y: tenth(box.y), width: tenth(box.width), height: tenth(box.height) },
  };
}
