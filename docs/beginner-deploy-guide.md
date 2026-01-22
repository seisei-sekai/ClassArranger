# 小白部署指南 - 从零到公网访问

**Created:** 2026-01-22  
**Last Updated:** 2026-01-22  
**Purpose:** 完全零基础的GCP Cloud Run部署指南，使用Mock数据，无需Firebase和OpenAI API

---

## 📋 目录

1. [准备工作](#准备工作)
2. [第一步：注册MongoDB Atlas（免费数据库）](#第一步注册mongodb-atlas免费数据库)
3. [第二步：准备GCP环境](#第二步准备gcp环境)
4. [第三步：本地测试（可选）](#第三步本地测试可选)
5. [第四步：部署到GCP](#第四步部署到gcp)
6. [第五步：访问你的应用](#第五步访问你的应用)
7. [常见问题](#常见问题)

---

## 准备工作

### 你需要准备：

- ✅ GCP账号（已绑定信用卡）
- ✅ 一台电脑（Mac/Windows/Linux都可以）
- ✅ 稳定的网络连接
- ✅ 1-2小时的时间

### 费用说明：

- **MongoDB Atlas**: 免费版（512MB存储，够用了）
- **GCP Cloud Run**: 
  - 每月免费额度：200万次请求
  - 超出后约 $0.40/百万次请求
  - **预计月费用**: $0-5（取决于访问量）

---

## 第一步：注册MongoDB Atlas（免费数据库）

### 1.1 创建账号

1. 访问 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. 使用Google账号或邮箱注册
3. 验证邮箱

### 1.2 创建免费集群

1. 登录后，点击 **"Build a Database"**
2. 选择 **"M0 FREE"** 计划（永久免费）
3. 选择云服务商：**Google Cloud**
4. 选择区域：**us-central1 (Iowa)** 或离你最近的区域
5. 集群名称：`ClassArrangerCluster`（可自定义）
6. 点击 **"Create"**

⏰ **等待2-3分钟**，集群创建中...

### 1.3 配置网络访问

1. 左侧菜单点击 **"Network Access"**
2. 点击 **"Add IP Address"**
3. 选择 **"Allow Access from Anywhere"** (0.0.0.0/0)
   - ⚠️ 这是为了简化，生产环境应该限制IP
4. 点击 **"Confirm"**

### 1.4 创建数据库用户

1. 左侧菜单点击 **"Database Access"**
2. 点击 **"Add New Database User"**
3. 填写信息：
   - Username: `classarranger_user`
   - Password: 点击 **"Autogenerate Secure Password"**
   - ⚠️ **复制密码并保存到记事本**
4. Database User Privileges: **"Atlas admin"**
5. 点击 **"Add User"**

### 1.5 获取连接字符串

1. 回到 **"Database"** 页面
2. 点击你的集群的 **"Connect"**
3. 选择 **"Drivers"**
4. 选择 Driver: **"Python"**, Version: **"3.12 or later"**
5. 复制连接字符串，格式如下：
   ```
   mongodb+srv://classarranger_user:<password>@classarrangercluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **将 `<password>` 替换为你刚才保存的密码**
7. **保存这个完整的连接字符串到记事本**

✅ **MongoDB设置完成！**

---

## 第二步：准备GCP环境

### 2.1 安装Google Cloud CLI

**Mac（使用Homebrew）:**
```bash
brew install google-cloud-sdk
```

**Windows:**
1. 下载安装器：https://cloud.google.com/sdk/docs/install
2. 运行安装程序，按默认选项安装

**Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### 2.2 登录GCP

打开终端（Mac/Linux）或命令提示符（Windows），运行：

```bash
# 登录GCP
gcloud auth login
```

浏览器会打开，选择你的Google账号登录。

### 2.3 创建GCP项目

```bash
# 创建项目（项目ID必须全球唯一）
gcloud projects create classarranger-app-$(date +%s) --name="ClassArranger"

# 查看项目ID（复制下来）
gcloud projects list --filter="name:ClassArranger"
```

记下你的 **PROJECT_ID**（类似 `classarranger-app-1234567890`）

### 2.4 设置项目和启用计费

```bash
# 设置默认项目（替换为你的PROJECT_ID）
gcloud config set project YOUR_PROJECT_ID

# 列出计费账号
gcloud billing accounts list

# 将计费账号关联到项目（替换为你的BILLING_ACCOUNT_ID）
gcloud billing projects link YOUR_PROJECT_ID --billing-account=YOUR_BILLING_ACCOUNT_ID
```

### 2.5 启用必要的API

```bash
# 启用所需的API（需要2-5分钟）
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com
```

⏰ **等待API启用完成...**

### 2.6 创建Artifact Registry（存放Docker镜像）

```bash
# 创建Docker仓库
gcloud artifacts repositories create classarranger-images \
  --repository-format=docker \
  --location=us-central1 \
  --description="Docker images for ClassArranger"

# 配置Docker认证
gcloud auth configure-docker us-central1-docker.pkg.dev
```

✅ **GCP环境准备完成！**

---

## 第三步：本地测试（可选）

如果你想先在本地测试，可以跳过这一步直接部署到GCP。

### 3.1 克隆/下载项目代码

```bash
# 如果你已经有代码，进入项目目录
cd /path/to/your/ClassArranger

# 如果从GitHub克隆
git clone https://github.com/seisei-sekai/ClassArranger.git
cd ClassArranger
```

### 3.2 配置环境变量

创建 `.env` 文件：

```bash
cat > .env << 'EOF'
# MongoDB连接（使用你的MongoDB Atlas连接字符串）
MONGODB_URL=mongodb+srv://classarranger_user:YOUR_PASSWORD@classarrangercluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=xdf_class_arranger

# Mock模式（不需要Firebase和OpenAI）
DEV_MODE=true
USE_MOCK_AUTH=true
USE_MOCK_AI=true

# API设置
API_HOST=0.0.0.0
API_PORT=8000
EOF
```

⚠️ **记得替换MongoDB连接字符串！**

### 3.3 使用Docker Compose测试

```bash
# 启动服务
docker-compose up --build

# 在另一个终端测试
curl http://localhost:8000/health
# 应该返回: {"status":"healthy"}

# 访问前端
open http://localhost:5173
```

如果一切正常，按 `Ctrl+C` 停止服务。

✅ **本地测试成功！**

---

## 第四步：部署到GCP

### 4.1 设置环境变量

```bash
# 设置项目变量（替换为你的值）
export PROJECT_ID="your-project-id"
export REGION="us-central1"
export MONGODB_URL="your-mongodb-connection-string"
```

### 4.2 创建Secret（保存敏感信息）

```bash
# 将MongoDB连接字符串保存为secret
echo -n "$MONGODB_URL" | gcloud secrets create mongodb-url \
  --data-file=- \
  --replication-policy="automatic"

# 验证
gcloud secrets describe mongodb-url
```

### 4.3 构建并推送后端镜像

```bash
# 进入后端目录
cd backend

# 构建Docker镜像
docker build -t us-central1-docker.pkg.dev/$PROJECT_ID/classarranger-images/backend:latest -f Dockerfile.prod .

# 推送到Artifact Registry
docker push us-central1-docker.pkg.dev/$PROJECT_ID/classarranger-images/backend:latest
```

⏰ **等待镜像上传（1-3分钟）...**

### 4.4 部署后端到Cloud Run

```bash
# 部署后端服务
gcloud run deploy classarranger-backend \
  --image us-central1-docker.pkg.dev/$PROJECT_ID/classarranger-images/backend:latest \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars DEV_MODE=true,USE_MOCK_AUTH=true,USE_MOCK_AI=true,MONGODB_DB_NAME=xdf_class_arranger \
  --set-secrets MONGODB_URL=mongodb-url:latest \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10

# 获取后端URL
BACKEND_URL=$(gcloud run services describe classarranger-backend --region $REGION --format='value(status.url)')
echo "后端URL: $BACKEND_URL"
```

✅ **测试后端**
```bash
curl $BACKEND_URL/health
# 应该返回: {"status":"healthy"}
```

### 4.5 构建并推送前端镜像

```bash
# 回到项目根目录
cd ..

# 进入前端目录
cd frontend

# 构建Docker镜像（传入后端URL）
docker build \
  --build-arg VITE_API_URL=$BACKEND_URL \
  --build-arg VITE_USE_MOCK_AUTH=true \
  -t us-central1-docker.pkg.dev/$PROJECT_ID/classarranger-images/frontend:latest \
  -f Dockerfile.prod .

# 推送镜像
docker push us-central1-docker.pkg.dev/$PROJECT_ID/classarranger-images/frontend:latest
```

### 4.6 部署前端到Cloud Run

```bash
# 部署前端服务
gcloud run deploy classarranger-frontend \
  --image us-central1-docker.pkg.dev/$PROJECT_ID/classarranger-images/frontend:latest \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 256Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5

# 获取前端URL
FRONTEND_URL=$(gcloud run services describe classarranger-frontend --region $REGION --format='value(status.url)')
echo "前端URL: $FRONTEND_URL"
```

✅ **部署完成！**

---

## 第五步：访问你的应用

### 5.1 获取访问地址

```bash
# 显示所有URL
echo "==================================="
echo "🎉 部署成功！"
echo "==================================="
echo "后端API: $BACKEND_URL"
echo "前端应用: $FRONTEND_URL"
echo "==================================="
echo ""
echo "访问应用："
echo "$FRONTEND_URL"
```

### 5.2 测试功能

1. **打开浏览器**，访问前端URL
2. **测试登录**（Mock模式，任意邮箱密码都可以）
   - Email: `test@example.com`
   - Password: `password`
3. **测试功能**
   - Dashboard
   - 排课功能
   - 日历视图

### 5.3 查看日志（如果有问题）

```bash
# 查看后端日志
gcloud run services logs read classarranger-backend --region $REGION --limit 50

# 查看前端日志
gcloud run services logs read classarranger-frontend --region $REGION --limit 50
```

---

## 常见问题

### Q1: 构建镜像时提示权限错误？

```bash
# 重新认证Docker
gcloud auth configure-docker us-central1-docker.pkg.dev
```

### Q2: Cloud Run部署失败？

检查：
1. 是否启用了计费
2. 是否启用了所有必需的API
3. 查看日志：`gcloud run services logs read SERVICE_NAME`

### Q3: 前端无法连接后端？

检查：
1. 后端URL是否正确
2. CORS设置是否正确
3. 后端是否允许公开访问

### Q4: MongoDB连接失败？

检查：
1. 网络访问是否设置为 0.0.0.0/0
2. 数据库用户密码是否正确
3. 连接字符串格式是否正确

### Q5: 如何更新应用？

```bash
# 重新构建并推送镜像
docker build -t us-central1-docker.pkg.dev/$PROJECT_ID/classarranger-images/backend:latest .
docker push us-central1-docker.pkg.dev/$PROJECT_ID/classarranger-images/backend:latest

# Cloud Run会自动使用新镜像（或手动触发）
gcloud run services update classarranger-backend --region $REGION
```

### Q6: 如何删除所有资源（省钱）？

```bash
# 删除Cloud Run服务
gcloud run services delete classarranger-backend --region $REGION
gcloud run services delete classarranger-frontend --region $REGION

# 删除镜像仓库
gcloud artifacts repositories delete classarranger-images --location $REGION

# 删除Secrets
gcloud secrets delete mongodb-url

# 删除项目（会删除所有资源）
gcloud projects delete $PROJECT_ID
```

---

## 🎯 快速部署脚本（一键部署）

保存为 `quick-deploy.sh`:

```bash
#!/bin/bash

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查必需变量
if [ -z "$PROJECT_ID" ] || [ -z "$MONGODB_URL" ]; then
    echo -e "${RED}错误: 请先设置环境变量${NC}"
    echo "export PROJECT_ID='your-project-id'"
    echo "export MONGODB_URL='your-mongodb-connection-string'"
    exit 1
fi

REGION=${REGION:-us-central1}

echo -e "${GREEN}==================================="
echo "ClassArranger 一键部署"
echo "===================================${NC}"
echo "项目ID: $PROJECT_ID"
echo "区域: $REGION"
echo ""

# 1. 设置项目
echo -e "${YELLOW}[1/8] 设置GCP项目...${NC}"
gcloud config set project $PROJECT_ID

# 2. 启用API
echo -e "${YELLOW}[2/8] 启用必要的API...${NC}"
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com

# 3. 创建Artifact Registry
echo -e "${YELLOW}[3/8] 创建镜像仓库...${NC}"
gcloud artifacts repositories create classarranger-images \
  --repository-format=docker \
  --location=$REGION \
  --description="Docker images for ClassArranger" \
  2>/dev/null || echo "仓库已存在，跳过"

# 4. 配置Docker
echo -e "${YELLOW}[4/8] 配置Docker认证...${NC}"
gcloud auth configure-docker $REGION-docker.pkg.dev

# 5. 创建Secret
echo -e "${YELLOW}[5/8] 创建MongoDB Secret...${NC}"
echo -n "$MONGODB_URL" | gcloud secrets create mongodb-url \
  --data-file=- \
  --replication-policy="automatic" \
  2>/dev/null || gcloud secrets versions add mongodb-url --data-file=-

# 6. 构建并部署后端
echo -e "${YELLOW}[6/8] 构建并部署后端...${NC}"
cd backend
docker build -t $REGION-docker.pkg.dev/$PROJECT_ID/classarranger-images/backend:latest -f Dockerfile.prod .
docker push $REGION-docker.pkg.dev/$PROJECT_ID/classarranger-images/backend:latest

gcloud run deploy classarranger-backend \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/classarranger-images/backend:latest \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars DEV_MODE=true,USE_MOCK_AUTH=true,USE_MOCK_AI=true,MONGODB_DB_NAME=xdf_class_arranger \
  --set-secrets MONGODB_URL=mongodb-url:latest \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10

BACKEND_URL=$(gcloud run services describe classarranger-backend --region $REGION --format='value(status.url)')
echo -e "${GREEN}后端URL: $BACKEND_URL${NC}"

# 7. 构建并部署前端
echo -e "${YELLOW}[7/8] 构建并部署前端...${NC}"
cd ../frontend
docker build \
  --build-arg VITE_API_URL=$BACKEND_URL \
  --build-arg VITE_USE_MOCK_AUTH=true \
  -t $REGION-docker.pkg.dev/$PROJECT_ID/classarranger-images/frontend:latest \
  -f Dockerfile.prod .
docker push $REGION-docker.pkg.dev/$PROJECT_ID/classarranger-images/frontend:latest

gcloud run deploy classarranger-frontend \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/classarranger-images/frontend:latest \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 256Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5

FRONTEND_URL=$(gcloud run services describe classarranger-frontend --region $REGION --format='value(status.url)')

# 8. 完成
echo -e "${GREEN}==================================="
echo "🎉 部署成功！"
echo "===================================${NC}"
echo "后端API: $BACKEND_URL"
echo "前端应用: $FRONTEND_URL"
echo ""
echo "测试后端: curl $BACKEND_URL/health"
echo "访问应用: open $FRONTEND_URL"
echo -e "${GREEN}===================================${NC}"
```

使用方法：

```bash
# 设置环境变量
export PROJECT_ID="your-project-id"
export MONGODB_URL="your-mongodb-connection-string"

# 运行脚本
chmod +x quick-deploy.sh
./quick-deploy.sh
```

---

## 📚 下一步

部署成功后，你可以：

1. **设置自定义域名**
   - 在Cloud Run控制台添加自定义域名
   - 配置DNS记录

2. **启用HTTPS**
   - Cloud Run自动提供HTTPS证书

3. **监控和日志**
   - 使用Cloud Logging查看日志
   - 使用Cloud Monitoring监控性能

4. **扩展功能**
   - 替换Mock认证为真实的JWT认证
   - 集成真实的AI API
   - 添加更多业务功能

5. **优化成本**
   - 设置合理的min-instances和max-instances
   - 使用Cloud Scheduler定期唤醒服务（避免冷启动）

---

## 💡 小贴士

1. **第一次部署需要10-15分钟**，不要着急
2. **Cloud Run的镜像构建可能比较慢**，耐心等待
3. **保存好所有的URL和密码**，建议用密码管理器
4. **定期查看账单**，避免意外费用
5. **使用min-instances=0可以节省成本**，但会有冷启动延迟

---

## 🆘 需要帮助？

如果遇到问题：

1. 查看本文档的"常见问题"部分
2. 查看Cloud Run日志
3. 在GitHub Issues提问
4. 联系项目维护者

---

**祝你部署成功！🚀**

