#!/bin/bash

# ClassArranger Mock版本一键部署脚本
# 适用于小白用户，不需要Firebase和OpenAI API

set -e  # 遇到错误立即退出

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════╗
║                                                   ║
║       ClassArranger Mock 版本一键部署             ║
║                                                   ║
║   无需 Firebase | 无需 OpenAI | 只需 MongoDB     ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# 检查必需变量
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ 错误: 请先设置 PROJECT_ID 环境变量${NC}"
    echo ""
    echo "使用方法："
    echo "  export PROJECT_ID='your-gcp-project-id'"
    echo "  export MONGODB_URL='your-mongodb-connection-string'"
    echo "  ./scripts/mock-deploy.sh"
    exit 1
fi

if [ -z "$MONGODB_URL" ]; then
    echo -e "${RED}❌ 错误: 请先设置 MONGODB_URL 环境变量${NC}"
    echo ""
    echo "从 MongoDB Atlas 获取连接字符串："
    echo "  https://www.mongodb.com/cloud/atlas"
    exit 1
fi

REGION=${REGION:-asia-northeast1}  # 东京区域

echo -e "${GREEN}==================================="
echo "📋 部署配置"
echo "===================================${NC}"
echo "项目ID: $PROJECT_ID"
echo "区域: $REGION"
echo "模式: Mock (无需Firebase和OpenAI)"
echo "数据库: MongoDB Atlas"
echo ""

# 确认
read -p "确认开始部署？(y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 已取消"
    exit 1
fi

echo ""
echo -e "${GREEN}开始部署...${NC}"
echo ""

# 1. 设置项目
echo -e "${YELLOW}[1/9] 设置GCP项目...${NC}"
gcloud config set project $PROJECT_ID
echo "✅ 项目设置完成"
echo ""

# 2. 启用API
echo -e "${YELLOW}[2/9] 启用必要的API (大约需要2-3分钟)...${NC}"
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  --quiet

echo "✅ API启用完成"
echo ""

# 3. 创建Artifact Registry
echo -e "${YELLOW}[3/9] 创建镜像仓库...${NC}"
if gcloud artifacts repositories describe classarranger-images --location=$REGION &>/dev/null; then
    echo "ℹ️  仓库已存在，跳过创建"
else
    gcloud artifacts repositories create classarranger-images \
      --repository-format=docker \
      --location=$REGION \
      --description="Docker images for ClassArranger" \
      --quiet
    echo "✅ 仓库创建完成"
fi
echo ""

# 4. 配置Docker
echo -e "${YELLOW}[4/9] 配置Docker认证...${NC}"
gcloud auth configure-docker $REGION-docker.pkg.dev --quiet
echo "✅ Docker认证配置完成"
echo ""

# 5. 创建Secret
echo -e "${YELLOW}[5/9] 创建MongoDB Secret...${NC}"
if gcloud secrets describe mongodb-url &>/dev/null; then
    echo "ℹ️  Secret已存在，更新版本..."
    echo -n "$MONGODB_URL" | gcloud secrets versions add mongodb-url --data-file=- --quiet
else
    echo -n "$MONGODB_URL" | gcloud secrets create mongodb-url \
      --data-file=- \
      --replication-policy="automatic" \
      --quiet
fi
echo "✅ Secret创建完成"
echo ""

# 6. 构建并部署后端
echo -e "${YELLOW}[6/9] 构建后端Docker镜像 (大约需要3-5分钟)...${NC}"
cd backend
docker build -t $REGION-docker.pkg.dev/$PROJECT_ID/classarranger-images/backend:latest -f Dockerfile.prod . --quiet
echo "✅ 后端镜像构建完成"
echo ""

echo -e "${YELLOW}推送后端镜像到GCP...${NC}"
docker push $REGION-docker.pkg.dev/$PROJECT_ID/classarranger-images/backend:latest
echo "✅ 后端镜像推送完成"
echo ""

echo -e "${YELLOW}[7/9] 部署后端到Cloud Run...${NC}"
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
  --max-instances 10 \
  --quiet

BACKEND_URL=$(gcloud run services describe classarranger-backend --region $REGION --format='value(status.url)')
echo -e "✅ 后端部署完成: ${GREEN}$BACKEND_URL${NC}"
echo ""

# 测试后端
echo -e "${YELLOW}测试后端健康状态...${NC}"
if curl -s -f "$BACKEND_URL/health" > /dev/null; then
    echo "✅ 后端健康检查通过"
else
    echo -e "${RED}⚠️  后端健康检查失败，但继续部署...${NC}"
fi
echo ""

# 7. 构建并部署前端
echo -e "${YELLOW}[8/9] 构建前端Docker镜像 (大约需要5-8分钟)...${NC}"
cd ../frontend
docker build \
  --build-arg VITE_API_URL=$BACKEND_URL \
  --build-arg VITE_USE_MOCK_AUTH=true \
  -t $REGION-docker.pkg.dev/$PROJECT_ID/classarranger-images/frontend:latest \
  -f Dockerfile.prod . \
  --quiet
echo "✅ 前端镜像构建完成"
echo ""

echo -e "${YELLOW}推送前端镜像到GCP...${NC}"
docker push $REGION-docker.pkg.dev/$PROJECT_ID/classarranger-images/frontend:latest
echo "✅ 前端镜像推送完成"
echo ""

echo -e "${YELLOW}[9/9] 部署前端到Cloud Run...${NC}"
gcloud run deploy classarranger-frontend \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/classarranger-images/frontend:latest \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 256Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5 \
  --quiet

FRONTEND_URL=$(gcloud run services describe classarranger-frontend --region $REGION --format='value(status.url)')
echo -e "✅ 前端部署完成: ${GREEN}$FRONTEND_URL${NC}"
echo ""

# 测试前端
echo -e "${YELLOW}测试前端访问...${NC}"
if curl -s -f "$FRONTEND_URL" > /dev/null; then
    echo "✅ 前端访问测试通过"
else
    echo -e "${RED}⚠️  前端访问测试失败，但部署已完成${NC}"
fi
echo ""

# 8. 完成
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════╗
║                                                   ║
║             🎉 部署成功！                          ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${BLUE}==================================="
echo "📱 访问信息"
echo "===================================${NC}"
echo ""
echo -e "${GREEN}后端API:${NC}"
echo "  $BACKEND_URL"
echo ""
echo -e "${GREEN}前端应用:${NC}"
echo "  $FRONTEND_URL"
echo ""
echo -e "${BLUE}==================================="
echo "🔑 测试账号 (Mock模式)"
echo "===================================${NC}"
echo ""
echo "账号1:"
echo "  邮箱: test@example.com"
echo "  密码: password"
echo ""
echo "账号2:"
echo "  邮箱: admin@example.com"
echo "  密码: admin123"
echo ""
echo -e "${BLUE}==================================="
echo "📊 后续操作"
echo "===================================${NC}"
echo ""
echo "1. 查看后端日志:"
echo "   gcloud run services logs read classarranger-backend --region $REGION --limit 50"
echo ""
echo "2. 查看前端日志:"
echo "   gcloud run services logs read classarranger-frontend --region $REGION --limit 50"
echo ""
echo "3. 更新应用:"
echo "   重新运行此脚本即可"
echo ""
echo "4. 删除应用:"
echo "   gcloud run services delete classarranger-backend --region $REGION"
echo "   gcloud run services delete classarranger-frontend --region $REGION"
echo ""
echo -e "${GREEN}==================================="
echo "🎊 现在可以访问你的应用了！"
echo "===================================${NC}"
echo ""
echo -e "打开浏览器访问: ${BLUE}$FRONTEND_URL${NC}"
echo ""

