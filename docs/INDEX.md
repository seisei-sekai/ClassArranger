# Documentation Index

**Created:** 2026-01-22  
**Last Updated:** 2026-01-23  
**Purpose:** Central index of all project documentation files

---

## 📚 Documentation Overview

ClassArranger 采用 **Best Practice** 的部署和开发流程，所有文档都经过精心整理，避免冗余。

### 🎯 核心理念

- **Infrastructure as Code (IaC)** - 使用 Terraform 管理基础设施
- **Git-based Deployment** - 版本控制的部署方式
- **CI/CD Automation** - GitHub Actions 自动化
- **Team Collaboration** - GitHub Flow 工作流

---

## 📋 Document List

### 🚀 部署指南（必读）

- **[⭐ 完整部署指南](./beginner-deploy-guide.md) - 从零到生产环境的完整指南（推荐新手）**
  - 包含：初始设置、Terraform 部署、团队协作、故障排查、CI/CD、生产优化
  - 创建时间：2026-01-22
  - 最后更新：2026-01-23
  - 状态：✅ **最新 · 完整 · Best Practice**

- **[✨ Git 部署指南](./git-deployment-guide.md) - Git 部署最佳实践（日常使用）**
  - 包含：Git 部署流程、回滚操作、私有仓库配置、最佳实践
  - 创建时间：2026-01-23
  - 状态：✅ **推荐使用**

### 💻 开发指南

- **[本地运行指南](./local-run.md) - 本地开发环境设置**
  - 包含：Docker Compose 本地开发、热重载、调试
  - 创建时间：2026-01-22
  - 适用于：本地开发和测试

- **[Mock 模式指南](./mock-mode-guide.md) - Mock 模式使用和配置**
  - 包含：Mock 数据、Mock 服务、测试账号
  - 创建时间：2026-01-22
  - 适用于：无需外部 API 的开发和演示

- **[测试快速参考](./testing-quick-reference.md) - 测试命令和用例**
  - 包含：后端测试、前端测试、E2E 测试
  - 创建时间：2026-01-22
  - 适用于：编写和运行测试

### 📊 参考和对比

- **[部署方案对比](./deployment-comparison.md) - 不同部署方案的对比分析**
  - 包含：VM vs Cloud Run vs 本地部署
  - 创建时间：2026-01-22
  - 适用于：选择合适的部署方案

---

## 🗂️ Document Status

| 文档 | 状态 | 优先级 | 说明 |
|-----|------|--------|------|
| beginner-deploy-guide.md | ✅ 最新 | ⭐⭐⭐ | 完整部署指南，推荐新手 |
| git-deployment-guide.md | ✅ 最新 | ⭐⭐⭐ | 日常部署必读 |
| local-run.md | ✅ 最新 | ⭐⭐ | 本地开发必备 |
| mock-mode-guide.md | ✅ 最新 | ⭐⭐ | 测试和演示 |
| testing-quick-reference.md | ✅ 最新 | ⭐ | 测试参考 |
| deployment-comparison.md | ✅ 最新 | ⭐ | 方案选择参考 |

---

## 📝 Documentation Standards

所有文档都遵循以下标准：

### Header Format
```markdown
# Document Title

**Created:** YYYY-MM-DD
**Last Updated:** YYYY-MM-DD
**Purpose:** Brief description

---
```

### Naming Convention
- 使用 kebab-case: `deployment-guide.md`
- 使用描述性名称
- 使用英文命名

### Content Standards
- 清晰的目录结构
- 代码示例必须可运行
- 包含实际输出示例
- 标注最佳实践（Best Practice）
- 包含故障排查章节

---

## 🔄 Recently Updated

- **2026-01-23**: 重大更新
  - ✅ 合并冗余文档（删除 8 个重复/过时文档）
  - ✅ 重写 `beginner-deploy-guide.md` 为完整指南
  - ✅ 新增 `git-deployment-guide.md`
  - ✅ 所有文档更新为 Best Practice
  - ✅ 脚本文件夹重组（frequently-used / other）

---

## 📚 Removed Documents

以下文档已被删除或合并，内容已整合到核心文档中：

### 已删除（冗余/过时）
- ~~terraform-guide.md~~ → 合并到 `beginner-deploy-guide.md`
- ~~terraform-implementation-summary.md~~ → 合并到 `beginner-deploy-guide.md`
- ~~quick-deploy.md~~ → 合并到 `beginner-deploy-guide.md`
- ~~ci-cd-guide.md~~ → 合并到 `beginner-deploy-guide.md`
- ~~ci-cd-setup-summary.md~~ → 合并到 `beginner-deploy-guide.md`
- ~~gcp-deployment-guide.md~~ → Cloud Run 方案已弃用
- ~~local-mongodb-guide.md~~ → 合并到 `beginner-deploy-guide.md`
- ~~mock-implementation-summary.md~~ → 合并到 `mock-mode-guide.md`

**原因**: 避免文档冗余，确保单一信息源（Single Source of Truth）

---

## 🎓 Reading Path

### 对于新手

```
1. beginner-deploy-guide.md     ← 从头到尾读一遍
   ↓
2. git-deployment-guide.md       ← 学习日常部署
   ↓
3. local-run.md                  ← 设置本地开发环境
   ↓
4. 开始开发！                     ← 实践
```

### 对于有经验的开发者

```
1. git-deployment-guide.md       ← 了解 Git 部署流程
   ↓
2. beginner-deploy-guide.md      ← 快速浏览故障排查章节
   ↓
3. deployment-comparison.md      ← 了解不同方案
   ↓
4. 直接开始！                     ← 动手
```

---

## 🔗 External Resources

### Terraform
- [Terraform Documentation](https://www.terraform.io/docs)
- [GCP Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)

### GCP
- [Google Cloud Documentation](https://cloud.google.com/docs)
- [Compute Engine](https://cloud.google.com/compute/docs)
- [Cloud Logging](https://cloud.google.com/logging/docs)

### Best Practices
- [12-Factor App](https://12factor.net/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

---

## 🆘 Getting Help

### 文档问题
如果发现文档有错误或不清楚的地方：
1. 提交 GitHub Issue
2. 标注 `documentation` 标签
3. 说明问题所在

### 技术问题
如果遇到技术问题：
1. 查看相关文档的"故障排查"章节
2. 检查 `scripts/README.md` 中的故障排查部分
3. 提交 GitHub Issue（附带错误日志）

---

## 📊 Document Metrics

- **总文档数**: 7 个（精简后）
- **核心文档**: 2 个（beginner-deploy-guide + git-deployment-guide）
- **支持文档**: 5 个
- **平均更新周期**: 每周
- **文档覆盖率**: 100%

---

## 🎯 Future Plans

### 计划添加的文档

- [ ] **API Reference** - 完整的 API 文档
- [ ] **Architecture Guide** - 系统架构说明
- [ ] **Database Schema** - 数据库设计文档
- [ ] **Security Guide** - 安全最佳实践
- [ ] **Performance Tuning** - 性能优化指南

### 持续改进

- ✅ 保持文档简洁（避免冗余）
- ✅ 定期更新（跟随代码变化）
- ✅ 包含实际示例（可运行的代码）
- ✅ 用户反馈驱动（根据 Issue 改进）

---

## 📞 Maintainers

文档维护者：
- ClassArranger Team
- 欢迎贡献！查看 [Contributing Guide](../CONTRIBUTING.md)

---

**Last Updated:** 2026-01-23  
**Total Documents:** 7 核心文档 + 1 脚本说明  
**Status:** ✅ 最新 · 完整 · Best Practice
