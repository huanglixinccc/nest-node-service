/** PM2 进程配置，部署到 ECS 后使用：pm2 start ecosystem.config.js */
module.exports = {
  apps: [
    {
      name: 'nest-node-service',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        ENV_FILE: '.env.production',
        NODE_ENV: 'production',
      },
    },
  ],
};
