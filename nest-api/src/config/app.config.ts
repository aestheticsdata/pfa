import { registerAs } from "@nestjs/config";
import { env } from "@config/env";

export interface AppConfig {
  port: number;
  invoicesPath: string;
}

export default registerAs("app", (): AppConfig => ({
  port: env.port,
  invoicesPath: env.invoicesPath,
}));
