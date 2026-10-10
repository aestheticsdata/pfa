/**
 * PM2 config for the bot back-office API (PFA-127) — the template. Copy it to `ecosystem.config.cjs`,
 * fill in the real values, and keep that copy: it is gitignored, and `deploy-api.sh` scp's it to
 * /var/www/bots on every deploy. The same way folio, spira, pfa and Zeus do it: the values live as
 * literals in one file on your machine, never in git and never hand-edited on ks-b.
 *
 * `.cjs` because this package is ESM and pm2 `require()`s its config.
 */
const config = {
  PORT: "7200",

  // mysql://bots:<password>@localhost:3306/bots
  DATABASE_URL: "",

  // 32 random bytes — `openssl rand -hex 32`
  SESSION_SECRET: "",

  REDIS_URL: "redis://127.0.0.1:6379",

  BOTS_MODE: "live",
  // Copied beside this file by deploy-api.sh, from config/apps.json (gitignored).
  BOTS_APPS_FILE: "/var/www/bots/apps.json",

  // The runner's RUNNER_CONTROL_TOKEN — the variable is the one apps.json names in `tokenEnv`.
  PFA_RUNNER_TOKEN: "",

  // Web Push — `npx web-push generate-vapid-keys`. Unset = no phone notifications.
  VAPID_PUBLIC_KEY: "",
  VAPID_PRIVATE_KEY: "",
  VAPID_SUBJECT: "mailto:admin@bots.1991computer.com",
};

module.exports = {
  apps: [
    {
      name: "bots-nest-api",
      cwd: "/var/www/bots/nest-api",
      script: "dist/src/main.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      env_production: {
        NODE_ENV: "production",
        ...config,
      },
    },
  ],
};
