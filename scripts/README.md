# ClassArranger 脚本说明

本文件夹包含所有部署和管理脚本，按使用频率分类。

---

## 📂 文件夹结构

```
scripts/
├── frequently-used/    # 日常使用脚本（⭐推荐）
│   ├── deploy-git.sh
│   └── rollback-git.sh
└── other/              # 初始设置和工具脚本
    ├── terraform-deploy.sh
    ├── setup-gcp.sh
    ├── verify.sh
    └── mock-deploy.sh
```

---

## ⭐ frequently-used/ - 日常使用脚本

这些是你**最常使用**的脚本，用于日常开发和部署。

### `deploy-git.sh` - Git 部署（Best Practice）

**用途**: 使用 Git 部署代码到生产环境

**使用场景**: 
- ✅ 每次代码更新后部署
- ✅ 需要快速发布新功能
- ✅ 团队协作部署

**使用方法**:
```bash
# 确保代码已推送到 GitHub
git push origin main

# 运行部署脚本
./scripts/frequently-used/deploy-git.sh

# 或使用环境变量
PROJECT_ID=your-project ./scripts/frequently-used/deploy-git.sh
```

**功能**:
1. ✅ 检查 VM 状态
2. ✅ 验证无未提交更改
3. ✅ 在 VM 上执行 `git pull`
4. ✅ 重新构建 Docker 容器
5. ✅ 重启服务
6. ✅ 运行健康检查
7. ✅ 显示部署状态和 URL

**输出示例**:
```
======================================
   ClassArranger Git Deployment
======================================

>>> Checking VM status...
✓ VM is running

>>> Pulling latest code on VM...
✓ Code updated successfully

>>> Rebuilding and restarting services...
✓ Services restarted successfully

>>> Running health checks...
✓ Backend is healthy
✓ Frontend is accessible

======================================
   Deployment Complete! 🎉
======================================

📱 Frontend:  http://34.146.84.254
🔌 Backend:   http://34.146.84.254:8000
📚 API Docs:  http://34.146.84.254:8000/docs
```

---

### `rollback-git.sh` - 回滚部署

**用途**: 回滚到之前的 Git 提交版本

**使用场景**:
- ❌ 部署后发现 Bug
- ❌ 新功能有问题
- ❌ 需要紧急恢复

**使用方法**:
```bash
# 查看提交历史
git log --oneline -n 10

# 回滚到上一版本
./scripts/frequently-used/rollback-git.sh HEAD~1

# 回滚到特定提交
./scripts/frequently-used/rollback-git.sh abc1234

# 回滚 2 个提交
./scripts/frequently-used/rollback-git.sh HEAD~2
```

**功能**:
1. ✅ 显示当前部署的提交
2. ✅ 确认回滚操作
3. ✅ 在 VM 上 checkout 指定提交
4. ✅ 重新构建服务
5. ✅ 运行健康检查
6. ✅ 显示回滚后的状态

**示例**:
```bash
# 查看历史
$ git log --oneline -n 5
abc1234 feat: add new feature
def5678 fix: bug fix
ghi9012 chore: update deps
jkl3456 docs: update readme
mno7890 refactor: clean code

# 回滚到 def5678
$ ./scripts/frequently-used/rollback-git.sh def5678
```

---

## 🛠️ other/ - 初始设置和工具脚本

这些脚本用于**首次设置**或**特殊用途**，不需要经常使用。

### `terraform-deploy.sh` - Terraform 自动化部署

**用途**: 使用 Terraform 创建基础设施并部署应用

**使用场景**:
- 🆕 首次部署项目
- 🔄 需要重新创建基础设施
- 🏗️ 修改了 Terraform 配置

**使用方法**:
```bash
# 设置环境变量
export PROJECT_ID="your-gcp-project-id"
export REGION="asia-northeast1"
export ZONE="asia-northeast1-a"
export MACHINE_TYPE="e2-medium"

# 运行部署
./scripts/other/terraform-deploy.sh
```

**功能**:
1. ✅ 验证 Terraform 配置
2. ✅ 生成执行计划
3. ✅ 创建 GCP 资源（VM、防火墙等）
4. ✅ 部署应用代码
5. ✅ 运行健康检查
6. ✅ 显示访问信息

**⚠️ 注意**: 此脚本会创建新的 GCP 资源，可能产生费用。

---

### `setup-gcp.sh` - GCP 初始设置

**用途**: 交互式设置 GCP 项目和环境

**使用场景**:
- 🆕 第一次使用项目
- 🔧 需要配置 GCP 项目
- 📝 创建 `.env` 文件

**使用方法**:
```bash
./scripts/other/setup-gcp.sh
```

**功能**:
1. ✅ 引导创建 GCP 项目
2. ✅ 配置计费账号
3. ✅ 启用必要的 API
4. ✅ 生成 `.env` 配置文件
5. ✅ 验证设置

**交互式输入**:
- GCP 项目 ID
- GCP 区域
- GCP 可用区
- VM 机器类型

---

### `verify.sh` - 验证部署

**用途**: 验证部署的应用是否正常运行

**使用场景**:
- ✅ 部署后验证
- ✅ 定期健康检查
- ✅ 故障排查

**使用方法**:
```bash
./scripts/other/verify.sh
```

**功能**:
1. ✅ 检查 VM 状态
2. ✅ 测试前端可访问性
3. ✅ 测试后端 API
4. ✅ 检查 Docker 容器状态
5. ✅ 验证数据库连接
6. ✅ 生成验证报告

---

### `mock-deploy.sh` - Mock 模式部署

**用途**: 部署 Mock 模式版本（用于演示和测试）

**使用场景**:
- 🧪 开发测试
- 📺 功能演示
- 🚫 无需真实的 Firebase 和 OpenAI API

**使用方法**:
```bash
./scripts/other/mock-deploy.sh
```

**功能**:
1. ✅ 使用 Mock 数据和服务
2. ✅ 不需要外部 API
3. ✅ 快速启动和测试

**Mock 模式说明**:
- 使用内存数据库
- 模拟 AI 响应
- 模拟用户认证

---

## 📚 使用流程

### 首次部署（完整流程）

```bash
# 1. 设置 GCP 环境（仅首次）
./scripts/other/setup-gcp.sh

# 2. Terraform 部署基础设施（仅首次）
export PROJECT_ID="your-project-id"
./scripts/other/terraform-deploy.sh

# 3. 验证部署
./scripts/other/verify.sh
```

### 日常开发流程

```bash
# 1. 本地开发
# 编辑代码...

# 2. 提交和推送
git add .
git commit -m "feat: add new feature"
git push origin main

# 3. Git 部署（⭐最常用）
./scripts/frequently-used/deploy-git.sh

# 4. 如果有问题，回滚
./scripts/frequently-used/rollback-git.sh HEAD~1
```

### 故障排查

```bash
# 验证部署状态
./scripts/other/verify.sh

# 如果有问题，回滚
./scripts/frequently-used/rollback-git.sh HEAD~1

# 或重新部署
./scripts/frequently-used/deploy-git.sh
```

---

## 🔧 环境变量

所有脚本支持以下环境变量：

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `PROJECT_ID` | - | GCP 项目 ID（必需） |
| `REGION` | `asia-northeast1` | GCP 区域 |
| `ZONE` | `asia-northeast1-a` | GCP 可用区 |
| `INSTANCE_NAME` | `classarranger-vm` | VM 实例名称 |
| `MACHINE_TYPE` | `e2-medium` | VM 机器类型 |
| `GIT_BRANCH` | `main` | Git 分支 |

**示例**:
```bash
PROJECT_ID=my-project \
REGION=us-central1 \
ZONE=us-central1-a \
./scripts/frequently-used/deploy-git.sh
```

---

## 💡 最佳实践

### ✅ DO（推荐做法）

1. **使用 Git 部署** - 日常更新使用 `deploy-git.sh`
2. **提交后部署** - 确保代码已推送到 GitHub
3. **验证部署** - 部署后运行 `verify.sh`
4. **回滚准备** - 熟悉 `rollback-git.sh` 的使用
5. **环境变量** - 使用环境变量避免硬编码

### ❌ DON'T（避免）

1. **不要直接修改 VM** - 使用 Git 部署而不是 SSH 手动修改
2. **不要跳过测试** - 本地测试后再部署
3. **不要频繁重建** - 使用 `deploy-git.sh` 而不是 `terraform-deploy.sh`
4. **不要忽略错误** - 查看脚本输出的错误信息
5. **不要在生产环境调试** - 使用 Mock 模式或本地环境

---

## 🚨 故障排查

### 脚本执行失败

**问题**: 权限错误
```bash
chmod +x scripts/frequently-used/*.sh
chmod +x scripts/other/*.sh
```

**问题**: 找不到 gcloud
```bash
# 确保已安装并配置 gcloud
gcloud --version
gcloud auth list
```

**问题**: Terraform 错误
```bash
cd terraform/vm
terraform init
terraform validate
```

### 部署失败

**检查 VM 状态**:
```bash
gcloud compute instances list
gcloud compute instances describe classarranger-vm \
  --zone=asia-northeast1-a
```

**查看容器日志**:
```bash
gcloud compute ssh classarranger-vm --zone=asia-northeast1-a \
  --command="sudo docker ps && sudo docker logs classarranger-backend-1 --tail 50"
```

**手动重启服务**:
```bash
gcloud compute ssh classarranger-vm --zone=asia-northeast1-a
cd /opt/classarranger
sudo docker-compose -f docker-compose.prod.yml restart
```

---

## 📖 相关文档

- **[完整部署指南](../docs/beginner-deploy-guide.md)** - 从零开始的详细教程
- **[Git 部署指南](../docs/git-deployment-guide.md)** - Git 部署最佳实践
- **[文档索引](../docs/INDEX.md)** - 所有文档列表

---

## 🆘 获取帮助

如果遇到问题：
1. 查看脚本输出的错误信息
2. 查看 [完整部署指南](../docs/beginner-deploy-guide.md) 的故障排查章节
3. 提交 GitHub Issue

---

**记住**: 日常使用 `frequently-used/` 中的脚本，首次设置使用 `other/` 中的脚本。

**Best Practice**: Git-based deployment 是最推荐的部署方式！ ✨

