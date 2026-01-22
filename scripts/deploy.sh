#!/bin/bash

# ClassArranger GCP Deployment Script
# 使用方法: ./scripts/deploy.sh

set -e

echo "🚀 ClassArranger GCP 部署脚本"
echo "=============================="

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查必要的工具
echo -e "\n${YELLOW}📋 检查必要工具...${NC}"
command -v gcloud >/dev/null 2>&1 || { echo -e "${RED}❌ 错误: 需要安装 gcloud CLI${NC}"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo -e "${RED}❌ 错误: 需要安装 Docker${NC}"; exit 1; }
command -v terraform >/dev/null 2>&1 || { echo -e "${RED}❌ 错误: 需要安装 Terraform${NC}"; exit 1; }
echo -e "${GREEN}✅ 所有工具已安装${NC}"

# 读取项目配置
echo -e "\n${YELLOW}📝 读取项目配置...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ 错误: .env 文件不存在${NC}"
    echo "请从 env.example 复制并配置 .env 文件"
    exit 1
fi

# 从 .env 文件读取配置
export $(cat .env | grep -v '^#' | xargs)

if [ -z "$GCP_PROJECT_ID" ]; then
    echo -e "${RED}❌ 错误: .env 中未设置 GCP_PROJECT_ID${NC}"
    exit 1
fi

if [ -z "$GCP_REGION" ]; then
    echo -e "${YELLOW}⚠️  警告: 未设置 GCP_REGION，使用默认值 asia-northeast1 (东京)${NC}"
    export GCP_REGION="asia-northeast1"
fi

echo -e "${GREEN}✅ 项目 ID: $GCP_PROJECT_ID${NC}"
echo -e "${GREEN}✅ 区域: $GCP_REGION${NC}"

# 设置 gcloud 项目
echo -e "\n${YELLOW}🔧 配置 gcloud...${NC}"
gcloud config set project $GCP_PROJECT_ID
gcloud config set compute/region $GCP_REGION

# 检查服务账号文件
if [ ! -f "service-account.json" ]; then
    echo -e "${RED}❌ 错误: service-account.json 文件不存在${NC}"
    echo "请从 Firebase Console 下载服务账号密钥"
    exit 1
fi

# 构建和推送 Docker 镜像
echo -e "\n${YELLOW}🐳 构建 Docker 镜像...${NC}"

REPO_URL="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/classarranger-images"

echo -e "${YELLOW}构建后端镜像...${NC}"
docker build -t ${REPO_URL}/backend:latest -f backend/Dockerfile.prod backend/
echo -e "${GREEN}✅ 后端镜像构建完成${NC}"

echo -e "\n${YELLOW}构建前端镜像...${NC}"
docker build -t ${REPO_URL}/frontend:latest \
  --build-arg VITE_API_URL=${VITE_API_URL} \
  --build-arg VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY} \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN} \
  --build-arg VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID} \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET} \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID=${VITE_FIREBASE_MESSAGING_SENDER_ID} \
  --build-arg VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID} \
  -f frontend/Dockerfile.prod frontend/
echo -e "${GREEN}✅ 前端镜像构建完成${NC}"

# 推送镜像
echo -e "\n${YELLOW}📤 推送镜像到 Artifact Registry...${NC}"
docker push ${REPO_URL}/backend:latest
echo -e "${GREEN}✅ 后端镜像已推送${NC}"

docker push ${REPO_URL}/frontend:latest
echo -e "${GREEN}✅ 前端镜像已推送${NC}"

# Terraform 部署
echo -e "\n${YELLOW}🏗️  使用 Terraform 部署...${NC}"
cd terraform

if [ ! -f "terraform.tfvars" ]; then
    echo -e "${RED}❌ 错误: terraform.tfvars 文件不存在${NC}"
    echo "请从 terraform.tfvars.example 复制并配置"
    exit 1
fi

terraform init
terraform plan
echo -e "\n${YELLOW}是否继续部署? (yes/no)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    terraform apply -auto-approve
    echo -e "${GREEN}✅ 部署完成！${NC}"
    
    # 获取服务 URL
    BACKEND_URL=$(terraform output -raw backend_url)
    FRONTEND_URL=$(terraform output -raw frontend_url)
    
    echo -e "\n${GREEN}🎉 部署成功！${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}前端 URL: $FRONTEND_URL${NC}"
    echo -e "${GREEN}后端 URL: $BACKEND_URL${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "\n${YELLOW}💡 提示: 如果前端无法连接后端，请更新 .env 文件中的 VITE_API_URL 并重新部署前端${NC}"
else
    echo -e "${YELLOW}部署已取消${NC}"
fi

cd ..

echo -e "\n${GREEN}✨ 完成！${NC}"

