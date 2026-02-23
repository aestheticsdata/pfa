import { registerAs } from "@nestjs/config";
import * as path from "path";

export interface AppConfig {
  port: number;
  invoicesPath: string;
}

export default registerAs(
  "app",
  (): AppConfig => ({
    port: parseInt(process.env.PORT!, 10),
    invoicesPath: process.env.PFA_INVOICES_IMAGES_PATH ?? path.resolve(process.cwd(), "invoicesUpload"),
  }),
);
