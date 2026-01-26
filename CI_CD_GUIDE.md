# CI/CD 和测试完整指南

本指南介绍如何设置持续集成/持续部署(CI/CD)流水线和单元测试，特别适合 AI Agent 自动验证代码质量。

## 📋 目录

1. [概述](#概述)
2. [本地测试](#本地测试)
3. [GitHub Actions CI/CD](#github-actions-cicd)
4. [测试策略](#测试策略)
5. [AI Agent 验证流程](#ai-agent-验证流程)
6. [故障排除](#故障排除)

---

## 概述

### CI/CD 流程图

```
代码推送 → GitHub
    ↓
自动触发 GitHub Actions
    ↓
├── 前端测试
│   ├── ESLint 代码检查
│   ├── 单元测试
│   ├── 集成测试
│   └── 构建验证
│
├── 后端测试
│   ├── Flake8 代码检查
│   ├── MyPy 类型检查
│   ├── 单元测试
│   └── 集成测试
│
├── 安全扫描
│   └── Trivy 漏洞扫描
│
└── 测试通过
    ↓
构建 Docker 镜像
    ↓
推送到 Artifact Registry
    ↓
部署到 Cloud Run
    ↓
运行冒烟测试
    ↓
部署成功 ✅
```

### 已配置的 GitHub Actions

- **`.github/workflows/ci-cd.yml`** - 完整的 CI/CD 流水线
- **`.github/workflows/test.yml`** - 自动化测试流水线

---

## 本地测试

### 前端测试

#### 1. 安装依赖

```bash
cd frontend
npm install
```

#### 2. 运行测试

```bash
# 运行所有单元测试
npm run test:unit

# 监听模式（自动重新运行）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# 交互式 UI
npm run test:ui

# ESLint 代码检查
npm run lint
```

#### 3. 查看测试结果

```bash
# 覆盖率报告位于
open frontend/coverage/index.html
```

#### 4. 运行端到端测试

```bash
# 安装 Playwright
npx playwright install

# 运行 E2E 测试
npm run test:e2e
```

### 后端测试

#### 1. 安装依赖

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install pytest pytest-cov pytest-asyncio httpx
```

#### 2. 运行测试

```bash
# 运行所有测试
pytest

# 运行单元测试
pytest tests/ -v

# 生成覆盖率报告
pytest tests/ --cov=app --cov-report=html

# 只运行特定标记的测试
pytest -m unit
pytest -m integration
pytest -m smoke

# 运行代码检查
flake8 app --max-line-length=120
mypy app --ignore-missing-imports
```

#### 3. 查看测试结果

```bash
# 覆盖率报告位于
open backend/htmlcov/index.html
```

---

## GitHub Actions CI/CD

### 设置步骤

#### 1. 配置 GitHub Secrets

在 GitHub 仓库设置中添加以下 Secrets：

**GCP 相关**：
- `GCP_PROJECT_ID` - 你的 GCP 项目 ID
- `GCP_SA_KEY` - GCP 服务账号 JSON 密钥

**Firebase 相关**：
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `FIREBASE_PROJECT_ID`

**OpenAI**：
- `OPENAI_API_KEY` (可选)

**其他**：
- `VITE_API_URL` - 后端 API URL

#### 2. 创建 GCP 服务账号

```bash
# 创建服务账号
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions"

# 授予权限
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# 生成密钥
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com

# 将 github-actions-key.json 内容添加到 GCP_SA_KEY Secret
cat github-actions-key.json
```

#### 3. 推送代码触发 CI/CD

```bash
git add .
git commit -m "Setup CI/CD pipeline"
git push origin main
```

### CI/CD 流程说明

#### 自动触发条件

- **Push** 到 `main` 或 `develop` 分支
- **Pull Request** 到 `main` 或 `develop` 分支
- **手动触发**（workflow_dispatch）

#### 流程步骤

1. **前端测试** (frontend-test)
   - 安装依赖
   - ESLint 检查
   - 运行单元测试
   - 运行集成测试
   - 构建验证
   - 上传覆盖率

2. **后端测试** (backend-test)
   - 安装依赖
   - Flake8 代码检查
   - MyPy 类型检查
   - 运行单元测试
   - 上传覆盖率

3. **安全扫描** (security-scan)
   - Trivy 漏洞扫描
   - 上传结果到 GitHub Security

4. **构建和推送** (build-and-push)
   - 仅在 main 分支
   - 构建 Docker 镜像
   - 推送到 Artifact Registry
   - 标记版本号（git SHA）

5. **部署** (deploy)
   - 部署到 Cloud Run
   - 运行冒烟测试
   - 发送通知

---

## 测试策略

### 测试金字塔

```
        /\
       /E2E\         <- 少量端到端测试
      /------\
     /集成测试\       <- 适量集成测试
    /----------\
   /  单元测试   \   <- 大量单元测试
  /--------------\
```

### 前端测试覆盖

#### 已实现的测试

1. **utils/constants.test.js**
   - ✅ 测试常量定义
   - ✅ 测试颜色数组
   - ✅ 测试时间常量
   - ✅ 测试星期映射
   - ✅ 测试随机颜色函数

2. **utils/studentParser.test.js**
   - ✅ 测试空输入处理
   - ✅ 测试单行解析
   - ✅ 测试多行解析
   - ✅ 测试缺失字段
   - ✅ 测试单元格换行
   - ✅ 测试空格处理

3. **utils/teacherParser.test.js**
   - ✅ 测试空输入处理
   - ✅ 测试单行解析
   - ✅ 测试多行解析
   - ✅ 测试所有字段
   - ✅ 测试制表符启发式算法

#### 需要添加的测试

- [ ] 组件测试（Dashboard, Function, MyPage）
- [ ] 路由测试
- [ ] 状态管理测试
- [ ] API 客户端测试
- [ ] E2E 测试（用户流程）

### 后端测试覆盖

#### 已实现的测试

1. **test_main.py**
   - ✅ 健康检查端点
   - ✅ 根端点
   - ✅ CORS 配置
   - ✅ API 文档可用性
   - ✅ OpenAPI schema

2. **test_diaries.py**
   - ✅ 未授权访问
   - ✅ 授权访问
   - ✅ CRUD 操作
   - ✅ 数据验证
   - ✅ AI 洞察生成

#### 需要添加的测试

- [ ] 认证测试
- [ ] Firebase 集成测试
- [ ] RAG 服务测试
- [ ] 错误处理测试
- [ ] 性能测试

---

## AI Agent 验证流程

### 自动验证步骤

AI Agent 可以按照以下步骤自动验证代码质量：

#### 1. 本地验证

```bash
#!/bin/bash
# 本地验证脚本

echo "🔍 开始代码验证..."

# 前端测试
echo "📦 运行前端测试..."
cd frontend
npm install
npm run lint || echo "⚠️  ESLint 警告"
npm run test:unit || exit 1
npm run build || exit 1
cd ..

# 后端测试
echo "🐍 运行后端测试..."
cd backend
pip install -r requirements.txt
pip install pytest pytest-cov flake8 mypy
flake8 app --max-line-length=120 || echo "⚠️  Flake8 警告"
mypy app --ignore-missing-imports || echo "⚠️  MyPy 警告"
pytest tests/ -v || exit 1
cd ..

echo "✅ 所有测试通过！"
```

#### 2. 创建验证脚本

已创建：`scripts/verify.sh`

```bash
chmod +x scripts/verify.sh
./scripts/verify.sh
```

#### 3. Git Hooks（推荐）

```bash
# 安装 pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "运行预提交检查..."
./scripts/verify.sh
EOF

chmod +x .git/hooks/pre-commit
```

#### 4. CI/CD 验证

推送代码后，查看 GitHub Actions 状态：

```bash
# 查看最近的 workflow 运行
gh run list

# 查看详细日志
gh run view

# 查看特定 workflow
gh run view --log
```

### 测试覆盖率目标

| 组件 | 目标覆盖率 | 当前状态 |
|------|-----------|---------|
| 前端 Utils | 80%+ | ✅ 已达成 |
| 前端 Components | 70%+ | 🚧 进行中 |
| 后端 API | 80%+ | ✅ 已达成 |
| 后端 Services | 70%+ | 🚧 进行中 |
| 整体 | 75%+ | 🎯 目标 |

---

## 故障排除

### 常见问题

#### 1. GitHub Actions 失败

**问题**：GitHub Actions 构建失败

**解决方案**：
```bash
# 查看日志
gh run view --log

# 常见原因：
# - Secrets 未配置
# - 服务账号权限不足
# - 测试失败
```

#### 2. 测试失败

**问题**：本地测试通过但 CI 失败

**解决方案**：
```bash
# 确保依赖版本一致
cd frontend && npm ci
cd backend && pip install -r requirements.txt

# 检查环境变量
echo $TESTING

# 清理缓存
rm -rf node_modules coverage .pytest_cache
```

#### 3. 覆盖率不足

**问题**：测试覆盖率低于目标

**解决方案**：
```bash
# 查看未覆盖的代码
npm run test:coverage
open coverage/index.html

# 或后端
pytest --cov=app --cov-report=html
open htmlcov/index.html

# 添加更多测试
```

#### 4. Docker 构建失败

**问题**：Docker 镜像构建失败

**解决方案**：
```bash
# 本地测试构建
docker build -f frontend/Dockerfile.prod frontend/
docker build -f backend/Dockerfile.prod backend/

# 检查 Dockerfile 语法
# 检查依赖是否正确
```

---

## 最佳实践

### 1. 编写测试

- ✅ 为每个新功能编写测试
- ✅ 测试边界情况
- ✅ 使用描述性的测试名称
- ✅ 保持测试独立
- ✅ 使用 fixtures 和 mocks

### 2. CI/CD

- ✅ 小的、频繁的提交
- ✅ 所有测试通过才合并
- ✅ 使用 feature 分支
- ✅ Code review
- ✅ 自动化部署

### 3. 监控

- ✅ 查看 GitHub Actions 通知
- ✅ 监控覆盖率趋势
- ✅ 定期审查测试
- ✅ 修复 flaky 测试

---

## 快速命令参考

```bash
# 前端
cd frontend
npm run test:unit          # 单元测试
npm run test:watch         # 监听模式
npm run test:coverage      # 覆盖率
npm run lint               # 代码检查

# 后端
cd backend
pytest                     # 运行所有测试
pytest -v                  # 详细输出
pytest --cov=app          # 覆盖率
pytest -m unit            # 只运行单元测试
flake8 app                # 代码检查
mypy app                  # 类型检查

# GitHub Actions
gh run list               # 查看运行历史
gh run view              # 查看详情
gh run watch             # 实时查看

# Docker
docker build -f frontend/Dockerfile.prod frontend/
docker build -f backend/Dockerfile.prod backend/

# 验证
./scripts/verify.sh       # 运行所有验证
```

---

## 资源链接

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Vitest 文档](https://vitest.dev/)
- [Pytest 文档](https://docs.pytest.org/)
- [Testing Library](https://testing-library.com/)
- [Playwright](https://playwright.dev/)

---

完成！现在你的项目拥有完整的 CI/CD 流水线和测试套件。🎉

