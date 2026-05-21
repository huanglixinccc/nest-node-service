#!/usr/bin/env bash
# 在 ECS 上执行：安装生产依赖并重启 PM2
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/nest-node-service}"
cd "$APP_DIR"

echo "==> Installing production dependencies..."
npm ci --omit=dev

echo "==> Restarting PM2..."
if pm2 describe nest-node-service >/dev/null 2>&1; then
  pm2 reload ecosystem.config.js --update-env
else
  pm2 start ecosystem.config.js
fi

pm2 save
echo "==> Deploy finished."
