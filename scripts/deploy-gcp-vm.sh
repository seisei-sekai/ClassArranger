#!/bin/bash

# ClassArranger GCP VM 部署脚本
# 使用GCP VM + Docker Compose + 本地MongoDB

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
║       ClassArranger GCP VM 一键部署               ║
║                                                   ║
║   GCP VM + Docker + MongoDB (本地)                ║
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
    echo "  ./scripts/deploy-gcp-vm.sh"
    exit 1
fi

REGION=${REGION:-asia-northeast1}  # 东京区域
ZONE=${ZONE:-asia-northeast1-a}  # 东京可用区A
INSTANCE_NAME=${INSTANCE_NAME:-classarranger-vm}
MACHINE_TYPE=${MACHINE_TYPE:-e2-medium}

echo -e "${GREEN}==================================="
echo "📋 部署配置"
echo "===================================${NC}"
echo "项目ID: $PROJECT_ID"
echo "区域: $REGION"
echo "可用区: $ZONE"
echo "实例名: $INSTANCE_NAME"
echo "机器类型: $MACHINE_TYPE (2 vCPU, 4 GB)"
echo "模式: Mock (无需Firebase和OpenAI)"
echo "数据库: MongoDB (本地容器)"
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
echo -e "${YELLOW}[1/8] 设置GCP项目...${NC}"
gcloud config set project $PROJECT_ID
echo "✅ 项目设置完成"
echo ""

# 2. 启用API
echo -e "${YELLOW}[2/8] 启用必要的API (大约需要2-3分钟)...${NC}"
gcloud services enable \
  compute.googleapis.com \
  --quiet

echo "✅ API启用完成"
echo ""

# 3. 创建防火墙规则
echo -e "${YELLOW}[3/8] 配置防火墙规则...${NC}"
if gcloud compute firewall-rules describe classarranger-http &>/dev/null; then
    echo "ℹ️  HTTP防火墙规则已存在，跳过创建"
else
    gcloud compute firewall-rules create classarranger-http \
      --allow tcp:80 \
      --source-ranges 0.0.0.0/0 \
      --target-tags classarranger \
      --description="Allow HTTP traffic to ClassArranger" \
      --quiet
    echo "✅ HTTP防火墙规则创建完成"
fi

if gcloud compute firewall-rules describe classarranger-api &>/dev/null; then
    echo "ℹ️  API防火墙规则已存在，跳过创建"
else
    gcloud compute firewall-rules create classarranger-api \
      --allow tcp:8000 \
      --source-ranges 0.0.0.0/0 \
      --target-tags classarranger \
      --description="Allow API traffic to ClassArranger" \
      --quiet
    echo "✅ API防火墙规则创建完成"
fi
echo ""

# 4. 创建启动脚本
echo -e "${YELLOW}[4/8] 准备VM启动脚本...${NC}"
cat > /tmp/startup-script.sh << 'STARTUP_EOF'
#!/bin/bash

# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl start docker
systemctl enable docker

# 安装Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 克隆代码（从GitHub或上传）
mkdir -p /opt/classarranger

# 等待代码上传...
echo "Waiting for code upload..."
STARTUP_EOF

echo "✅ 启动脚本准备完成"
echo ""

# 5. 创建或更新VM实例
echo -e "${YELLOW}[5/8] 创建/更新GCP VM实例 (大约需要2-3分钟)...${NC}"
if gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE &>/dev/null; then
    echo "ℹ️  VM实例已存在，将停止并更新..."
    gcloud compute instances stop $INSTANCE_NAME --zone=$ZONE --quiet || true
    sleep 5
    gcloud compute instances delete $INSTANCE_NAME --zone=$ZONE --quiet
fi

gcloud compute instances create $INSTANCE_NAME \
  --zone=$ZONE \
  --machine-type=$MACHINE_TYPE \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=20GB \
  --boot-disk-type=pd-standard \
  --tags=classarranger \
  --metadata-from-file=startup-script=/tmp/startup-script.sh \
  --quiet

echo "✅ VM实例创建完成"
echo ""

# 6. 等待实例启动
echo -e "${YELLOW}[6/8] 等待VM实例启动 (30秒)...${NC}"
sleep 30
echo "✅ VM实例已启动"
echo ""

# 7. 上传代码和部署
echo -e "${YELLOW}[7/8] 上传代码并部署 (大约需要5分钟)...${NC}"

# 创建临时部署包
TEMP_DIR=$(mktemp -d)
echo "📦 准备部署包..."
rsync -a --exclude 'node_modules' --exclude '.git' --exclude '__pycache__' \
  --exclude '*.pyc' --exclude '.env' --exclude 'mongodb_data' \
  ./ $TEMP_DIR/

# 上传到VM
echo "📤 上传到VM..."
gcloud compute scp --recurse $TEMP_DIR/* $INSTANCE_NAME:/opt/classarranger/ --zone=$ZONE --quiet

# 清理临时文件
rm -rf $TEMP_DIR

# 在VM上执行部署
echo "🚀 在VM上启动服务..."
gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --quiet --command="
  set -e
  cd /opt/classarranger
  
  # 等待Docker安装完成
  echo '等待Docker安装完成...'
  for i in {1..30}; do
    if command -v docker &> /dev/null; then
      echo 'Docker安装完成'
      break
    fi
    sleep 2
  done
  
  # 获取VM外部IP
  EXTERNAL_IP=\$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip -H 'Metadata-Flavor: Google')
  
  # 设置环境变量
  export VITE_API_URL=http://\$EXTERNAL_IP:8000
  
  # 停止现有容器
  docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
  
  # 启动服务
  docker-compose -f docker-compose.prod.yml up -d --build
  
  # 显示状态
  echo ''
  echo '容器状态：'
  docker-compose -f docker-compose.prod.yml ps
  
  echo ''
  echo '🎉 部署完成！'
  echo ''
  echo '访问地址：'
  echo '前端: http://'\$EXTERNAL_IP
  echo '后端: http://'\$EXTERNAL_IP':8000'
  echo '健康检查: http://'\$EXTERNAL_IP':8000/health'
"

echo "✅ 部署完成"
echo ""

# 8. 获取访问信息
echo -e "${YELLOW}[8/8] 获取访问信息...${NC}"
EXTERNAL_IP=$(gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo ""
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
echo -e "${GREEN}外部IP:${NC}"
echo "  $EXTERNAL_IP"
echo ""
echo -e "${GREEN}前端应用:${NC}"
echo "  http://$EXTERNAL_IP"
echo ""
echo -e "${GREEN}后端API:${NC}"
echo "  http://$EXTERNAL_IP:8000"
echo "  健康检查: http://$EXTERNAL_IP:8000/health"
echo "  API文档: http://$EXTERNAL_IP:8000/docs"
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
echo "1. SSH连接到VM:"
echo "   gcloud compute ssh $INSTANCE_NAME --zone=$ZONE"
echo ""
echo "2. 查看日志:"
echo "   gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command='cd /opt/classarranger && docker-compose -f docker-compose.prod.yml logs -f'"
echo ""
echo "3. 重启服务:"
echo "   gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command='cd /opt/classarranger && docker-compose -f docker-compose.prod.yml restart'"
echo ""
echo "4. 停止服务:"
echo "   gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command='cd /opt/classarranger && docker-compose -f docker-compose.prod.yml down'"
echo ""
echo "5. 删除VM实例（会删除所有数据）:"
echo "   gcloud compute instances delete $INSTANCE_NAME --zone=$ZONE"
echo ""
echo -e "${GREEN}==================================="
echo "🎊 现在可以访问你的应用了！"
echo "===================================${NC}"
echo ""
echo -e "打开浏览器访问: ${BLUE}http://$EXTERNAL_IP${NC}"
echo ""

# 测试健康检查
echo -e "${YELLOW}正在测试服务健康状态 (等待30秒)...${NC}"
sleep 30
if curl -s -f "http://$EXTERNAL_IP:8000/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 后端服务运行正常${NC}"
else
    echo -e "${YELLOW}⚠️  后端服务可能还在启动中，请稍后再试${NC}"
fi

if curl -s -f "http://$EXTERNAL_IP" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 前端服务运行正常${NC}"
else
    echo -e "${YELLOW}⚠️  前端服务可能还在启动中，请稍后再试${NC}"
fi

echo ""
echo -e "${GREEN}部署完成！${NC}"

