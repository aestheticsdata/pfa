import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { join } from "path";
import sharp from "sharp";
import { createWorker, OEM } from "tesseract.js";
import type { Worker } from "tesseract.js";
import { findSlips, flattenLighting, inkPerColumn } from "@spendings/receipt-lines/receipt-image";
import type { GrayImage, SlipBounds } from "@spendings/receipt-lines/interfaces/receiptLinesTypes";

// The French model ships in an npm package and is read from disk: no CDN
// download, no API call — the OCR runs entirely on the server (PFA-214).
const LANG = "fra";
const LANG_PATH = join(require.resolve("@tesseract.js-data/fra/package.json"), "..", "4.0.0_best_int");

// The background is the image blurred this wide: wider than a character, so the
// print disappears from it, narrower than a shadow, so the shadow stays (PFA-216).
const BACKGROUND_BLUR = 12;
// Each slip is enlarged before the OCR: stored receipts are at most 1500px tall,
// and Tesseract reads small print far better at twice the size.
const SLIP_SCALE = 2;
// Margin kept around a slip, so its outer letters are not shaved.
const SLIP_MARGIN = 12;
// Stored receipts carry no density; this one quiets Tesseract's guess.
const OCR_DENSITY = 300;

// The worker holds ~150 MB: kept warm between receipts, let go when unused.
const IDLE_SHUTDOWN_MS = 5 * 60_000;

/**
 * Reads the text of a receipt image with Tesseract (WASM, in a worker thread).
 * One worker, one receipt at a time: OCR never competes with the API for more
 * than one core, however many uploads arrive together.
 */
@Injectable()
export class ReceiptOcrService implements OnModuleDestroy {
  private readonly logger = new Logger(ReceiptOcrService.name);
  private worker: Promise<Worker> | null = null;
  private queue: Promise<unknown> = Promise.resolve();
  private idleTimer: NodeJS.Timeout | null = null;

  /**
   * The receipt's text, read whole and — when the photo holds several slips
   * side by side — slip by slip. Each reading lists the text of its pages, left
   * to right; which reading holds up is the parser's call (PFA-216).
   */
  read(imagePath: string): Promise<string[][]> {
    const job = this.queue.then(() => this.recognize(imagePath));
    this.queue = job.catch(() => undefined);
    return job;
  }

  async onModuleDestroy(): Promise<void> {
    await this.shutdown();
  }

  private async recognize(imagePath: string): Promise<string[][]> {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    try {
      const readings = await this.readingImages(imagePath);
      const worker = await this.getWorker();
      const texts: string[][] = [];
      for (const pages of readings) {
        const reading: string[] = [];
        for (const page of pages) {
          const { data } = await worker.recognize(page);
          reading.push(data.text);
        }
        texts.push(reading);
      }
      return texts;
    } catch (err) {
      // A broken worker is not reused: the next receipt starts a fresh one.
      this.logger.error(`Receipt OCR failed: ${(err as Error).message}`);
      await this.shutdown();
      throw err;
    } finally {
      this.idleTimer = setTimeout(() => void this.shutdown(), IDLE_SHUTDOWN_MS);
      this.idleTimer.unref();
    }
  }

  /**
   * The photo with its lighting evened out, as one page, then cut into its
   * slips when it holds several. Normalising the whole image instead wrecked
   * shadowed paper; two slips read as one page run into each other line by
   * line, while a wide blank between a slip's own columns can pass for a gap
   * between slips — hence both readings (PFA-216).
   */
  private async readingImages(imagePath: string): Promise<Buffer[][]> {
    const gray = sharp(imagePath).rotate().grayscale();
    const { data, info } = await gray.clone().raw().toBuffer({ resolveWithObject: true });
    const background = await gray.clone().blur(BACKGROUND_BLUR).raw().toBuffer();
    const flat = flattenLighting({ data, width: info.width, height: info.height }, background);

    const whole = [await this.enlarge(flat, { start: 0, end: flat.width })];
    const slips = findSlips(inkPerColumn(flat), flat.height);
    if (slips.length < 2) return [whole];
    return [whole, await Promise.all(slips.map((slip) => this.enlarge(flat, slip)))];
  }

  /** One slip of the flattened photo, with a margin, enlarged for the OCR. */
  private enlarge(flat: GrayImage, slip: SlipBounds): Promise<Buffer> {
    const left = Math.max(0, slip.start - SLIP_MARGIN);
    const width = Math.min(flat.width, slip.end + SLIP_MARGIN) - left;
    return sharp(flat.data, { raw: { width: flat.width, height: flat.height, channels: 1 } })
      .extract({ left, top: 0, width, height: flat.height })
      .resize({ width: width * SLIP_SCALE })
      .withMetadata({ density: OCR_DENSITY })
      .png()
      .toBuffer();
  }

  private getWorker(): Promise<Worker> {
    this.worker ??= createWorker(LANG, OEM.LSTM_ONLY, { langPath: LANG_PATH, cacheMethod: "none" });
    return this.worker;
  }

  private async shutdown(): Promise<void> {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = null;
    const worker = this.worker;
    this.worker = null;
    if (!worker) return;
    try {
      await (await worker).terminate();
    } catch {
      // A worker that never started has nothing to terminate.
    }
  }
}
