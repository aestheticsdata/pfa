module.exports = {
  apps: [
    {
      name: 'pfa-front',
      cwd: __dirname,
      script: './node_modules/next/dist/bin/next',
      args: 'start -p 3000 -H 127.0.0.1',
      interpreter: 'node',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
        HOST: '127.0.0.1'
      }
    }
  ]
};
