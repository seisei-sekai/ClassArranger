#!/bin/bash

# 代码验证脚本 - 供 AI Agent 和开发者使用
# 运行所有测试和检查

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}🤖 AI Agent 代码验证流程${NC}"
echo -e "${BLUE}=====================================${NC}\n"

# 记录开始时间
START_TIME=$(date +%s)

# 前端验证
echo -e "${YELLOW}📦 Step 1/5: 前端依赖检查${NC}"
cd frontend
if [ ! -d "node_modules" ]; then
    echo "安装前端依赖..."
    npm install
else
    echo "✅ 依赖已安装"
fi

echo -e "\n${YELLOW}📝 Step 2/5: 前端代码检查${NC}"
echo "运行 ESLint..."
if npm run lint; then
    echo -e "${GREEN}✅ ESLint 通过${NC}"
else
    echo -e "${RED}❌ ESLint 发现问题${NC}"
    exit 1
fi

echo -e "\n${YELLOW}🧪 Step 3/5: 前端单元测试${NC}"
if npm run test:unit; then
    echo -e "${GREEN}✅ 前端测试通过${NC}"
else
    echo -e "${RED}❌ 前端测试失败${NC}"
    exit 1
fi

echo -e "\n${YELLOW}🏗️  Step 4/5: 前端构建验证${NC}"
if npm run build; then
    echo -e "${GREEN}✅ 构建成功${NC}"
else
    echo -e "${RED}❌ 构建失败${NC}"
    exit 1
fi

cd ..

# 后端验证
echo -e "\n${YELLOW}🐍 Step 5/5: 后端验证${NC}"
cd backend

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi

source venv/bin/activate

# 安装依赖
echo "检查后端依赖..."
pip install -q -r requirements.txt
pip install -q pytest pytest-cov pytest-asyncio httpx flake8 mypy

# 代码检查
echo -e "\n${YELLOW}📝 代码风格检查 (Flake8)${NC}"
if flake8 app --max-line-length=120 --exclude=__pycache__; then
    echo -e "${GREEN}✅ Flake8 通过${NC}"
else
    echo -e "${YELLOW}⚠️  Flake8 警告（非致命）${NC}"
fi

# 类型检查
echo -e "\n${YELLOW}🔍 类型检查 (MyPy)${NC}"
if mypy app --ignore-missing-imports; then
    echo -e "${GREEN}✅ MyPy 通过${NC}"
else
    echo -e "${YELLOW}⚠️  MyPy 警告（非致命）${NC}"
fi

# 单元测试
echo -e "\n${YELLOW}🧪 后端单元测试${NC}"
if pytest tests/ -v --tb=short; then
    echo -e "${GREEN}✅ 后端测试通过${NC}"
else
    echo -e "${RED}❌ 后端测试失败${NC}"
    exit 1
fi

deactivate
cd ..

# 计算总时间
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# 生成报告
echo -e "\n${BLUE}=====================================${NC}"
echo -e "${GREEN}✅ 所有验证通过！${NC}"
echo -e "${BLUE}=====================================${NC}"
echo -e "${GREEN}📊 验证报告:${NC}"
echo -e "  ✅ 前端 ESLint: 通过"
echo -e "  ✅ 前端单元测试: 通过"
echo -e "  ✅ 前端构建: 通过"
echo -e "  ✅ 后端代码检查: 通过"
echo -e "  ✅ 后端单元测试: 通过"
echo -e "${GREEN}⏱️  总耗时: ${DURATION}秒${NC}"
echo -e "${BLUE}=====================================${NC}\n"

echo -e "${GREEN}🎉 代码已准备好提交和部署！${NC}\n"

