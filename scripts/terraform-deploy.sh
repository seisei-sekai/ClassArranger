#!/bin/bash

# ClassArranger Terraform 部署脚本
# 使用Terraform自动化部署到GCP VM

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Banner
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════╗
║                                                   ║
║       ClassArranger Terraform 自动部署            ║
║                                                   ║
║   Infrastructure as Code (IaC)                    ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# 检查Terraform是否安装
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}❌ Terraform未安装${NC}"
    echo ""
    echo "请安装Terraform:"
    echo "  Mac:     brew install terraform"
    echo "  Windows: choco install terraform"
    echo "  Linux:   https://terraform.io/downloads"
    exit 1
fi

# 检查必需变量
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ 错误: 请先设置 PROJECT_ID 环境变量${NC}"
    echo ""
    echo "使用方法："
    echo "  export PROJECT_ID='your-gcp-project-id'"
    echo "  ./scripts/terraform-deploy.sh"
    exit 1
fi

# 设置默认值
REGION=${REGION:-asia-northeast1}  # 东京区域
ZONE=${ZONE:-asia-northeast1-a}  # 东京可用区A
MACHINE_TYPE=${MACHINE_TYPE:-e2-medium}
USE_STATIC_IP=${USE_STATIC_IP:-false}
TF_DIR="terraform/vm"

echo -e "${GREEN}==================================="
echo "📋 部署配置"
echo "===================================${NC}"
echo "项目ID: $PROJECT_ID"
echo "区域: $REGION"
echo "可用区: $ZONE"
echo "机器类型: $MACHINE_TYPE"
echo "静态IP: $USE_STATIC_IP"
echo "Terraform目录: $TF_DIR"
echo ""

# 确认
read -p "确认开始部署？(y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 已取消"
    exit 1
fi

echo ""
echo -e "${GREEN}开始Terraform部署...${NC}"
echo ""

# 进入Terraform目录
cd $TF_DIR

# 1. Terraform Init
echo -e "${YELLOW}[1/5] Terraform Init - 初始化...${NC}"
terraform init
echo -e "${GREEN}✅ 初始化完成${NC}"
echo ""

# 2. Terraform Format
echo -e "${YELLOW}[2/5] Terraform Format - 格式化代码...${NC}"
terraform fmt -recursive
echo -e "${GREEN}✅ 格式化完成${NC}"
echo ""

# 3. Terraform Validate
echo -e "${YELLOW}[3/5] Terraform Validate - 验证配置...${NC}"
terraform validate
echo -e "${GREEN}✅ 验证通过${NC}"
echo ""

# 4. Terraform Plan
echo -e "${YELLOW}[4/5] Terraform Plan - 生成执行计划...${NC}"
terraform plan \
  -var="project_id=$PROJECT_ID" \
  -var="region=$REGION" \
  -var="zone=$ZONE" \
  -var="machine_type=$MACHINE_TYPE" \
  -var="use_static_ip=$USE_STATIC_IP" \
  -out=tfplan

echo -e "${GREEN}✅ 执行计划已生成${NC}"
echo ""

# 确认应用
echo -e "${YELLOW}查看上面的执行计划，确认要应用这些更改吗？${NC}"
read -p "输入 'yes' 继续: " -r
if [[ ! $REPLY == "yes" ]]; then
    echo "❌ 已取消"
    exit 1
fi
echo ""

# 5. Terraform Apply
echo -e "${YELLOW}[5/5] Terraform Apply - 应用更改（约5-10分钟）...${NC}"
terraform apply tfplan
echo -e "${GREEN}✅ 基础设施创建完成${NC}"
echo ""

# 获取输出
echo -e "${YELLOW}获取部署信息...${NC}"
EXTERNAL_IP=$(terraform output -raw external_ip)
FRONTEND_URL=$(terraform output -raw frontend_url)
BACKEND_URL=$(terraform output -raw backend_url)
INSTANCE_NAME=$(terraform output -raw instance_name)
SSH_COMMAND=$(terraform output -raw ssh_command)

echo ""
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════╗
║                                                   ║
║         🎉 基础设施部署成功！                      ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${BLUE}==================================="
echo "📱 访问信息"
echo "===================================${NC}"
echo ""
echo -e "${GREEN}外部IP:${NC}"
echo "  $EXTERNAL_IP"
echo ""
echo -e "${GREEN}前端应用:${NC}"
echo "  $FRONTEND_URL"
echo ""
echo -e "${GREEN}后端API:${NC}"
echo "  $BACKEND_URL"
echo "  API文档: $BACKEND_URL/docs"
echo ""
echo -e "${GREEN}SSH连接:${NC}"
echo "  $SSH_COMMAND"
echo ""

# 6. 部署应用代码
echo -e "${YELLOW}正在部署应用代码...${NC}"
echo ""

# 等待VM完全启动
echo "等待VM完全启动（60秒）..."
sleep 60

# 创建部署包
echo "📦 创建部署包..."
cd ../..
tar -czf /tmp/classarranger-app.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='__pycache__' \
  --exclude='*.pyc' \
  --exclude='.env' \
  --exclude='mongodb_data' \
  --exclude='terraform/.terraform' \
  --exclude='terraform/*.tfstate*' \
  .

# 上传到VM
echo "📤 上传应用代码到VM..."
gcloud compute scp /tmp/classarranger-app.tar.gz $INSTANCE_NAME:/tmp/app.tar.gz --zone=$ZONE --quiet

# 在VM上部署
echo "🚀 在VM上部署应用..."
gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --quiet --command="
  set -e
  
  echo '解压应用代码...'
  cd /opt/classarranger
  tar -xzf /tmp/app.tar.gz
  rm /tmp/app.tar.gz
  
  echo '获取外部IP...'
  EXTERNAL_IP=\$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip -H 'Metadata-Flavor: Google')
  export VITE_API_URL=http://\$EXTERNAL_IP:8000
  
  echo '停止现有服务...'
  docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
  
  echo '启动服务...'
  docker-compose -f docker-compose.prod.yml up -d --build
  
  echo ''
  echo '✅ 应用部署完成！'
  
  echo ''
  echo '容器状态：'
  docker-compose -f docker-compose.prod.yml ps
"

# 清理临时文件
rm /tmp/classarranger-app.tar.gz

echo ""
echo -e "${GREEN}✅ 应用部署完成${NC}"
echo ""

# 7. 健康检查
echo -e "${YELLOW}运行健康检查（30秒后）...${NC}"
sleep 30

echo ""
echo "测试后端健康..."
if curl -s -f "$BACKEND_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 后端服务运行正常${NC}"
else
    echo -e "${YELLOW}⚠️  后端服务可能还在启动中，请稍后再试${NC}"
fi

echo ""
echo "测试前端访问..."
if curl -s -f "$FRONTEND_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 前端服务运行正常${NC}"
else
    echo -e "${YELLOW}⚠️  前端服务可能还在启动中，请稍后再试${NC}"
fi

echo ""
echo -e "${BLUE}==================================="
echo "🔑 测试账号 (Mock模式)"
echo "===================================${NC}"
echo ""
echo "账号1: test@example.com / password"
echo "账号2: admin@example.com / admin123"
echo ""

echo -e "${BLUE}==================================="
echo "📊 后续操作"
echo "===================================${NC}"
echo ""
echo "1. 查看Terraform状态:"
echo "   cd $TF_DIR && terraform show"
echo ""
echo "2. 查看输出值:"
echo "   cd $TF_DIR && terraform output"
echo ""
echo "3. SSH连接到VM:"
echo "   $SSH_COMMAND"
echo ""
echo "4. 查看日志:"
echo "   gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command='cd /opt/classarranger && docker-compose -f docker-compose.prod.yml logs -f'"
echo ""
echo "5. 更新应用（重新运行此脚本）:"
echo "   export PROJECT_ID='$PROJECT_ID'"
echo "   ./scripts/terraform-deploy.sh"
echo ""
echo "6. 销毁资源:"
echo "   cd $TF_DIR && terraform destroy"
echo ""

echo -e "${GREEN}==================================="
echo "🎊 部署完成！"
echo "===================================${NC}"
echo ""
echo -e "打开浏览器访问: ${BLUE}$FRONTEND_URL${NC}"
echo ""

