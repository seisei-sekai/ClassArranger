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

- **[⭐ 用户管理页面](./user-management-page.md) - 管理员CRUD用户界面**
  - 包含：查看所有用户、创建用户、编辑用户、删除用户、查看详情、表格界面
  - 创建时间：2026-02-02
  - 状态：✅ **最新 · 完整 · Admin Only**
  - 适用于：管理员管理系统用户账户

- **[⭐ 认证与备份系统设置指南](./auth-and-backup-setup.md) - 用户登录和数据库备份完整指南**
  - 包含：JWT认证、角色管理、自动备份、手动备份、MongoDB集成、安全配置
  - 创建时间：2026-02-02
  - 最后更新：2026-02-02
  - 状态：✅ **最新 · 完整 · Production Ready**
  - 适用于：设置用户认证、管理数据库备份、角色权限配置

- **[⭐ LocalStorage数据持久化](./localStorage-implementation.md) - 自动保存所有数据到浏览器**
  - 包含：架构设计、自动保存、自动加载、清空功能、Storage API、故障排查
  - 创建时间：2026-01-27
  - 最后更新：2026-01-27
  - 状态：✅ **最新 · 完整 · Production Ready**
  - 适用于：理解数据持久化机制、localStorage管理、数据恢复

- **[本地运行指南](./local-run.md) - 本地开发环境设置**
  - 包含：Docker Compose 本地开发、热重载、调试
  - 创建时间：2026-01-22
  - 适用于：本地开发和测试

- **[⭐ 实验页面实施总结](./experiment-page-implementation.md) - 1v1排课系统实验页面**
  - 包含：数据结构文档、算法说明、可视化演示、随机数据生成
  - 创建时间：2026-02-02
  - 状态：✅ **最新 · 完整 · 教学演示**
  - 适用于：理解排课算法、测试排课系统、教学演示

- **[⭐ Experiment2实施总结](./experiment2-implementation.md) - 前途塾1v1排课系统**
  - 包含：真实业务数据支持、Excel导入、三方匹配、增强日历、数据持久化
  - 创建时间：2026-02-02
  - 状态：✅ **最新 · 生产可用 · 管理员友好**
  - 适用于：实际业务排课、非技术人员使用、真实数据处理

- **[⭐ Experiment3设置总结](./experiment3-setup.md) - Function完整版克隆**
  - 包含：70个文件完整复制、AI集成、NLP解析、Web Worker、FullCalendar
  - 创建时间：2026-02-02
  - 状态：✅ **最新 · 完整功能 · 高级特性**
  - 适用于：复杂排课场景、AI辅助、大规模数据、生产环境（完整版）

- **[⭐⭐⭐ Experiment3优化实施总结](./experiment3-optimization-summary.md) - 修复Function核心问题 - 必读**
  - 包含：集成Exp1/2算法、混合日历视图、算法适配器、数据流整合、完整测试
  - 创建时间：2026-02-02
  - 状态：✅ **最新 · 核心修复完成 · 生产可用 · 推荐使用**
  - 适用于：从Function迁移、真实业务排课、三种算法选择、混合视图
  - 快速指南：`frontend/src/XdfClassArranger/Experiment3/QUICK_START.md`

- **[⭐⭐⭐⭐⭐ Experiment3新约束系统指南](./experiment3-constraint-system-guide.md) - 10类约束系统完整指南**
  - 包含：10类约束详解、AI自动解析、手动编辑、测试数据生成、FAQ
  - 创建时间：2026-02-03
  - 状态：✅ **最新 · 生产可用 · 非技术人员友好**
  - 适用于：所有使用者、学管人员、教务管理
  - 快速参考：`frontend/src/XdfClassArranger/Experiment3/CONSTRAINT_SYSTEM_QUICK_START.md`

- **[Experiment3新约束系统实施总结](./experiment3-constraint-system-implementation.md) - 技术实施文档**
  - 包含：架构设计、文件清单、性能指标、测试覆盖、技术创新
  - 创建时间：2026-02-03
  - 状态：✅ **已完成 · 全部10个阶段**
  - 适用于：开发人员、技术团队

- **[Experiment3 Dark Mode修复](./experiment3-dark-mode-fix.md)**
  - 包含：Dark Mode显示问题修复、CSS变量使用、Classroom Panel宽度调整
  - 创建时间：2026-02-02
  - 状态：✅ 已修复
  - 修复内容：日历控制面板dark mode适配、classroom panel布局优化

- **[OpenAI API配置指南](./openai-setup-guide.md)**
  - 包含：获取API密钥、配置方法、错误排查、费用估算、安全建议
  - 创建时间：2026-02-02
  - 状态：📖 配置指南
  - 适用于：需要使用AI智能解析功能的用户

- **[实验页面对比指南](./experiments-comparison.md) - 三个实验页面完整对比**
  - 包含：详细功能对比、性能分析、使用场景推荐、迁移指南
  - 创建时间：2026-02-02
  - 状态：✅ **最新 · 完整对比 · 选择指南**
  - 适用于：选择合适的实验页面、了解差异、规划升级路径

- **[实验页面问题修复日志](./experiment-page-bugfix-log.md) - Bug修复记录**
  - 包含：ga.run错误修复、时间槽格式修复、详细测试步骤
  - 创建时间：2026-02-02
  - 状态：✅ **问题已解决**
  - 适用于：故障排查、版本更新参考

- **[Mock 模式指南](./mock-mode-guide.md) - Mock 模式使用和配置**
  - 包含：Mock 数据、Mock 服务、测试账号
  - 创建时间：2026-01-22
  - 适用于：无需外部 API 的开发和演示

- **[测试快速参考](./testing-quick-reference.md) - 测试命令和用例**
  - 包含：后端测试、前端测试、E2E 测试
  - 创建时间：2026-01-22
  - 适用于：编写和运行测试

### 🤖 AI功能指南

- **[⭐ NLP约束转换系统使用指南](./NLP约束转换系统使用指南.md) - AI智能解析学生时间约束**
  - 包含：系统概述、快速开始、详细使用流程、置信度理解、常见模式、最佳实践、故障排除
  - 创建时间：2026-01-23
  - 最后更新：2026-01-26
  - 状态：✅ **最新 · 完整 · Production Ready**
  - 适用于：使用OpenAI API将自然语言转换为排课约束
  - 修复记录：[NLP数据预览修复](./hotfix-nlp-data-preview.md)

- **[NLP约束转换系统实施总结](./NLP约束转换系统实施总结.md) - 完整的实施文档**
  - 包含：技术架构、文件清单、核心组件详解、测试策略、性能指标、成本分析
  - 创建时间：2026-01-23
  - 适用于：开发者参考和系统维护

- **[⭐ AI智能数据清洗使用指南](./AI智能数据清洗使用指南.md) - AI自动清洗学生Excel数据**
  - 包含：功能概述、AI理解能力、操作步骤、测试示例、最佳实践、故障排查
  - 创建时间：2026-01-23
  - 最后更新：2026-01-23
  - 状态：✅ **最新 · 完整 · Production Ready**
  - 适用于：解决课时数据模糊、格式不标准等问题

### 📅 排课系统指南

- **[⭐⭐⭐⭐⭐ 排课系统核心功能技术文档](./排课系统核心功能技术文档.md) - 三大核心按钮完整技术解析**
  - 包含：系统架构、数据结构、约束系统(8硬+8软)、测试数据生成、一键排课算法(CSP+启发式)、排课调整机制、核心算法详解、性能优化
  - 创建时间：2026-02-05
  - 最后更新：2026-02-05
  - 状态：✅ **最新 · 超详细 · 技术深度 · 必读**
  - 适用于：理解系统原理、学习算法、技术面试、系统维护、新手学习
  - 核心内容：
    - 7×150时间槽系统
    - 16种约束类型与权重
    - TripleMatchingEngine三方匹配引擎
    - Most Constrained First启发式策略
    - 组合评分算法 (100分制)
    - 冲突检测与调整
    - 性能优化 (10x-100x提升)

- **[⭐⭐⭐ 排课调整系统实施总结](./schedule-adjustment-implementation.md) - 冲突解决与迭代调整**
  - 包含：冲突分析、智能建议、数据修改追踪、批量重试、修改历史、完整流程
  - 创建时间：2026-02-03
  - 最后更新：2026-02-03
  - 状态：✅ **最新 · 模块化设计 · Production Ready**
  - 适用于：解决排课冲突、优化排课结果、追踪数据修改

- **[⭐⭐⭐⭐⭐ 排课调整可视化编辑器](./schedule-adjustment-visual-editor.md) - 图形化数据修改界面**
  - 包含：双模式编辑(粘贴/选择)、下拉选择器、时间选择器、一键重新排课、完整教程
  - 创建时间：2026-02-05
  - 最后更新：2026-02-05
  - 状态：✅ **最新 · 生产可用 · 用户友好**
  - 适用于：可视化修改学生/教师/教室数据、快速调整时间约束、直观的排课调整

- **[排课调整可视化编辑器实施总结](./schedule-adjustment-visual-editor-implementation.md) - 技术实施文档**
  - 包含：架构设计、组件修改清单、代码实现、测试验证、部署说明
  - 创建时间：2026-02-05
  - 最后更新：2026-02-05
  - 状态：✅ **已完成 · 向后兼容 · ~1200行代码**
  - 适用于：开发人员、代码审查、技术参考

- **[⭐ 课时计算和一键排课使用指南](./课时计算和一键排课使用指南.md) - 智能课时计算与悬浮一键排课**
  - 包含：智能课时计算、有效周期解析、悬浮一键排课按钮、完整使用流程、常见问题
  - 创建时间：2026-01-23
  - 最后更新：2026-01-23
  - 状态：✅ **最新 · 完整 · Production Ready**
  - 适用于：学习新的课时计算逻辑和一键排课功能

- **[⭐ Schedule数据结构重构](./schedule-refactoring.md) - 排课数据结构清晰化重构**
  - 包含：清晰的类型定义、模块化架构、状态管理Hook、核心服务逻辑、单元测试
  - 创建时间：2026-01-26
  - 最后更新：2026-01-26
  - 状态：✅ **最新 · 完整 · Tested**
  - 适用于：理解排课数据结构、维护排课逻辑、编写测试

- **[Schedule快速参考](./schedule-quick-reference.md) - Schedule模块API速查**
  - 包含：Import路径、数据结构、常用操作、Hook用法、测试命令
  - 创建时间：2026-01-26
  - 状态：✅ **实用工具 · 快速参考**
  - 适用于：日常开发中快速查找Schedule相关API

- **[🔧 一键排课按钮灰色问题诊断](./一键排课按钮灰色问题诊断.md) - 故障排查指南**
  - 包含：问题诊断、Excel数据格式检查、常见错误、解决方案、快速测试
  - 创建时间：2026-01-23
  - 状态：✅ **实用工具 · 故障排查**
  - 适用于：一键排课按钮无法点击的问题诊断

- **[🔧 Excel数据复制故障排查](./Excel数据复制故障排查.md) - 数据复制问题解决**
  - 包含：列错位诊断、正确复制方法、分隔符检查、浏览器控制台诊断、常见场景解决
  - 创建时间：2026-01-23
  - 状态：✅ **实用工具 · 故障排查**
  - 适用于：Excel复制后数据挤在一起、列错位的问题

### 🎨 UI/UX功能指南

- **[⭐ Dark Mode实施指南](./Dark_Mode_Implementation.md) - 暗色模式完整实现文档**
  - 包含：架构设计、CSS变量系统、主题切换、四个页面全覆盖、测试清单、维护指南
  - 创建时间：2026-01-26
  - 最后更新：2026-01-26
  - 状态：✅ **最新 · 完整 · Production Ready**
  - 适用于：了解暗色模式实现细节和维护方式

- **[Layout Height Adjustment](./layout-height-adjustment.md) - 面板高度优化**
  - 包含：主内容区域扩展、侧边栏延伸、教室面板上移
  - 创建时间：2026-01-26
  - 状态：✅ **UI优化**
  - 适用于：了解排课页面布局高度调整

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
| NLP约束转换系统使用指南.md | ✅ 最新 | ⭐⭐⭐ | AI智能排课约束解析 |
| NLP约束转换系统实施总结.md | ✅ 最新 | ⭐⭐ | 技术实施文档 |

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

- **2026-02-02**: 用户管理界面
  - ✅ 新增 `user-management-page.md` - 完整的用户管理CRUD界面文档
  - ✅ 创建管理员专用用户管理页面 `/user_management`
  - ✅ 表格视图显示所有用户
  - ✅ 创建、查看、编辑、删除用户功能
  - ✅ 角色徽章和颜色编码
  - ✅ 模态窗口表单界面
  - ✅ 完整的验证和错误处理
  - ✅ 统一的日系性冷淡风格设计

- **2026-02-02**: 认证与备份系统
  - ✅ 新增 `auth-and-backup-setup.md` - 完整的认证和备份系统指南
  - ✅ 实现 JWT 认证和角色管理（Admin, Teacher, Staff, Student）
  - ✅ MongoDB数据库集成替代内存存储
  - ✅ 自动备份系统（每周备份，30天保留）
  - ✅ 手动备份、下载、删除功能
  - ✅ 登录页面和受保护路由
  - ✅ 管理员专用注册页面

- **2026-01-27**: 数据持久化功能
  - ✅ 新增 `localStorage-implementation.md` - 完整的localStorage持久化系统
  - ✅ 实现所有数据自动保存到localStorage
  - ✅ 页面刷新/浏览器重启后数据自动恢复
  - ✅ 清空按钮功能增强（清空所有数据）

- **2026-01-23**: 重大更新
  - ✅ 合并冗余文档（删除 8 个重复/过时文档）
  - ✅ 重写 `beginner-deploy-guide.md` 为完整指南
  - ✅ 新增 `git-deployment-guide.md`
  - ✅ 新增 `NLP约束转换系统使用指南.md` - AI智能约束解析系统
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

- **总文档数**: 9 个（精简后）
- **核心文档**: 3 个（beginner-deploy-guide + git-deployment-guide + NLP使用指南）
- **支持文档**: 6 个
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

**Last Updated:** 2026-02-05  
**Total Documents:** 11 核心文档 + 1 脚本说明  
**Status:** ✅ 最新 · 完整 · Best Practice