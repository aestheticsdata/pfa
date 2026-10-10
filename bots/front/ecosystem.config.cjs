/**
 * PM2 config of the back-office front on ks-b — committed, like folio's: nothing in it is secret.
 * It ships inside every release, and `deploy-front.sh` reloads pm2 from the live copy.
 */
module.exports = {
  apps: [
    {
      name: "bots-front",
      cwd: __dirname,
      script: "./node_modules/next/dist/bin/next",
      args: "start -p 3014 -H 127.0.0.1",
      interpreter: "node",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      env: {
        NODE_ENV: "production",
        PORT: "3014",
        HOST: "127.0.0.1",
        BOTS_API_URL: "http://127.0.0.1:7200/api",
      },
    },
  ],
};
