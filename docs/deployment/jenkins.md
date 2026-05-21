# Jenkins 部署指南（阿里云 ECS + RDS）

## 整体架构

```
开发者 push代码 → Git 仓库 → Jenkins 流水线 → SSH/rsync 部署到 ECS → PM2 运行 Nest → 连接 RDS MySQL
```

## 一、阿里云资源准备

### 1. ECS（跑 Jenkins + 后端，或分开两台）

**方案 A（入门）：Jenkins 和应用在同一台 ECS**

- 省成本，适合个人项目
- 2C4G 起步

**方案 B（推荐）：Jenkins 单独一台，应用一台**

- Jenkins 只负责构建和 SSH 部署
- 应用 ECS 只跑 PM2 + Nginx

### 2. RDS MySQL

- 与 ECS **同一 VPC**
- 创建数据库 `nest_auth`，字符集 `utf8mb4`
- RDS 白名单加入 ECS **内网 IP**
- `DB_HOST` 使用 RDS **内网地址**

### 3. 安全组

| 规则 | 说明 |
|------|------|
| 公网 22 | 仅你的 IP（SSH） |
| 公网 80/443 | 全员（Nginx） |
| 公网 8080 | 仅你的 IP（Jenkins，上线后可关） |
| RDS 3306 | 仅 ECS 内网，不对公网开放 |

---

## 二、ECS 初始化（应用服务器）

SSH 登录 ECS 后执行：

```bash
# Node.js 20（推荐，与 Nest CLI 兼容更好）
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs   # CentOS/AliyunLinux
# 或 Ubuntu: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs

node -v   # 应 >= 18
npm -v

# PM2
sudo npm install -g pm2

# 部署目录
sudo mkdir -p /opt/nest-node-service
sudo chown -R $USER:$USER /opt/nest-node-service
```

### 在 ECS 上配置生产环境变量（只做一次）

```bash
cd /opt/nest-node-service
cp .env.production.example .env.production
vim .env.production   # 填入 RDS 地址、密码、JWT_SECRET、CORS_ORIGINS
```

> `.env.production` **不要提交到 Git**，也不要被 Jenkins rsync 覆盖。Jenkins 同步时已排除本地 env 文件。

### 首次手动验证（可选）

```bash
git clone <你的仓库> /opt/nest-node-service
cd /opt/nest-node-service
npm ci
npm run build
pm2 start ecosystem.config.js
pm2 logs nest-node-service
curl http://127.0.0.1:3000/auth/register -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456"}'
```

---

## 三、安装 Jenkins

在 Jenkins 所在机器（可与 ECS 同一台）：

```bash
# 以 Docker 为例（推荐）
docker run -d \
  --name jenkins \
  -p 8080:8080 -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /usr/bin/docker:/usr/bin/docker \
  jenkins/jenkins:lts

# 或使用 yum/apt 安装 OpenJDK + Jenkins，见官方文档
```

首次访问 `http://<ECS-IP>:8080`，按向导完成安装。

### Jenkins 需要安装的插件

- **Pipeline**
- **Git**
- **SSH Agent Plugin**

### Jenkins 需要安装的工具（Global Tool Configuration 或容器内）

- Node.js 20
- Git
- rsync、ssh（一般系统自带）

---

## 四、Jenkins 凭证配置

进入 **Manage Jenkins → Credentials**：

| 凭证 ID | 类型 | 用途 |
|---------|------|------|
| `ecs-ssh-key` | SSH Username with private key | Jenkins SSH 到 ECS 部署 |
| `git-credentials` | Username/Password 或 SSH | 拉取私有仓库 |

### 配置 ECS SSH 互信

```bash
# 在 Jenkins 服务器上生成密钥（若无）
ssh-keygen -t ed25519 -C "jenkins-deploy"

# 公钥写入 ECS
ssh-copy-id root@<ECS-IP>
```

把私钥内容粘贴到 Jenkins Credentials `ecs-ssh-key`。

---

## 五、创建 Jenkins Pipeline 任务

1. **New Item** → 名称 `nest-node-service` → 选 **Pipeline**
2. **Pipeline** 配置：
   - Definition: **Pipeline script from SCM**
   - SCM: Git
   - Repository URL: 你的 Git 地址
   - Credentials: 选 git 凭证
   - Branch: `*/main`
   - Script Path: `Jenkinsfile`
3. 修改 `Jenkinsfile` 中的环境变量：
   - `DEPLOY_HOST` → ECS IP
   - `DEPLOY_USER` → SSH 用户
   - `SSH_CREDENTIALS` → 凭证 ID

点击 **Build Now** 触发首次构建。

---

## 六、流水线阶段说明

| 阶段 | 做什么 |
|------|--------|
| Checkout | 拉代码 |
| Install | `npm ci` |
| Test | `npm test` 单元测试 |
| Build | `npm run build` 生成 `dist/` |
| Deploy | rsync 到 ECS → 远程执行 `scripts/deploy.sh` → PM2 reload |

只有 `main` 分支会触发 Deploy（可在 Jenkinsfile 调整）。

---

## 七、Nginx 反向代理（可选，推荐）

API 域名 `api.example.com` 指向 ECS，Nginx 反代到 3000 端口：

```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

HTTPS 用阿里云免费 SSL 证书或 certbot。

---

## 八、常见问题

### 1. Jenkins 构建成功但应用连不上 RDS

- 检查 ECS 与 RDS 是否同 VPC
- `DB_HOST` 是否用的内网地址
- RDS 白名单是否包含 ECS 内网 IP
- `.env.production` 是否在 ECS 上存在且正确

### 2. CORS 报错

- ECS 上 `.env.production` 的 `CORS_ORIGINS` 必须包含前端真实域名
- 改完后：`pm2 reload ecosystem.config.js --update-env`

### 3. PM2 重启后进程消失

```bash
pm2 startup    # 按提示执行生成的命令
pm2 save
```

### 4. Node 18 crypto 报错

项目已包含 `src/polyfill.ts`，确保 `dist/main.js` 最先 import 它（当前已配置）。

---

## 九、后续优化（可选）

- [ ] 加 Docker 镜像构建，推送到阿里云 ACR
- [ ] Jenkins 用 **Credentials Binding** 注入敏感 env，不写文件
- [ ] 加 `/health` 健康检查接口供 SLB 探测
- [ ] 多环境：`staging` / `production` 分支分别部署
- [ ] TypeORM migration 替代手动建表
