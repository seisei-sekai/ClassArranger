# ClassArranger

前途塾智能排课系统 - 全栈 Web 应用，支持课程管理、智能排课和日历视图。

## 🚀 快速开始

### 本地运行

```bash
cd frontend
npm install
npm run dev
```

访问：http://localhost:5173/xdf-class-arranger

详细说明请查看 [本地运行指南](./docs/local-run.md)

### 云端部署（GCP）

**🌟 推荐：Terraform + Git部署（Best Practice）**  
查看 [小白部署指南](./docs/beginner-deploy-guide.md) - 使用Terraform + GCP VM + 本地MongoDB

```bash
# 1️⃣ 首次部署：使用Terraform创建基础设施
export PROJECT_ID='your-gcp-project-id'
./scripts/terraform-deploy.sh

# 2️⃣ 后续更新：使用Git部署（推荐）
./scripts/deploy-git.sh
```

查看 [✨ Git部署指南](./docs/git-deployment-guide.md) - Git-based deployment最佳实践

**方法一：使用一键脚本**
```bash
./scripts/setup-gcp.sh    # 初始化 GCP
./scripts/deploy.sh        # 部署应用
```

**方法二：快速部署（5步）**
查看 [快速部署指南](./docs/quick-deploy.md)

**方法三：完整指南（适合新手）**
查看 [GCP 部署完整指南](./docs/gcp-deployment-guide.md)

## 📋 功能特点

- **智能排课** - AI 辅助的课程安排系统
- **日历视图** - 使用 FullCalendar 的可视化日程管理
- **学生管理** - Excel 导入/导出学生数据
- **教师管理** - 教师信息和可用时间管理
- **教室管理** - 教室资源分配
- **用户认证** - Firebase Authentication
- **响应式设计** - 支持桌面和移动设备

## 🛠️ 技术栈

### 前端
- React 18
- Vite
- React Router
- FullCalendar
- Tailwind CSS
- Firebase SDK

### 后端
- FastAPI (Python)
- Firebase Admin SDK
- Firestore Database
- OpenAI API (可选)

### 部署
- Google Cloud Run
- Artifact Registry
- Terraform
- Docker

## 📁 项目结构

```
ClassArranger/
├── frontend/              # React 前端应用
│   ├── src/
│   │   ├── XdfClassArranger/  # 主应用模块
│   │   │   ├── Dashboard/     # 仪表板
│   │   │   ├── Function/      # 排课功能
│   │   │   └── MyPage/        # 个人页面
│   │   ├── api/               # API 客户端
│   │   ├── config/            # Firebase 配置
│   │   └── store/             # 状态管理
│   ├── Dockerfile             # 开发环境
│   └── Dockerfile.prod        # 生产环境
├── backend/               # FastAPI 后端
│   ├── app/
│   │   ├── api/           # API 路由
│   │   ├── core/          # 核心配置
│   │   ├── models/        # 数据模型
│   │   └── services/      # 业务逻辑
│   ├── Dockerfile
│   └── Dockerfile.prod
├── terraform/             # 基础设施即代码
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── scripts/               # 部署脚本
│   ├── setup-gcp.sh       # GCP 初始化
│   └── deploy.sh          # 一键部署
├── LOCAL_RUN.md           # 本地运行指南
├── QUICK_DEPLOY.md        # 快速部署指南
└── GCP_DEPLOYMENT_GUIDE.md # 完整部署指南
```

## 🌐 访问路由

部署后的访问地址：

- **主页**：`/`
- **登录**：`/login`
- **Dashboard**：`/dashboard`
- **ClassArranger 主页**：`/xdf-class-arranger`
- **排课功能**：`/xdf-class-arranger/function`
- **我的主页**：`/xdf-class-arranger/mypage`

## 📚 文档

所有文档都在 [`docs/`](./docs/) 文件夹中，查看 [文档索引](./docs/INDEX.md) 获取完整列表。

### 快速链接
- **[⭐ 小白部署指南](./docs/beginner-deploy-guide.md) - 零基础GCP部署（推荐新手）**
- **[✨ Git部署指南](./docs/git-deployment-guide.md) - Git部署最佳实践（推荐）**
- [本地运行指南](./docs/local-run.md) - 如何在本地运行项目
- [快速部署指南](./docs/quick-deploy.md) - 5步快速部署到 GCP
- [完整部署指南](./docs/gcp-deployment-guide.md) - 从零开始的详细部署教程
- [CI/CD 指南](./docs/ci-cd-guide.md) - 持续集成和持续部署完整指南
- [测试快速参考](./docs/testing-quick-reference.md) - 测试命令速查表
- [Cursor Rules 指南](./docs/cursor-rules-guide.md) - Cursor IDE AI 助手规则配置

## 💰 成本

使用 GCP Cloud Run 的免费额度：
- 每月 200 万请求
- 360,000 GB-秒内存
- 180,000 vCPU-秒

预计成本（超出免费额度）：
- 轻度使用：$0-5/月
- 中度使用：$5-20/月

## 🔧 开发

### 安装依赖

```bash
# 前端
cd frontend
npm install

# 后端
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 运行测试

```bash
# 前端
cd frontend
npm run lint
npm run build

# 后端
cd backend
pytest
```

## 📝 环境变量

复制 `env.example` 为 `.env` 并填入配置：

```bash
cp env.example .env
```

必需的环境变量：
- `VITE_FIREBASE_API_KEY` - Firebase API 密钥
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase 认证域
- `VITE_FIREBASE_PROJECT_ID` - Firebase 项目 ID
- `GCP_PROJECT_ID` - GCP 项目 ID（部署时需要）
- `GCP_REGION` - GCP 区域（部署时需要）

## 🤝 贡献

欢迎贡献！请先 fork 本仓库，然后提交 Pull Request。

## 📄 许可证

MIT License

## 🆘 支持

遇到问题？
1. 查看文档：`LOCAL_RUN.md`、`QUICK_DEPLOY.md`、`GCP_DEPLOYMENT_GUIDE.md`
2. 查看日志：`gcloud run logs read SERVICE_NAME`
3. 提交 Issue

## ✨ 快速命令

```bash
# 本地开发
npm run dev                    # 启动前端
make dev                       # 使用 Docker Compose 启动全栈

# GCP 部署
./scripts/setup-gcp.sh         # 初始化 GCP（首次）
./scripts/deploy-git.sh        # Git部署（推荐）
./scripts/rollback-git.sh HEAD~1 # 回滚到上一版本

# 查看日志
gcloud run logs read classarranger-frontend --limit=50
gcloud run logs read classarranger-backend --limit=50

# 更新服务
gcloud run deploy SERVICE_NAME --image IMAGE_URL

# Terraform
cd terraform
terraform init                 # 初始化
terraform plan                 # 预览
terraform apply                # 应用
terraform destroy              # 销毁
```

---

Made with ❤️ by ClassArranger Team
