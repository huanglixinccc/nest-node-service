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
cp .env.example .env
# 编辑 .env，填入 MySQL 密码和 JWT_SECRET
```

### 3. 安装依赖并启动

```bash
npm install
npm run start:dev
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
| DB_HOST | MySQL 主机 | 127.0.0.1（建议用 IP，避免 IPv6 连接问题） |
| DB_PORT | MySQL 端口 | 3306 |
| DB_USERNAME | MySQL 用户名 | root |
| DB_PASSWORD | MySQL 密码 | （空） |
| DB_DATABASE | 数据库名 | nest_auth |
| JWT_SECRET | JWT 签名密钥 | — |
| JWT_EXPIRES_IN | Token 有效期 | 7d |
| PORT | 服务端口 | 3000 |

## 开发命令

```bash
npm run start:dev   # 热重载开发
npm run build       # 构建
npm run test        # 单元测试
npm run test:e2e    # E2E 测试
```
