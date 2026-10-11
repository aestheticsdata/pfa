import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { join } from "path";
import sharp from "sharp";
import { createWorker, OEM } from "tesseract.js";
import type { Worker } from "tesseract.js";

// The French model ships in an npm package and is read from disk: no CDN
// download, no API call — the OCR runs entirely on the server (PFA-214).
const LANG = "fra";
const LANG_PATH = join(require.resolve("@tesseract.js-data/fra/package.json"), "..", "4.0.0_best_int");

// Thermal receipts are narrow and low-contrast: widened and normalised, Tesseract
// reads them far better. Its own binarisation does the thresholding.
const OCR_WIDTH = 1500;

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

  read(imagePath: string): Promise<string> {
    const job = this.queue.then(() => this.recognize(imagePath));
    this.queue = job.catch(() => undefined);
    return job;
  }

  async onModuleDestroy(): Promise<void> {
    await this.shutdown();
  }

  private async recognize(imagePath: string): Promise<string> {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    try {
      const image = await sharp(imagePath)
        .rotate()
        .grayscale()
        .normalize()
        .resize({ width: OCR_WIDTH })
        .sharpen()
        .toBuffer();
      const worker = await this.getWorker();
      const { data } = await worker.recognize(image);
      return data.text;
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
