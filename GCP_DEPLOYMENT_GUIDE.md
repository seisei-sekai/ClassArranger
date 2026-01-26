# GCP Cloud Run 部署完整指南（从零开始）

本指南将帮助你从零开始将 ClassArranger 项目部署到 Google Cloud Platform (GCP) Cloud Run，并通过公网访问。

## 📋 目录

1. [准备工作](#准备工作)
2. [第一步：创建 GCP 账号和项目](#第一步创建-gcp-账号和项目)
3. [第二步：安装必要工具](#第二步安装必要工具)
4. [第三步：配置 GCP 项目](#第三步配置-gcp-项目)
5. [第四步：配置 Firebase](#第四步配置-firebase)
6. [第五步：准备 Docker 镜像](#第五步准备-docker-镜像)
7. [第六步：使用 Terraform 部署](#第六步使用-terraform-部署)
8. [第七步：访问应用](#第七步访问应用)
9. [常见问题](#常见问题)
10. [成本估算](#成本估算)

---

## 准备工作

### 你需要：
- ✅ 一张信用卡（用于 GCP 账号验证，有免费额度）
- ✅ 一个 Google 账号
- ✅ macOS/Linux/Windows 电脑
- ✅ 稳定的网络连接

### 预计时间：
- 首次部署：1-2 小时
- 后续部署：10-15 分钟

---

## 第一步：创建 GCP 账号和项目

### 1.1 创建 GCP 账号

1. 访问：https://cloud.google.com/
2. 点击 **"开始免费使用"** 或 **"Get started for free"**
3. 使用你的 Google 账号登录
4. 填写信息：
   - 国家/地区
   - 服务条款同意
   - 信用卡信息（不会立即扣费，新用户有 $300 免费额度）
5. 完成验证

> 💡 **提示**：新用户会获得 $300 的免费额度，有效期 90 天。

### 1.2 创建新项目

1. 登录 [GCP Console](https://console.cloud.google.com/)
2. 点击顶部导航栏的项目下拉菜单
3. 点击 **"新建项目"** (New Project)
4. 填写项目信息：
   - **项目名称**：`classarranger-app`（可自定义）
   - **项目 ID**：会自动生成，例如 `classarranger-app-123456`
   - **组织**：可留空（个人账号）
5. 点击 **"创建"**
6. **记下你的项目 ID**（后面会用到）

### 1.3 启用计费

1. 在 GCP Console 左侧菜单，找到 **"结算"** (Billing)
2. 选择你的项目
3. 关联你的结算账号
4. 确认计费已启用

---

## 第二步：安装必要工具

### 2.1 安装 Google Cloud SDK

**macOS（使用 Homebrew）：**
```bash
# 安装 Homebrew（如果还没有）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装 gcloud CLI
brew install --cask google-cloud-sdk
```

**Linux：**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

**Windows：**
- 下载安装器：https://cloud.google.com/sdk/docs/install
- 运行安装程序并按照提示操作

**验证安装：**
```bash
gcloud --version
```

### 2.2 安装 Terraform

**macOS：**
```bash
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
```

**Linux：**
```bash
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform
```

**Windows：**
- 下载：https://www.terraform.io/downloads
- 解压并添加到 PATH

**验证安装：**
```bash
terraform --version
```

### 2.3 安装 Docker

- macOS/Windows：下载 [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Linux：
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

**验证安装：**
```bash
docker --version
```

---

## 第三步：配置 GCP 项目

### 3.1 初始化 gcloud

```bash
# 登录 GCP 账号
gcloud auth login

# 设置默认项目（替换为你的项目 ID）
gcloud config set project classarranger-app-123456

# 设置默认区域
gcloud config set compute/region us-central1
```

### 3.2 启用必要的 API

```bash
# 启用所需的 GCP API
gcloud services enable \
  cloudresourcemanager.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  firebase.googleapis.com \
  firestore.googleapis.com \
  secretmanager.googleapis.com
```

这个过程需要 2-5 分钟，请耐心等待。

### 3.3 创建 Artifact Registry 仓库

```bash
# 创建 Docker 仓库
gcloud artifacts repositories create classarranger-images \
  --repository-format=docker \
  --location=us-central1 \
  --description="Docker images for ClassArranger"
```

### 3.4 配置 Docker 认证

```bash
# 配置 Docker 使用 gcloud 认证
gcloud auth configure-docker us-central1-docker.pkg.dev
```

---

## 第四步：配置 Firebase

### 4.1 创建 Firebase 项目

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 点击 **"添加项目"**
3. 选择你刚创建的 GCP 项目：`classarranger-app`
4. 确认 Firebase 计费方案（可以用免费的 Spark 计划）
5. 启用 Google Analytics（可选）
6. 点击 **"创建项目"**

### 4.2 启用 Firebase Authentication

1. 在 Firebase Console 左侧菜单，点击 **"Authentication"**
2. 点击 **"开始使用"**
3. 点击 **"Sign-in method"** 标签
4. 启用 **"电子邮件/密码"** (Email/Password)
5. 点击保存

### 4.3 启用 Firestore Database

1. 在 Firebase Console 左侧菜单，点击 **"Firestore Database"**
2. 点击 **"创建数据库"**
3. 选择 **"生产模式"** (Production mode)
4. 选择位置：**us-central** 或离你最近的区域
5. 点击 **"启用"**

### 4.4 获取 Firebase 配置

1. 在 Firebase Console，点击项目设置（齿轮图标）
2. 选择 **"项目设置"**
3. 滚动到 **"您的应用"** 部分
4. 点击 **"网站"** 图标（</>）添加 Web 应用
5. 输入应用昵称：`ClassArranger Web`
6. 点击 **"注册应用"**
7. **复制 Firebase 配置代码**（记下以下值）：
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```

### 4.5 下载服务账号密钥

1. 在 Firebase Console，进入 **"项目设置"** > **"服务账号"**
2. 点击 **"生成新的私钥"**
3. 下载 JSON 文件
4. 将文件重命名为 `service-account.json`
5. 移动到项目根目录：
   ```bash
   mv ~/Downloads/your-project-firebase-adminsdk-xxxxx.json ./service-account.json
   ```

---

## 第五步：准备 Docker 镜像

### 5.1 配置环境变量

创建 `.env` 文件：

```bash
cd /Users/benz/Desktop/Stanford/SP26/新东方/XDF
cp env.example .env
```

编辑 `.env` 文件，填入你的配置：

```bash
# Firebase Frontend（从第四步获取）
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Firebase Backend
FIREBASE_PROJECT_ID=your-project-id

# OpenAI（可选，如果不需要 AI 功能可以用假值）
OPENAI_API_KEY=sk-your-openai-api-key-here

# GCP Project
GCP_PROJECT_ID=classarranger-app-123456
GCP_REGION=us-central1

# API URL（暂时留空，部署后会更新）
VITE_API_URL=https://backend-xxxxx-uc.a.run.app
```

### 5.2 构建和推送 Docker 镜像

```bash
# 设置项目 ID 变量（替换为你的项目 ID）
export PROJECT_ID=classarranger-app-123456
export REGION=us-central1

# 构建后端镜像
cd backend
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/classarranger-images/backend:latest .
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/classarranger-images/backend:latest

# 回到项目根目录
cd ..

# 构建前端镜像
cd frontend
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/classarranger-images/frontend:latest .
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/classarranger-images/frontend:latest

cd ..
```

---

## 第六步：使用 Terraform 部署

### 6.1 配置 Terraform

```bash
cd terraform

# 复制变量文件
cp terraform.tfvars.example terraform.tfvars

# 编辑 terraform.tfvars
nano terraform.tfvars
```

填入你的配置：
```hcl
project_id = "classarranger-app-123456"
region     = "us-central1"
```

### 6.2 初始化 Terraform

```bash
terraform init
```

### 6.3 预览部署计划

```bash
terraform plan
```

仔细查看将要创建的资源。

### 6.4 执行部署

```bash
terraform apply
```

输入 `yes` 确认部署。

部署完成后，Terraform 会输出两个重要的 URL：
```
frontend_url = "https://frontend-xxxxx-uc.a.run.app"
backend_url = "https://backend-xxxxx-uc.a.run.app"
```

**记下这些 URL！**

### 6.5 更新前端环境变量

用后端 URL 更新前端：

1. 编辑 `.env` 文件：
   ```bash
   VITE_API_URL=https://backend-xxxxx-uc.a.run.app
   ```

2. 重新构建并推送前端镜像：
   ```bash
   cd frontend
   docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/classarranger-images/frontend:latest .
   docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/classarranger-images/frontend:latest
   ```

3. 触发 Cloud Run 重新部署：
   ```bash
   gcloud run deploy frontend \
     --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/classarranger-images/frontend:latest \
     --region ${REGION} \
     --platform managed
   ```

---

## 第七步：访问应用

### 7.1 获取公网 URL

```bash
# 获取前端 URL
gcloud run services describe frontend --region us-central1 --format='value(status.url)'

# 获取后端 URL
gcloud run services describe backend --region us-central1 --format='value(status.url)'
```

### 7.2 测试应用

1. **访问前端 URL**：https://frontend-xxxxx-uc.a.run.app
2. **注册账号**：创建一个测试账号
3. **访问 ClassArranger**：
   - Dashboard：https://frontend-xxxxx-uc.a.run.app/xdf-class-arranger/dashboard
   - 排课功能：https://frontend-xxxxx-uc.a.run.app/xdf-class-arranger/function

### 7.3 配置自定义域名（可选）

如果你有自己的域名：

1. 在 Cloud Run 控制台，选择服务
2. 点击 **"管理自定义域"**
3. 添加域名映射
4. 在你的 DNS 提供商处添加记录

---

## 常见问题

### Q1: 部署失败，显示权限错误

**解决方案**：
```bash
# 授予必要的权限
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="user:your-email@gmail.com" \
  --role="roles/owner"
```

### Q2: Docker 推送失败

**解决方案**：
```bash
# 重新认证
gcloud auth login
gcloud auth configure-docker us-central1-docker.pkg.dev
```

### Q3: 前端无法连接后端

**解决方案**：
1. 检查 `.env` 中的 `VITE_API_URL` 是否正确
2. 确保后端 Cloud Run 服务允许公开访问
3. 检查 CORS 配置

### Q4: Firestore 权限错误

**解决方案**：
1. 检查 `service-account.json` 文件是否正确
2. 确保服务账号有 Firestore 权限：
```bash
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:your-service-account@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/datastore.user"
```

---

## 成本估算

### 免费额度（每月）：
- Cloud Run: 2 百万请求，360,000 GB-秒内存，180,000 vCPU-秒
- Artifact Registry: 0.5 GB 存储
- Firestore: 1 GB 存储，50,000 次读取，20,000 次写入

### 预估成本（超出免费额度后）：
- **轻度使用**（< 10,000 请求/月）：$0 - $5/月
- **中度使用**（< 100,000 请求/月）：$5 - $20/月
- **重度使用**（> 100,000 请求/月）：$20+/月

### 节省成本技巧：
1. 使用最小实例数 = 0（冷启动，但免费）
2. 设置最大实例数限制
3. 使用 Firebase Spark 计划（免费）
4. 定期清理旧的 Docker 镜像

---

## 下一步

- ✅ 设置 CI/CD（自动部署）
- ✅ 配置监控和日志
- ✅ 设置备份策略
- ✅ 添加自定义域名
- ✅ 配置 SSL 证书

---

## 获取帮助

- GCP 文档：https://cloud.google.com/docs
- Cloud Run 文档：https://cloud.google.com/run/docs
- Terraform GCP Provider：https://registry.terraform.io/providers/hashicorp/google/latest/docs
- Firebase 文档：https://firebase.google.com/docs

---

## 快速命令参考

```bash
# 查看服务状态
gcloud run services list

# 查看日志
gcloud run logs read frontend --limit=50
gcloud run logs read backend --limit=50

# 更新服务
gcloud run deploy SERVICE_NAME --image IMAGE_URL

# 删除服务
gcloud run services delete frontend --region us-central1
gcloud run services delete backend --region us-central1

# 销毁所有资源（Terraform）
cd terraform && terraform destroy
```

祝部署顺利！🚀

