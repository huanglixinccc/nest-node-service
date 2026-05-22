#!/usr/bin/env bash
# ECS 手动发布：拉代码 → 构建 → PM2 重启
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/nest-node-service}"
GIT_REMOTE="${GIT_REMOTE:-origin}"
GIT_BRANCH="${GIT_BRANCH:-main}"

cd "$APP_DIR"

if [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; then
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  # shellcheck source=/dev/null
  source "$NVM_DIR/nvm.sh"
fi

echo "==> git pull"
git pull "$GIT_REMOTE" "$GIT_BRANCH"

echo "==> install & build"
npm ci
npm run build

echo "==> restart pm2"
bash "$APP_DIR/scripts/deploy.sh"

echo "==> deploy ok"
