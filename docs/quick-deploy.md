# 快速部署指南 - 5步上线

**Created:** 2026-01-22
**Last Updated:** 2026-01-22
**Purpose:** 快速将 ClassArranger 项目部署到 GCP Cloud Run 的简化指南

---

如果你想快速部署而不阅读完整文档，按照以下步骤操作：

## ⚡ 5分钟快速开始

### 前提条件
- ✅ 已有 GCP 账号
- ✅ 已有 Firebase 项目
- ✅ 已安装 gcloud、docker、terraform

---

## 第1步：配置环境变量（2分钟）

```bash
# 复制环境变量模板
cp env.example .env

# 编辑 .env，填入你的配置
nano .env
```

必须填写的配置：
```bash
# GCP
GCP_PROJECT_ID=你的项目ID
GCP_REGION=asia-northeast1  # 东京区域

# Firebase（从 Firebase Console 获取）
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
```

---

## 第2步：初始化 GCP（1分钟）

```bash
# 登录
gcloud auth login

# 设置项目
gcloud config set project 你的项目ID

# 启用 API（一次性）
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com

# 创建 Docker 仓库（一次性）
gcloud artifacts repositories create classarranger-images \
  --repository-format=docker \
  --location=asia-northeast1 \  # 东京区域
  --description="ClassArranger Docker images"

# 配置 Docker 认证
gcloud auth configure-docker asia-northeast1-docker.pkg.dev
```

---

## 第3步：配置 Terraform（1分钟）

```bash
cd terraform

# 复制配置文件
cp terraform.tfvars.example terraform.tfvars

# 编辑 terraform.tfvars
nano terraform.tfvars
```

填入你的信息：
```hcl
project_id = "你的项目ID"
region     = "asia-northeast1"  # 东京区域
firebase_api_key = "你的Firebase API Key"
firebase_auth_domain = "xxx.firebaseapp.com"
firebase_storage_bucket = "xxx.appspot.com"
firebase_messaging_sender_id = "xxx"
firebase_app_id = "xxx"
```

---

## 第4步：构建并推送镜像（3-5分钟）

```bash
# 回到项目根目录
cd ..

# 设置变量
export PROJECT_ID=你的项目ID
export REGION=asia-northeast1  # 东京区域
export REPO_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/classarranger-images"

# 构建后端
docker build -t ${REPO_URL}/backend:latest -f backend/Dockerfile.prod backend/
docker push ${REPO_URL}/backend:latest

# 构建前端（需要先填入环境变量）
docker build -t ${REPO_URL}/frontend:latest \
  --build-arg VITE_API_URL=https://backend-xxxxx.run.app \
  --build-arg VITE_FIREBASE_API_KEY=xxx \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com \
  --build-arg VITE_FIREBASE_PROJECT_ID=xxx \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET=xxx.appspot.com \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID=xxx \
  --build-arg VITE_FIREBASE_APP_ID=xxx \
  -f frontend/Dockerfile.prod frontend/
docker push ${REPO_URL}/frontend:latest
```

---

## 第5步：部署（2分钟）

```bash
cd terraform

# 初始化 Terraform
terraform init

# 预览
terraform plan

# 部署
terraform apply

# 输入 yes 确认
```

部署完成后，你会看到：
```
frontend_url = "https://frontend-xxxxx.a.run.app"
backend_url = "https://backend-xxxxx.a.run.app"
```

---

## ✅ 完成！

访问你的应用：**https://frontend-xxxxx.a.run.app**

### 访问 ClassArranger：
- **https://frontend-xxxxx.a.run.app/xdf-class-arranger**

---

## 🔧 更新部署

如果代码有修改，重新构建并推送镜像即可：

```bash
# 构建新镜像
docker build -t ${REPO_URL}/frontend:latest -f frontend/Dockerfile.prod frontend/
docker push ${REPO_URL}/frontend:latest

# Cloud Run 会自动使用新镜像（或手动触发）
gcloud run deploy classarranger-frontend \
  --image ${REPO_URL}/frontend:latest \
  --region asia-northeast1  # 东京区域
```

---

## 💰 成本

使用 Cloud Run 的免费额度：
- **每月 200 万请求免费**
- 预计成本：$0-5/月（轻度使用）

---

## 🆘 遇到问题？

查看完整文档：`docs/gcp-deployment-guide.md`

或运行快速诊断：
```bash
# 查看服务状态
gcloud run services list

# 查看日志
gcloud run logs read classarranger-frontend --limit=50
gcloud run logs read classarranger-backend --limit=50
```

---

## 📝 自动化脚本

使用一键部署脚本：
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

