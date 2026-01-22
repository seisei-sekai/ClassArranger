#!/bin/bash

# GCP 初始化设置脚本
# 使用方法: ./scripts/setup-gcp.sh

set -e

echo "🔧 GCP 初始化设置"
echo "=================="

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 检查 gcloud
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ 错误: gcloud CLI 未安装${NC}"
    echo "请访问 https://cloud.google.com/sdk/docs/install 安装"
    exit 1
fi

# 读取项目 ID
echo -e "${YELLOW}请输入你的 GCP 项目 ID:${NC}"
read -r PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ 项目 ID 不能为空${NC}"
    exit 1
fi

echo -e "${YELLOW}请输入区域 (默认: asia-northeast1 东京):${NC}"
read -r REGION
REGION=${REGION:-asia-northeast1}

echo -e "\n${YELLOW}📝 配置信息:${NC}"
echo "项目 ID: $PROJECT_ID"
echo "区域: $REGION"
echo ""
echo -e "${YELLOW}是否继续? (yes/no)${NC}"
read -r response

if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "已取消"
    exit 0
fi

# 登录
echo -e "\n${YELLOW}🔐 登录 GCP...${NC}"
gcloud auth login

# 设置项目
echo -e "\n${YELLOW}🔧 设置项目...${NC}"
gcloud config set project $PROJECT_ID
gcloud config set compute/region $REGION

# 启用 API
echo -e "\n${YELLOW}🔌 启用必要的 API...${NC}"
gcloud services enable \
  cloudresourcemanager.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  firebase.googleapis.com \
  firestore.googleapis.com

echo -e "${GREEN}✅ API 已启用${NC}"

# 创建 Artifact Registry
echo -e "\n${YELLOW}📦 创建 Artifact Registry 仓库...${NC}"
if gcloud artifacts repositories describe classarranger-images --location=$REGION &>/dev/null; then
    echo -e "${YELLOW}仓库已存在，跳过创建${NC}"
else
    gcloud artifacts repositories create classarranger-images \
      --repository-format=docker \
      --location=$REGION \
      --description="Docker images for ClassArranger"
    echo -e "${GREEN}✅ Artifact Registry 仓库已创建${NC}"
fi

# 配置 Docker 认证
echo -e "\n${YELLOW}🐳 配置 Docker 认证...${NC}"
gcloud auth configure-docker ${REGION}-docker.pkg.dev
echo -e "${GREEN}✅ Docker 认证已配置${NC}"

# 创建 .env 文件模板
echo -e "\n${YELLOW}📝 更新 .env 文件...${NC}"
if [ ! -f ".env" ]; then
    cp env.example .env
    echo -e "${YELLOW}已创建 .env 文件，请编辑填入你的 Firebase 配置${NC}"
fi

# 更新 .env 文件中的 GCP 配置
sed -i.bak "s/^GCP_PROJECT_ID=.*/GCP_PROJECT_ID=$PROJECT_ID/" .env
sed -i.bak "s/^GCP_REGION=.*/GCP_REGION=$REGION/" .env
rm .env.bak

echo -e "${GREEN}✅ .env 文件已更新${NC}"

# 显示下一步
echo -e "\n${GREEN}✨ GCP 初始化完成！${NC}"
echo -e "\n${YELLOW}📋 下一步:${NC}"
echo "1. 编辑 .env 文件，填入你的 Firebase 配置"
echo "2. 确保 service-account.json 文件存在"
echo "3. 运行 ./scripts/deploy.sh 进行部署"
echo ""
echo -e "${YELLOW}💡 提示:${NC}"
echo "- 项目 ID: $PROJECT_ID"
echo "- 区域: $REGION"
echo "- Artifact Registry: ${REGION}-docker.pkg.dev/${PROJECT_ID}/classarranger-images"

