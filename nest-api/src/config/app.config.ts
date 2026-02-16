import { registerAs } from "@nestjs/config";

export interface AppConfig {
  port: number;
  legacyApiUrl: string;
  jwtSecret: string;
}

export default registerAs(
  "app",
  (): AppConfig => ({
    port: parseInt(process.env.PORT!, 10),
    legacyApiUrl: `http://localhost:${process.env.LEGACY_API_PORT}`,
    jwtSecret: process.env.JWT_SECRET!,
  }),
);
