import { env } from "@config/env";
import { registerAs } from "@nestjs/config";

export interface AppConfig {
  port: number;
  invoicesPath: string;
}

export default registerAs(
  "app",
  (): AppConfig => ({
    port: env.port,
    invoicesPath: env.invoicesPath,
  }),
);
