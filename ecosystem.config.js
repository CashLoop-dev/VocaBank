module.exports = {
  apps: [
    {
      name: 'api',
      script: './api.js',
      cwd: './api',
      exec_mode: 'cluster',
      watch: true,
      instances: 'max',
      env_production: {
        NODE_ENV: 'production',
      },
      out_file: '/var/log/pm2/api-out.log',
      error_file: '/var/log/pm2/api-error.log',
    },
    {
      name: 'telegram',
      script: './bot.js',
      cwd: './telegram',
      exec_mode: 'cluster',
      watch: true,
      instances: 'max',
      env_production: {
        NODE_ENV: 'production',
      },
      out_file: '/var/log/pm2/telegram-out.log',
      error_file: '/var/log/pm2/telegram-error.log',
    },
  ],
};
