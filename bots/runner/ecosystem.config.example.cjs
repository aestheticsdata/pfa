/**
 * PM2 config for the bot runner (PFA-124) — the template. Copy it to `ecosystem.config.cjs`, fill in
 * the real values, and keep that copy: it is gitignored, and `deploy-runner.sh` scp's it to
 * /var/www/bots/runner.ecosystem.config.cjs on every deploy (beside the API's own file).
 */
const config = {
  // 32+ characters — `openssl rand -hex 32`. The back-office API presents it as PFA_RUNNER_TOKEN.
  RUNNER_CONTROL_TOKEN: "",
  RUNNER_CONTROL_PORT: "7300",

  // Outside the release folders, so a deploy never touches the bots' passwords or the switches.
  RUNNER_STATE_DIR: "/var/www/bots/state",

  // The public URL: the bots cross nginx and the IP lock like real users (PFA-122).
  PFA_API_URL: "https://pfa.1991computer.com/api",

  // Disable / purge from the back-office: PFA's internal route, on loopback only, and the same
  // SYNTHETIC_ADMIN_TOKEN as in PFA's own ecosystem file.
  PFA_INTERNAL_API_URL: "http://127.0.0.1:6100/api",
  SYNTHETIC_ADMIN_TOKEN: "",
};

module.exports = {
  apps: [
    {
      name: "bots-runner",
      cwd: "/var/www/bots/runner",
      script: "node_modules/.bin/tsx",
      args: "src/main.ts",
      interpreter: "none",
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
