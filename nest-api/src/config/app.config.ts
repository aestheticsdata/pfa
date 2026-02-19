import { registerAs } from "@nestjs/config";
import * as path from "path";

export interface AppConfig {
  port: number;
  legacyApiUrl: string;
  jwtSecret: string;
  invoicesPath: string;
}

export default registerAs(
  "app",
  (): AppConfig => ({
    port: parseInt(process.env.PORT!, 10),
    legacyApiUrl: `http://localhost:${process.env.LEGACY_API_PORT}`,
    jwtSecret: process.env.JWT_SECRET!,
    invoicesPath: process.env.PFA_INVOICES_IMAGES_PATH ?? path.resolve(process.cwd(), "invoicesUpload"),
  }),
);
