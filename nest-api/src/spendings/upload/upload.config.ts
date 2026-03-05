import type { Request } from "express";
import { diskStorage } from "multer";
import { open, mkdir } from "fs/promises";
import { join } from "path";
import { format } from "date-fns";

const DATE_FORMAT = "yyyy-MM-dd";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

const MAGIC_BYTES_SIZE = 12;
const IMAGE_SIGNATURES: Record<string, (b: Buffer) => boolean> = {
  jpeg: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  png: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  webp: (b) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP",
  gif: (b) => b.toString("ascii", 0, 4) === "GIF8",
};

export async function isValidImageFile(filepath: string): Promise<boolean> {
  const fh = await open(filepath, "r");
  try {
    const buf = Buffer.alloc(MAGIC_BYTES_SIZE);
    await fh.read(buf, 0, MAGIC_BYTES_SIZE, 0);
    return Object.values(IMAGE_SIGNATURES).some((check) => check(buf));
  } finally {
    await fh.close();
  }
}

function getInvoicesPath(): string {
  return process.env.PFA_INVOICES_IMAGES_PATH ?? join(process.cwd(), "invoicesUpload");
}

function sanitizeForFilename(s: string): string {
  return s.replaceAll(/[^a-zA-Z0-9À-ÿ _-]/g, "").replaceAll(" ", "-");
}

function safeExtension(originalname: string): string {
  const ext = (originalname.split(".").pop() ?? "").toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext) ? ext : "jpg";
}

export const invoiceUploadOptions = {
  storage: diskStorage({
    destination: (req, _file, cb) => {
      const userID = (req as Request & { user?: { id: string } }).user?.id;
      if (!userID) {
        cb(new Error("User not authenticated"), "");
        return;
      }
      const userDir = join(getInvoicesPath(), userID);
      mkdir(userDir, { recursive: true })
        .then(() => cb(null, userDir))
        .catch((err) => cb(err as Error, ""));
    },
    filename: (
      req: Express.Request,
      file: Express.Multer.File,
      cb: (error: Error | null, filename: string) => void,
    ) => {
      const body: Record<string, string> = (req as Request & { body: Record<string, string> }).body;
      const itemType: string = body.itemType;
      const date: string = body.date;
      const dateFrom: string = body.dateFrom;
      const label: string = body.label;

      let fileName = "";
      switch (itemType) {
        case "recurring":
          fileName = `recurring-${sanitizeForFilename(label)}-${format(new Date(dateFrom), DATE_FORMAT)}`;
          break;
        case "spending":
          fileName = `spending-${sanitizeForFilename(label)}-${format(new Date(date), DATE_FORMAT)}`;
          break;
        default:
          break;
      }

      cb(null, `${fileName}.${safeExtension(file.originalname)}`);
    },
  }),
  fileFilter: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
  },
  limits: { fileSize: 32_097_152 },
};
