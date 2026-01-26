# Cursor Rules 使用指南

## 📋 概述

本项目包含两个 Cursor Rules 文件：

1. **`.cursorrules`** - 主配置文件（Cursor IDE 会自动读取）
2. **`.cursorrules.examples`** - 示例规则参考（包含20个场景的示例）

---

## 🚀 快速开始

### 什么是 Cursor Rules？

Cursor Rules 是 Cursor IDE 的配置文件，用于指导 AI 助手：
- 遵循项目的代码风格
- 使用正确的架构模式
- 编写符合规范的代码
- 自动应用最佳实践

### 如何使用？

1. **自动生效**：Cursor IDE 会自动读取 `.cursorrules` 文件
2. **AI 助手会遵循**：当你使用 Cursor 的 AI 功能时，它会自动遵循这些规则
3. **无需额外配置**：文件放在项目根目录即可

---

## 📁 文件说明

### `.cursorrules` - 主配置文件

包含以下内容：

#### ✅ 项目概述
- 技术栈说明
- 项目结构

#### ✅ 代码风格指南
- 前端（React/JavaScript）规范
- 后端（Python/FastAPI）规范
- 命名约定
- 文件组织

#### ✅ 测试要求
- 前端测试规范
- 后端测试规范
- 覆盖率目标
- 测试命名

#### ✅ 代码质量
- 提交前检查
- Code Review 清单
- 安全指南
- 性能指南

#### ✅ 工作流
- Git 工作流
- 分支命名
- 提交消息格式
- PR 流程

#### ✅ 常见模式
- React 组件模式
- FastAPI 路由模式
- 错误处理模式

---

### `.cursorrules.examples` - 示例规则

包含 20 个不同场景的示例规则：

1. **代码生成规则** - 创建组件/API 时的规则
2. **代码审查规则** - PR 审查检查清单
3. **特定场景规则** - 用户输入、异步操作、状态管理
4. **测试规则** - 单元测试、集成测试
5. **性能优化规则** - 前端/后端性能
6. **安全规则** - 认证、数据保护
7. **错误处理规则** - 前端/后端错误处理
8. **数据库规则** - Firestore 查询、数据建模
9. **API 设计规则** - RESTful API、响应格式
10. **Git 工作流规则** - 提交消息、分支策略
11. **文档规则** - 代码注释、README
12. **依赖管理规则** - 添加/更新依赖
13. **部署规则** - 部署前后检查
14. **监控和日志规则** - 日志记录、监控指标
15. **可访问性规则** - 无障碍设计
16. **国际化规则** - 多语言支持
17. **移动端规则** - 响应式设计
18. **CI/CD 规则** - 流水线配置
19. **代码重构规则** - 重构步骤
20. **调试规则** - 调试流程

---

## 🎯 使用场景

### 场景 1：创建新组件

当你要求 AI 创建新组件时，它会：
- ✅ 使用函数式组件和 hooks
- ✅ 添加 PropTypes 或 TypeScript 类型
- ✅ 遵循命名约定
- ✅ 自动添加测试
- ✅ 使用正确的文件结构

### 场景 2：编写 API 端点

当你要求 AI 创建 API 端点时，它会：
- ✅ 使用 Pydantic 模型
- ✅ 添加认证依赖
- ✅ 实现错误处理
- ✅ 编写测试
- ✅ 添加文档

### 场景 3：代码审查

当你要求 AI 审查代码时，它会：
- ✅ 检查测试覆盖率
- ✅ 验证错误处理
- ✅ 检查安全问题
- ✅ 检查性能问题
- ✅ 验证文档更新

---

## 🔧 自定义规则

### 如何添加新规则？

编辑 `.cursorrules` 文件，添加新规则：

```markdown
## 新规则类别

### 规则名称
描述规则的内容和目的

### 具体规则
1. 规则 1
2. 规则 2
3. 规则 3
```

### 如何修改现有规则？

直接编辑 `.cursorrules` 文件中对应的部分。

### 如何参考示例？

查看 `.cursorrules.examples` 文件，找到相关场景的示例，然后：
1. 复制示例规则
2. 根据项目需求修改
3. 添加到 `.cursorrules` 文件

---

## 📝 规则示例

### 示例 1：组件创建规则

```markdown
When creating a new React component:
1. Use functional component with hooks
2. Add PropTypes or TypeScript types
3. Include error boundaries
4. Write unit tests (minimum 3 test cases)
5. Add JSDoc comments
```

### 示例 2：API 端点规则

```markdown
When creating a new FastAPI endpoint:
1. Define request/response models using Pydantic
2. Add authentication dependency
3. Implement proper error handling
4. Write unit tests
5. Add OpenAPI documentation
```

### 示例 3：测试规则

```markdown
When writing unit tests:
1. Test happy path first
2. Test edge cases
3. Test error conditions
4. Use descriptive test names
5. Aim for > 80% coverage
```

---

## 🎓 最佳实践

### 1. 保持规则更新
- 定期审查规则
- 根据项目发展更新
- 删除过时的规则

### 2. 规则要具体
- 避免模糊的描述
- 提供明确的指导
- 包含示例

### 3. 规则要可执行
- 确保规则可以实际应用
- 避免过于理想化
- 考虑实际情况

### 4. 团队协作
- 与团队讨论规则
- 确保规则被理解
- 定期回顾规则效果

---

## 🔍 验证规则是否生效

### 方法 1：测试 AI 助手

尝试以下命令，观察 AI 是否遵循规则：

```
"创建一个新的学生管理组件"
"添加一个新的日记 API 端点"
"为这个函数编写测试"
```

### 方法 2：检查生成的代码

查看 AI 生成的代码是否符合规则：
- ✅ 命名约定
- ✅ 代码结构
- ✅ 测试覆盖
- ✅ 文档注释

---

## 📚 相关文档

- [CI/CD 指南](./CI_CD_GUIDE.md) - CI/CD 相关规则
- [测试快速参考](./TESTING_QUICK_REFERENCE.md) - 测试相关规则
- [GCP 部署指南](./GCP_DEPLOYMENT_GUIDE.md) - 部署相关规则

---

## 🆘 常见问题

### Q: Cursor 没有读取规则？
A: 确保 `.cursorrules` 文件在项目根目录，文件名正确。

### Q: 如何让规则更严格？
A: 在规则中添加更多具体要求，使用"必须"、"应该"等明确词汇。

### Q: 规则太多怎么办？
A: 可以分模块组织规则，或者创建多个规则文件。

### Q: 如何禁用某些规则？
A: 注释掉或删除对应的规则部分。

---

## 🎉 总结

现在你的项目有了完整的 Cursor Rules 配置：

✅ **主配置文件** (`.cursorrules`) - 包含项目特定的规则
✅ **示例文件** (`.cursorrules.examples`) - 20个场景的示例规则
✅ **使用指南** (本文档) - 如何使用和自定义规则

AI 助手现在会：
- 🎯 遵循你的代码风格
- 🎯 使用正确的架构模式
- 🎯 自动应用最佳实践
- 🎯 生成符合规范的代码

开始使用 Cursor AI 功能，体验智能代码生成吧！🚀

