import { createProxyMiddleware } from "http-proxy-middleware";
import { ConfigService } from "@nestjs/config";
import { AppConfig } from "@config/app.config";

export const LEGACY_PROXY = "LEGACY_PROXY";

export const LegacyProxyProvider = {
  provide: LEGACY_PROXY,
  useFactory: (config: ConfigService) => {
    const appConfig = config.get<AppConfig>("app");
    if (!appConfig) {
      throw new Error("App config not loaded");
    }

    return createProxyMiddleware({
      target: appConfig.legacyApiUrl,
      changeOrigin: true,
    });
  },
  inject: [ConfigService],
};
