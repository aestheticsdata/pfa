import type { Request } from "express";
import { diskStorage } from "multer";
import { mkdir } from "fs/promises";
import { join } from "path";
import { format } from "date-fns";

const DATE_FORMAT = "yyyy-MM-dd";

function getInvoicesPath(): string {
  return (
    process.env.PFA_INVOICES_IMAGES_PATH ??
    join(process.cwd(), "invoicesUpload")
  );
}

const stringToHyphen = (s: string) => s.replaceAll(" ", "-");

export const invoiceUploadOptions = {
  storage: diskStorage({
    destination: async (req, _file, cb) => {
      const userID = (req as Request & { user?: { id: string } }).user?.id;
      if (!userID) {
        cb(new Error("User not authenticated"), "");
        return;
      }
      const userDir = join(getInvoicesPath(), userID);
      try {
        await mkdir(userDir, { recursive: true });
        cb(null, userDir);
      } catch (err) {
        cb(err as Error, "");
      }
    },
    filename: (req, file, cb) => {
      const body = (req as Request & { body: Record<string, string> }).body;
      const { itemType, date, dateFrom, label } = body;

      let fileName = "";
      switch (itemType) {
        case "recurring":
          fileName = `recurring-${stringToHyphen(label)}-${format(new Date(dateFrom), DATE_FORMAT)}`;
          break;
        case "spending":
          fileName = `spending-${stringToHyphen(label)}-${format(new Date(date), DATE_FORMAT)}`;
          break;
        default:
          break;
      }

      const ext = file.originalname.split(".").pop() ?? "jpg";
      cb(null, `${fileName}.${ext}`);
    },
  }),
  limits: { fileSize: 32_097_152 },
};
