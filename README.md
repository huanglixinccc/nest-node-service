# nest-node-service

基于 NestJS 的用户名密码登录注册服务，使用 MySQL + TypeORM + JWT 鉴权。

## 功能

- 用户注册（用户名 + 密码）
- 用户登录（返回 JWT Access Token）
- 获取当前用户信息（需 Bearer Token）

## 技术栈

- NestJS 10
- TypeORM + MySQL
- Passport (Local + JWT)
- bcrypt 密码哈希
- class-validator 参数校验

## 快速开始

### 1. 创建数据库

```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS nest_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 2. 配置环境变量

```bash
cp .env.local.example .env.local
cp .env.production.example .env.production
# .env.local 填本地 MySQL 密码
# .env.production 填阿里云 RDS 信息（只需配置一次）
```

### 3. 安装依赖并启动

```bash
npm install
npm run start:dev    # 本地数据库 + watch
npm run start        # 线上 RDS 数据库 + watch
```

服务默认运行在 `http://localhost:3000`。

## API

### 注册

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"123456"}'
```

### 登录

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"123456"}'
```

响应示例：

```json
{ "access_token": "eyJhbG..." }
```

### 获取个人信息（需鉴权）

```bash
curl http://localhost:3000/auth/profile \
  -H "Authorization: Bearer <access_token>"
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| DB_HOST | MySQL 主机（本地 127.0.0.1，阿里云填 RDS 地址） | 127.0.0.1 |
| DB_PORT | MySQL 端口 | 3306 |
| DB_USERNAME | MySQL 用户名 | root |
| DB_PASSWORD | MySQL 密码 | （空） |
| DB_DATABASE | 数据库名 | nest_auth |
| DB_SSL | 是否启用 SSL（阿里云 RDS 建议 true） | false |
| DB_SSL_REJECT_UNAUTHORIZED | SSL 是否校验证书 | true |
| DB_CONNECTION_LIMIT | 连接池大小 | 10 |
| DB_CONNECT_TIMEOUT | 连接超时（毫秒） | 10000 |
| JWT_SECRET | JWT 签名密钥 | — |
| JWT_EXPIRES_IN | Token 有效期 | 7d |
| PORT | 服务端口 | 3000 |
| HOST | 监听地址（云服务器用 0.0.0.0） | 0.0.0.0 |
| CORS_ORIGINS | 允许跨域的前端地址，逗号分隔 | 本地开发见 .env.example |
| CORS_CREDENTIALS | 是否允许携带 Cookie/凭证 | true |
| NODE_ENV | 环境（production 时关闭 synchronize） | development |

## 阿里云部署

### 架构建议

```
浏览器 → 前端（OSS/CDN 或 ECS Nginx）→ 后端 ECS（本服务）→ RDS MySQL（同 VPC 内网）
```

### 1. RDS MySQL

1. 在阿里云创建 RDS MySQL 实例，与 ECS **同一 VPC**
2. 创建数据库 `nest_auth`，字符集 `utf8mb4`
3. 在 RDS 白名单中加入 ECS 内网 IP
4. **优先使用 RDS 内网地址** 作为 `DB_HOST`（更快、免流量费）
5. 在 `.env.production` 中配置（`npm run start` 会自动加载）：

```env
NODE_ENV=production
DB_HOST=rm-xxxxxxxx.mysql.rds.aliyuncs.com
DB_USERNAME=your_rds_user
DB_PASSWORD=your_rds_password
DB_DATABASE=nest_auth
DB_SSL=true
JWT_SECRET=请替换为足够长的随机字符串
CORS_ORIGINS=https://www.your-frontend.com
```

> 表结构需提前建好（生产环境 `synchronize=false`）。可先在本地生成 SQL 或在 RDS 控制台执行建表语句。

### 2. ECS 部署后端

```bash
npm ci
npm run build
npm run start:prod
```

建议使用 PM2 / systemd / Docker 守护进程，安全组放行 `PORT`（如 3000，或通过 Nginx 反代 80/443）。

### 3. 前端跨域（CORS）

前端与 API **不同域名** 时，必须在 ECS 环境变量中配置：

```env
CORS_ORIGINS=https://www.your-frontend.com,https://your-frontend.com
```

前端请求示例（axios）：

```javascript
axios.defaults.baseURL = 'https://api.your-domain.com';
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

若前端通过 **Nginx 反向代理** 把 `/api` 转发到后端（同域部署），则浏览器无跨域问题，可不再单独配 CORS。

### 4. 安全组 / 防火墙

| 方向 | 规则 |
|------|------|
| 公网 → ECS | 仅开放 80/443（Nginx）或 API 端口 |
| ECS → RDS | RDS 白名单允许 ECS 内网 IP，**不要**把 RDS 3306 暴露公网 |
| 公网 → RDS | 禁止 |

## 开发命令

```bash
npm run start:dev   # 本地 .env.local + watch
npm run start       # 线上 .env.production + watch
npm run build       # 构建
npm run start:prod  # 生产构建产物启动（ECS 部署用）
npm run test        # 单元测试
npm run test:e2e    # E2E 测试
```
