# ClassArranger 完整部署指南 - Best Practice

**Created:** 2026-01-22  
**Last Updated:** 2026-01-23  
**Purpose:** 从零到生产环境的完整部署指南，包含团队协作和故障排查

---

## 📋 目录

1. [准备工作](#准备工作)
2. [初始设置](#初始设置)
3. [Terraform 基础设施部署](#terraform-基础设施部署)
4. [Git-Based 团队协作](#git-based-团队协作)
5. [日常开发流程](#日常开发流程)
6. [GCP 故障排查](#gcp-故障排查)
7. [CI/CD 自动化](#cicd-自动化)
8. [生产环境优化](#生产环境优化)

---

## 准备工作

### 你需要准备

- ✅ **GCP 账号**（已绑定信用卡）
- ✅ **GitHub 账号**
- ✅ **一台电脑**（Mac/Windows/Linux）
- ✅ **稳定的网络连接**
- ✅ **60 分钟的时间**（首次设置）

### 费用说明

**GCP Compute Engine VM (e2-medium) - 东京区域:**
- **配置**: 2 vCPU, 4GB RAM, 20GB 磁盘
- **月费用**: 约 $27（东京区域，低延迟）
- **免费额度**: 新用户 $300 免费试用（可用 90 天）
- **优势**: 部署在东京，亚洲访问速度快

### 技术栈 (Best Practice)

```
┌─────────────────────────────────────────┐
│          Production Stack               │
├─────────────────────────────────────────┤
│ Frontend:  React + Vite + Nginx         │
│ Backend:   FastAPI + Python 3.11        │
│ Database:  MongoDB (containerized)      │
│ Container: Docker + Docker Compose      │
│ IaC:       Terraform                    │
│ Hosting:   GCP Compute Engine VM        │
│ Region:    asia-northeast1 (Tokyo)      │
│ Deploy:    Git-based deployment         │
│ CI/CD:     GitHub Actions               │
└─────────────────────────────────────────┘
```

---

## 初始设置

### 步骤 1: 安装必要工具

#### 1.1 安装 Google Cloud CLI

**Mac (Homebrew):**
```bash
brew install google-cloud-sdk
```

**Windows:**
1. 下载: https://cloud.google.com/sdk/docs/install
2. 运行安装程序

**Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

**验证安装:**
```bash
gcloud --version
```

#### 1.2 安装 Terraform

**Mac:**
```bash
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
```

**Windows:**
```bash
choco install terraform
```

**Linux:**
```bash
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/
```

**验证安装:**
```bash
terraform version
# 应显示: Terraform v1.6.0 或更高版本
```

#### 1.3 安装 Git

**Mac:**
```bash
brew install git
```

**Windows/Linux:**  
https://git-scm.com/downloads

**配置 Git:**
```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

### 步骤 2: 设置 GCP 环境

#### 2.1 认证 GCP

```bash
# 登录 GCP
gcloud auth login

# 设置应用默认凭据（Terraform 需要）
gcloud auth application-default login
```

#### 2.2 创建 GCP 项目

```bash
# 创建项目（项目 ID 必须全球唯一）
PROJECT_ID="classarranger-$(date +%s)"
gcloud projects create $PROJECT_ID --name="ClassArranger"

# 设置为默认项目
gcloud config set project $PROJECT_ID

# 保存项目 ID（后续会用到）
echo $PROJECT_ID
```

**📝 记下你的 PROJECT_ID!**

#### 2.3 启用计费

```bash
# 列出计费账号
gcloud billing accounts list

# 关联计费账号
gcloud billing projects link $PROJECT_ID \
  --billing-account=YOUR_BILLING_ACCOUNT_ID
```

#### 2.4 启用必要的 API

```bash
# 启用 Compute Engine API
gcloud services enable compute.googleapis.com

# 验证
gcloud services list --enabled
```

### 步骤 3: Fork 和克隆项目

#### 3.1 Fork 项目

1. 访问: https://github.com/seisei-sekai/ClassArranger
2. 点击右上角 **Fork** 按钮
3. Fork 到你的 GitHub 账号

#### 3.2 克隆到本地

```bash
# 克隆你 Fork 的仓库
git clone https://github.com/YOUR_USERNAME/ClassArranger.git
cd ClassArranger

# 添加上游仓库（用于同步）
git remote add upstream https://github.com/seisei-sekai/ClassArranger.git

# 验证
git remote -v
# 应该看到 origin 和 upstream
```

---

## Terraform 基础设施部署

### 步骤 4: 配置 Terraform

#### 4.1 创建配置文件

```bash
cd terraform/vm

# 复制示例配置
cp terraform.tfvars.example terraform.tfvars

# 编辑配置
vim terraform.tfvars  # 或使用你喜欢的编辑器
```

#### 4.2 配置 terraform.tfvars

```hcl
# GCP Project Configuration
project_id = "your-project-id-here"  # ⚠️ 替换为你的项目 ID
region     = "asia-northeast1"       # 东京区域（推荐）
zone       = "asia-northeast1-a"     # 东京可用区 A

# VM Instance Configuration
instance_name  = "classarranger-vm"
machine_type   = "e2-medium"  # 推荐配置（2 vCPU, 4GB RAM）
boot_disk_size = 20           # 磁盘大小 (GB)

# Network Configuration
use_static_ip = false  # 改为 true 可获得固定 IP（额外 ~$3/月）

# Git Deployment Configuration
git_repo_url = "https://github.com/YOUR_USERNAME/ClassArranger.git"  # ⚠️ 替换
wait_for_deployment = true
```

**机器类型选择（东京区域）:**
| 类型 | vCPU | 内存 | 月费用 | 适用场景 |
|------|------|------|--------|---------|
| e2-micro | 0.25-2 | 1GB | ~$7 | 仅测试 |
| e2-small | 0.5-2 | 2GB | ~$14 | 轻量使用 |
| **e2-medium** | **2** | **4GB** | **~$27** | **推荐** ✅ |
| e2-standard-2 | 2 | 8GB | ~$53 | 高负载 |

#### 4.3 初始化 Terraform

```bash
# 初始化（下载 provider 插件）
terraform init

# 格式化代码
terraform fmt

# 验证配置
terraform validate
```

### 步骤 5: 部署基础设施

#### 方法一: 使用自动化脚本（推荐）

```bash
# 返回项目根目录
cd ../..

# 设置环境变量
export PROJECT_ID="your-project-id"
export REGION="asia-northeast1"
export ZONE="asia-northeast1-a"

# 运行部署脚本
./scripts/frequently-used/terraform-deploy.sh
```

脚本会自动完成：
1. ✅ 初始化 Terraform
2. ✅ 生成执行计划
3. ✅ 创建 VM 和网络资源
4. ✅ 配置防火墙规则
5. ✅ 克隆 Git 仓库到 VM
6. ✅ 部署 Docker 容器
7. ✅ 运行健康检查

⏰ **等待时间:** 约 10-15 分钟

#### 方法二: 手动 Terraform 命令

```bash
cd terraform/vm

# 1. 生成执行计划
terraform plan -out=tfplan

# 2. 查看计划（确认要创建的资源）
terraform show tfplan

# 3. 应用更改
terraform apply tfplan

# 4. 查看输出
terraform output
```

### 步骤 6: 验证部署

```bash
# 获取 VM 外部 IP
EXTERNAL_IP=$(terraform output -raw external_ip 2>/dev/null || \
  gcloud compute instances describe classarranger-vm \
  --zone=asia-northeast1-a \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo "External IP: $EXTERNAL_IP"

# 测试前端
curl -I http://$EXTERNAL_IP

# 测试后端
curl http://$EXTERNAL_IP:8000/health

# 在浏览器中访问
echo "Frontend: http://$EXTERNAL_IP"
echo "Backend API: http://$EXTERNAL_IP:8000/docs"
```

✅ **基础设施部署完成！**

---

## Git-Based 团队协作

### 步骤 7: 团队协作设置

#### 7.1 邀请团队成员

**在 GitHub 上:**
1. 进入你的仓库
2. **Settings** → **Collaborators**
3. 添加团队成员的 GitHub 账号

**团队成员操作:**
```bash
# 克隆仓库
git clone https://github.com/YOUR_USERNAME/ClassArranger.git
cd ClassArranger

# 配置 Git
git config user.name "Team Member Name"
git config user.email "member@example.com"
```

#### 7.2 分支策略 (Best Practice)

```
main (production)          ← 生产环境，受保护
  ↑
develop (integration)      ← 集成分支，测试新功能
  ↑
feature/* (features)       ← 功能开发分支
```

**设置分支保护:**
1. GitHub 仓库 → **Settings** → **Branches**
2. 添加规则保护 `main` 分支:
   - ✅ Require pull request reviews
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date

#### 7.3 创建功能分支

```bash
# 确保在最新的 main 分支
git checkout main
git pull origin main

# 创建功能分支
git checkout -b feature/add-user-profile

# 进行开发...
# 编辑文件

# 提交更改
git add .
git commit -m "feat: add user profile page

- Add profile component
- Add profile API endpoint
- Add tests"

# 推送到远程
git push origin feature/add-user-profile
```

**Commit 消息规范 (Conventional Commits):**
```
<type>: <subject>

<body>

<footer>
```

**Types:**
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建/工具/依赖更新

#### 7.4 创建 Pull Request

1. 推送分支后，GitHub 会提示创建 PR
2. 点击 **Compare & pull request**
3. 填写 PR 描述:
   ```markdown
   ## 描述
   添加用户个人资料页面功能
   
   ## 更改内容
   - [ ] 前端：用户资料组件
   - [ ] 后端：用户资料 API
   - [ ] 测试：单元测试和集成测试
   
   ## 测试步骤
   1. 访问 `/profile` 页面
   2. 验证用户信息显示正确
   3. 测试编辑功能
   
   ## 截图
   (可选)添加截图
   ```
4. 请求代码审查
5. 等待审查通过后合并

#### 7.5 代码审查 (Code Review)

**审查者操作:**
```bash
# 拉取 PR 分支进行本地测试
git fetch origin
git checkout feature/add-user-profile

# 本地测试
docker-compose up

# 运行测试
cd backend && pytest
cd frontend && npm test

# 在 GitHub 上添加评论和批准
```

**审查清单:**
- ✅ 代码质量和可读性
- ✅ 测试覆盖率
- ✅ 文档更新
- ✅ 无安全问题
- ✅ 符合项目规范

#### 7.6 合并和部署

```bash
# 合并到 main 分支后，自动触发 CI/CD
# GitHub Actions 会自动：
# 1. 运行测试
# 2. 构建 Docker 镜像
# 3. 部署到生产环境（如果配置了）
```

---

## 日常开发流程

### 本地开发

#### 1. 启动本地环境

```bash
# 启动所有服务
docker-compose up

# 或后台运行
docker-compose up -d

# 查看日志
docker-compose logs -f
```

访问:
- 前端: http://localhost:5173
- 后端: http://localhost:8000
- API 文档: http://localhost:8000/docs

#### 2. 进行更改

```bash
# 编辑代码
vim backend/app/main.py
vim frontend/src/App.jsx

# 热重载会自动生效
```

#### 3. 运行测试

```bash
# 后端测试
cd backend
pytest

# 前端测试
cd frontend
npm test
```

#### 4. 提交更改

```bash
# 查看更改
git status
git diff

# 暂存更改
git add .

# 提交
git commit -m "feat: add new feature"

# 推送
git push origin feature/your-branch
```

### 部署到生产环境

#### 方法一: Git-Based 部署（推荐，Best Practice）

```bash
# 1. 确保更改已推送到 GitHub
git push origin main

# 2. 运行 Git 部署脚本
./scripts/frequently-used/deploy-git.sh
```

**脚本会自动:**
1. ✅ 检查 VM 状态
2. ✅ 验证本地没有未提交的更改
3. ✅ 在 VM 上执行 `git pull`
4. ✅ 重新构建 Docker 容器
5. ✅ 重启服务
6. ✅ 运行健康检查
7. ✅ 显示部署状态

**示例输出:**
```
======================================
   ClassArranger Git Deployment
======================================

>>> Checking VM status...
✓ VM is running

>>> Checking for uncommitted changes...
✓ No uncommitted changes

>>> Pulling latest code on VM...
✓ Code updated successfully

>>> Rebuilding and restarting services...
✓ Services restarted successfully

>>> Running health checks...
✓ Backend is healthy
✓ Frontend is accessible

======================================
   Deployment Complete! 🎉
======================================

📱 Frontend:  http://34.146.84.254
🔌 Backend:   http://34.146.84.254:8000
📚 API Docs:  http://34.146.84.254:8000/docs
```

#### 回滚部署

```bash
# 查看提交历史
git log --oneline -n 10

# 回滚到上一版本
./scripts/frequently-used/rollback-git.sh HEAD~1

# 或回滚到特定提交
./scripts/frequently-used/rollback-git.sh abc1234
```

---

## GCP 故障排查

### 常见问题诊断

#### 1. VM 无法访问

**检查 VM 状态:**
```bash
# 查看 VM 列表
gcloud compute instances list

# 查看特定 VM
gcloud compute instances describe classarranger-vm \
  --zone=asia-northeast1-a
```

**可能原因:**
- ❌ VM 未运行
- ❌ 防火墙规则未配置
- ❌ 外部 IP 已更改

**解决方案:**
```bash
# 启动 VM
gcloud compute instances start classarranger-vm \
  --zone=asia-northeast1-a

# 检查防火墙规则
gcloud compute firewall-rules list

# 获取当前 IP
gcloud compute instances describe classarranger-vm \
  --zone=asia-northeast1-a \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

#### 2. SSH 连接问题

**测试 SSH:**
```bash
# 标准 SSH
gcloud compute ssh classarranger-vm \
  --zone=asia-northeast1-a

# 使用特定密钥
gcloud compute ssh classarranger-vm \
  --zone=asia-northeast1-a \
  --ssh-key-file=~/.ssh/google_compute_engine
```

**故障排查:**
```bash
# 查看 SSH 密钥
gcloud compute os-login ssh-keys list

# 添加 SSH 密钥
gcloud compute os-login ssh-keys add \
  --key-file=~/.ssh/id_rsa.pub

# 使用串行控制台（紧急情况）
gcloud compute instances get-serial-port-output classarranger-vm \
  --zone=asia-northeast1-a
```

#### 3. Docker 容器问题

**SSH 到 VM 并检查:**
```bash
# SSH 到 VM
gcloud compute ssh classarranger-vm --zone=asia-northeast1-a

# 查看容器状态
sudo docker ps -a

# 查看容器日志
sudo docker logs classarranger-backend-1 --tail 100
sudo docker logs classarranger-frontend-1 --tail 100
sudo docker logs classarranger-mongodb-1 --tail 100

# 查看实时日志
sudo docker logs -f classarranger-backend-1

# 重启特定容器
sudo docker restart classarranger-backend-1

# 重启所有服务
cd /opt/classarranger
sudo docker-compose -f docker-compose.prod.yml restart
```

#### 4. 应用错误调试

**后端调试:**
```bash
# 查看后端日志
gcloud compute ssh classarranger-vm --zone=asia-northeast1-a \
  --command="sudo docker logs classarranger-backend-1 --tail 200"

# 进入后端容器
gcloud compute ssh classarranger-vm --zone=asia-northeast1-a
sudo docker exec -it classarranger-backend-1 bash

# 在容器内
python
>>> # 测试数据库连接等
```

**前端调试:**
```bash
# 查看 Nginx 日志
gcloud compute ssh classarranger-vm --zone=asia-northeast1-a \
  --command="sudo docker exec classarranger-frontend-1 cat /var/log/nginx/error.log"

# 查看前端构建
gcloud compute ssh classarranger-vm --zone=asia-northeast1-a
sudo docker exec -it classarranger-frontend-1 ls -la /usr/share/nginx/html
```

#### 5. 数据库连接问题

**检查 MongoDB:**
```bash
# SSH 到 VM
gcloud compute ssh classarranger-vm --zone=asia-northeast1-a

# 进入 MongoDB 容器
sudo docker exec -it classarranger-mongodb-1 mongosh

# 在 mongosh 中
show dbs
use classarranger
show collections
db.users.find()

# 检查网络连接
sudo docker network ls
sudo docker network inspect classarranger_default
```

#### 6. 磁盘空间问题

```bash
# 检查磁盘使用
gcloud compute ssh classarranger-vm --zone=asia-northeast1-a \
  --command="df -h"

# 查看 Docker 磁盘使用
gcloud compute ssh classarranger-vm --zone=asia-northeast1-a \
  --command="sudo docker system df"

# 清理未使用的 Docker 资源
gcloud compute ssh classarranger-vm --zone=asia-northeast1-a \
  --command="sudo docker system prune -a --volumes -f"

# 扩展磁盘（如果需要）
gcloud compute disks resize classarranger-vm \
  --size=40GB \
  --zone=asia-northeast1-a
```

#### 7. 网络问题诊断

```bash
# 测试端口连接
nc -zv 34.146.84.254 80
nc -zv 34.146.84.254 8000

# 检查防火墙规则
gcloud compute firewall-rules describe classarranger-http
gcloud compute firewall-rules describe classarranger-api

# 查看网络流量
gcloud compute ssh classarranger-vm --zone=asia-northeast1-a
sudo tcpdump -i any port 80 -n
```

#### 8. 查看系统资源使用

```bash
# SSH 到 VM
gcloud compute ssh classarranger-vm --zone=asia-northeast1-a

# 查看 CPU 和内存
top
htop  # 如果已安装

# 查看容器资源使用
sudo docker stats --no-stream

# 查看系统日志
sudo journalctl -xe
sudo tail -f /var/log/syslog
```

### GCP 日志和监控

#### 使用 Cloud Logging

```bash
# 查看 VM 日志
gcloud logging read "resource.type=gce_instance AND \
  resource.labels.instance_id=classarranger-vm" \
  --limit 50 \
  --format json

# 实时查看日志
gcloud logging tail "resource.type=gce_instance"

# 查看特定时间段
gcloud logging read "resource.type=gce_instance" \
  --freshness=1h
```

#### 设置告警

在 GCP Console:
1. **Monitoring** → **Alerting**
2. 创建告警策略:
   - CPU 使用率 > 80%
   - 内存使用率 > 80%
   - 磁盘使用率 > 80%
   - HTTP 响应错误率 > 5%

---

## CI/CD 自动化

### GitHub Actions 配置

项目已包含 CI/CD 配置: `.github/workflows/terraform-deploy.yml`

#### 功能特性

1. **Pull Request 时:**
   - ✅ 运行测试
   - ✅ 生成 Terraform plan
   - ✅ 在 PR 中评论计划详情

2. **合并到 main 时:**
   - ✅ 自动部署基础设施
   - ✅ 更新应用代码
   - ✅ 运行健康检查

3. **手动触发:**
   - ✅ Deploy（部署）
   - ✅ Plan（计划）
   - ✅ Destroy（销毁）

### 配置 GitHub Secrets

#### 创建 GCP 服务账号

```bash
# 1. 创建服务账号
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Deployer"

# 2. 授予权限
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/compute.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# 3. 创建密钥
gcloud iam service-accounts keys create github-key.json \
  --iam-account=github-actions@$PROJECT_ID.iam.gserviceaccount.com

# 4. 查看密钥内容
cat github-key.json
```

#### 在 GitHub 添加 Secrets

1. GitHub 仓库 → **Settings** → **Secrets and variables** → **Actions**
2. 点击 **New repository secret**
3. 添加以下 secrets:

| Secret 名称 | 值 | 说明 |
|------------|-----|------|
| `GCP_PROJECT_ID` | `your-project-id` | GCP 项目 ID |
| `GCP_SA_KEY` | `{...JSON content...}` | 服务账号密钥 |
| `GCP_REGION` | `asia-northeast1` | GCP 区域 |
| `GCP_ZONE` | `asia-northeast1-a` | GCP 可用区 |
| `VM_MACHINE_TYPE` | `e2-medium` | VM 类型 |

⚠️ **重要:** 添加完成后删除本地密钥文件
```bash
rm github-key.json
```

### 触发 CI/CD

#### 自动触发（推送到 main）

```bash
git add .
git commit -m "feat: add new feature"
git push origin main

# GitHub Actions 会自动部署
```

#### 手动触发

1. GitHub 仓库 → **Actions**
2. 选择 **Terraform Deploy** workflow
3. 点击 **Run workflow**
4. 选择动作:
   - `apply`: 部署
   - `plan`: 仅查看计划
   - `destroy`: 销毁资源

#### 监控 CI/CD 状态

在 **Actions** 页面可以看到:
- ✅ 每一步的执行状态
- ✅ 详细日志
- ✅ Terraform 输出
- ✅ 部署的 URL
- ✅ 测试结果

---

## 生产环境优化

### 1. 使用静态 IP

```hcl
# terraform/vm/terraform.tfvars
use_static_ip = true
```

```bash
cd terraform/vm
terraform apply

# 获取静态 IP
terraform output static_ip
```

**优势:**
- ✅ IP 不会因 VM 重启而改变
- ✅ 可以配置 DNS
- ✅ 更稳定

**成本:** ~$3/月

### 2. 配置自定义域名

**使用 Cloud DNS:**
```bash
# 创建 DNS Zone
gcloud dns managed-zones create classarranger \
  --dns-name="yourdomain.com" \
  --description="ClassArranger DNS zone"

# 获取静态 IP
STATIC_IP=$(terraform output -raw static_ip)

# 添加 A 记录
gcloud dns record-sets create yourdomain.com. \
  --zone=classarranger \
  --type=A \
  --ttl=300 \
  --rrdatas=$STATIC_IP

# 添加 www 记录
gcloud dns record-sets create www.yourdomain.com. \
  --zone=classarranger \
  --type=A \
  --ttl=300 \
  --rrdatas=$STATIC_IP
```

### 3. 配置 HTTPS (Let's Encrypt)

```bash
# SSH 到 VM
gcloud compute ssh classarranger-vm --zone=asia-northeast1-a

# 安装 Certbot
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 测试自动续期
sudo certbot renew --dry-run
```

### 4. 自动备份 MongoDB

**创建备份脚本:**
```bash
# 在 VM 上
cat > /opt/classarranger/backup-mongodb.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"
mkdir -p $BACKUP_DIR

# 备份 MongoDB
docker exec classarranger-mongodb-1 mongodump \
  --out=/tmp/backup

# 复制到宿主机
docker cp classarranger-mongodb-1:/tmp/backup \
  $BACKUP_DIR/mongodb_$DATE

# 压缩
tar -czf $BACKUP_DIR/mongodb_$DATE.tar.gz \
  -C $BACKUP_DIR mongodb_$DATE

# 清理
rm -rf $BACKUP_DIR/mongodb_$DATE

# 上传到 GCS（可选）
gsutil cp $BACKUP_DIR/mongodb_$DATE.tar.gz \
  gs://your-backup-bucket/

# 删除 7 天前的备份
find $BACKUP_DIR -name "mongodb_*.tar.gz" -mtime +7 -delete

echo "Backup completed: mongodb_$DATE.tar.gz"
EOF

chmod +x /opt/classarranger/backup-mongodb.sh
```

**设置定时任务:**
```bash
# 添加到 crontab（每天凌晨 3 点）
sudo crontab -e

# 添加这行
0 3 * * * /opt/classarranger/backup-mongodb.sh >> /var/log/mongodb-backup.log 2>&1
```

### 5. 监控和告警

**安装监控代理:**
```bash
# SSH 到 VM
gcloud compute ssh classarranger-vm --zone=asia-northeast1-a

# 安装 Cloud Monitoring agent
curl -sSO https://dl.google.com/cloudagents/add-google-cloud-ops-agent-repo.sh
sudo bash add-google-cloud-ops-agent-repo.sh --also-install
```

**配置告警策略（在 GCP Console）:**
1. **Monitoring** → **Alerting** → **Create Policy**
2. 添加条件:
   - CPU 使用率 > 80%（5 分钟）
   - 内存使用率 > 85%（5 分钟）
   - 磁盘使用率 > 90%
   - HTTP 5xx 错误率 > 1%
3. 配置通知渠道（Email/Slack/PagerDuty）

### 6. 性能优化

**前端优化:**
```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'calendar': ['@fullcalendar/react'],
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      }
    }
  }
}
```

**后端优化:**
```python
# backend/app/core/config.py
class Settings(BaseSettings):
    # 生产环境配置
    ENVIRONMENT: str = "production"
    DEBUG: bool = False
    
    # MongoDB 连接池
    MONGODB_MAX_POOL_SIZE: int = 50
    MONGODB_MIN_POOL_SIZE: int = 10
    
    # 日志级别
    LOG_LEVEL: str = "INFO"
```

**Nginx 缓存配置:**
```nginx
# frontend/nginx.prod.conf
server {
    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    gzip_comp_level 6;
}
```

### 7. 安全加固

**防火墙限制:**
```bash
# 只允许特定 IP 访问 MongoDB 端口
gcloud compute firewall-rules create mongodb-restricted \
  --action=ALLOW \
  --rules=tcp:27017 \
  --source-ranges=YOUR_OFFICE_IP/32 \
  --target-tags=classarranger

# 限制 SSH 访问
gcloud compute firewall-rules create ssh-restricted \
  --action=ALLOW \
  --rules=tcp:22 \
  --source-ranges=YOUR_IP/32
```

**环境变量安全:**
```bash
# 使用 Secret Manager（推荐生产环境）
# 创建 secret
echo -n "your-secret-value" | \
  gcloud secrets create mongodb-password \
  --data-file=-

# 在应用中读取
gcloud secrets versions access latest \
  --secret=mongodb-password
```

---

## 最佳实践总结

### ✅ 开发流程

1. **本地开发** → 使用 `docker-compose up` 启动本地环境
2. **编写代码** → 功能开发和测试
3. **提交代码** → 使用规范的 commit 消息
4. **推送分支** → 推送到 GitHub
5. **创建 PR** → 请求代码审查
6. **合并代码** → 审查通过后合并到 main
7. **自动部署** → GitHub Actions 自动部署到生产环境

### ✅ 部署流程

1. **首次部署** → 使用 Terraform 创建基础设施
2. **日常更新** → 使用 Git-based deployment
3. **紧急回滚** → 使用 rollback 脚本
4. **监控告警** → 配置 Cloud Monitoring

### ✅ 安全检查清单

- [ ] 启用 HTTPS
- [ ] 配置防火墙规则
- [ ] 使用 Secret Manager 管理敏感信息
- [ ] 启用 Cloud Armor（DDoS 防护）
- [ ] 定期更新依赖
- [ ] 配置自动备份
- [ ] 设置访问日志
- [ ] 启用 2FA 认证

### ✅ 性能检查清单

- [ ] 启用 CDN（Cloud CDN）
- [ ] 配置缓存策略
- [ ] 优化 Docker 镜像大小
- [ ] 使用连接池
- [ ] 启用 Gzip 压缩
- [ ] 配置静态资源缓存
- [ ] 数据库索引优化

---

## 快速命令参考

### 本地开发
```bash
docker-compose up                  # 启动所有服务
docker-compose down                # 停止所有服务
docker-compose logs -f             # 查看日志
docker-compose restart backend     # 重启后端
```

### Git 操作
```bash
git checkout -b feature/xxx        # 创建功能分支
git add .                          # 暂存更改
git commit -m "feat: xxx"          # 提交
git push origin feature/xxx        # 推送分支
```

### 部署操作
```bash
./scripts/frequently-used/deploy-git.sh           # Git 部署
./scripts/frequently-used/rollback-git.sh HEAD~1  # 回滚
```

### GCP 操作
```bash
gcloud compute ssh classarranger-vm --zone=asia-northeast1-a  # SSH 到 VM
gcloud compute instances list                      # 列出 VM
gcloud compute firewall-rules list                 # 列出防火墙
```

### Terraform 操作
```bash
terraform plan      # 查看计划
terraform apply     # 应用更改
terraform destroy   # 销毁资源
terraform output    # 查看输出
```

---

## 相关文档

- **[✨ Git 部署指南](./git-deployment-guide.md)** - Git 部署详细说明
- **[🧪 Mock 模式指南](./mock-mode-guide.md)** - 本地开发和测试
- **[💻 本地运行指南](./local-run.md)** - 本地环境设置
- **[📊 部署方案对比](./deployment-comparison.md)** - 选择合适的部署方案

---

## 获取帮助

### 遇到问题？

1. **查看日志**
   ```bash
   gcloud compute ssh classarranger-vm --zone=asia-northeast1-a \
     --command="sudo docker logs classarranger-backend-1 --tail 100"
   ```

2. **检查状态**
   ```bash
   gcloud compute instances describe classarranger-vm --zone=asia-northeast1-a
   ```

3. **查看文档**
   - [本项目文档](./INDEX.md)
   - [Terraform 文档](https://www.terraform.io/docs)
   - [GCP 文档](https://cloud.google.com/docs)

4. **提交 Issue**
   - GitHub Issues: https://github.com/YOUR_USERNAME/ClassArranger/issues

---

**🎉 恭喜！你已经掌握了从零到生产环境的完整部署流程！**

**总结:**
- ✅ **Infrastructure as Code** - Terraform 管理基础设施
- ✅ **Git-based Deployment** - 版本控制的部署方式
- ✅ **团队协作** - GitHub Flow 工作流
- ✅ **CI/CD 自动化** - GitHub Actions 自动部署
- ✅ **故障排查** - 完整的 debug 指南
- ✅ **生产环境优化** - HTTPS、备份、监控
- ✅ **Best Practice** - 行业标准的开发和部署流程
