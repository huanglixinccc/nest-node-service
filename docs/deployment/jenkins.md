# Jenkins 部署指南（GitHub → ECS 自动部署）

## 你的部署流程（配好后）

```
本地改代码 → git push github main → Jenkins Build Now → 拉 GitHub 最新 → 构建 → 部署 /opt → PM2 重启
```

`.env.production` 只在 ECS 上维护，**Jenkins 不会覆盖**。

---

## 一、在 ECS 上安装 Jenkins（与应用同机）

```bash
# 1. 安装 Docker（若未安装）
dnf install -y docker
systemctl start docker
systemctl enable docker

# 2. 启动 Jenkins（挂载部署目录，使用 root 以便写 /opt）
docker run -d --name jenkins \
  --restart=always \
  -p 8080:8080 -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /opt/nest-node-service:/opt/nest-node-service \
  -v /root/.nvm:/root/.nvm:ro \
  -v /usr/local/bin/pm2:/usr/local/bin/pm2:ro \
  --user root \
  jenkins/jenkins:lts

# 3. 获取初始密码
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

浏览器访问：`http://121.40.175.162:8080`（安全组需放行 **8080**）

安装推荐插件：**Pipeline**、**Git**、**NodeJS**

---

## 二、Jenkins 里安装 Node.js

**Manage Jenkins → Tools → NodeJS → Add NodeJS**

- Name: `Node20`
- Install automatically: 勾选
- Version: NodeJS 20.x

（若自动安装失败，可在 ECS 宿主机用 nvm 装好 Node，再挂载进容器）

---

## 三、GitHub 拉代码（国内 ECS 重点）

先在 ECS 上测试能否访问 GitHub：

```bash
curl -I --connect-timeout 10 https://github.com
```

### 情况 A：能访问

Jenkins 任务 Git 地址填：

```
https://github.com/huanglixinccc/nest-node-service.git
```

### 情况 B：不能访问（你之前 git pull 失败的情况）

Jenkins 任务里改用 **GitHub 镜像地址**（任选一个能用的）：

```
https://gitclone.com/github.com/huanglixinccc/nest-node-service.git
```

或：

```
https://ghfast.top/https://github.com/huanglixinccc/nest-node-service.git
```

> 你本地仍然 `git push` 到 GitHub；Jenkins 通过镜像拉**同一份** GitHub 上的代码。

---

## 四、创建 Pipeline 任务

1. **New Item** → 名称 `nest-node-service` → **Pipeline**
2. **Pipeline → Definition**: Pipeline script from SCM
3. **SCM**: Git
4. **Repository URL**: 上面选的 GitHub 或镜像地址
5. **Branch**: `*/main`
6. **Script Path**: `Jenkinsfile`
7. 保存

点击 **Build Now** 测试。

---

## 五、每次重新部署

```bash
# 在你本地电脑
git add .
git commit -m "your message"
git push origin main
```

然后：

- Jenkins 页面点 **Build Now**，或
- 配置 **GitHub Webhook** 实现 push 后自动构建（可选）

Jenkins 会自动：

1. 拉 `main` 最新代码
2. `npm ci` → `npm test` → `npm run build`
3. rsync 到 `/opt/nest-node-service`（保留 `.env.production`）
4. `pm2 reload` 重启应用

---

## 六、Jenkins 容器内使用宿主机 Node（若 Tools 安装失败）

进入容器确认：

```bash
docker exec -it jenkins bash
export NVM_DIR="/root/.nvm"
. "$NVM_DIR/nvm.sh"
node -v
npm -v
which pm2
```

Pipeline 的 Install 阶段前可加：

```bash
export NVM_DIR="/root/.nvm"
. "$NVM_DIR/nvm.sh"
```

或在 Jenkinsfile Install 阶段加上述两行（如需要可再改）。

---

## 七、常见问题

| 问题 | 处理 |
|------|------|
| Checkout 超时 | 换 GitHub 镜像 URL |
| npm: command not found | 配置 NodeJS 工具或挂载 nvm |
| pm2: command not found | 宿主机 `npm i -g pm2`，挂载 pm2 到容器 |
| 部署后 env 丢失 | 确认 rsync 已 exclude `.env.production` |
| DB 连接失败 | ECS 上 `.env.production` 保持 `DB_SSL=false`（本机 MySQL） |

---

## 八、可选：push 后自动部署（Webhook）

1. GitHub 仓库 → Settings → Webhooks → Add webhook
2. Payload URL: `http://121.40.175.162:8080/github-webhook/`（需安装 GitHub plugin）
3. Jenkins 任务 → Build Triggers → GitHub hook trigger

若 GitHub 无法直连 ECS Webhook，可继续用手动 **Build Now**。
