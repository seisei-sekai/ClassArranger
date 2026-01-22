# Mock模式使用指南

**Created:** 2026-01-22  
**Last Updated:** 2026-01-22  
**Purpose:** 说明如何使用Mock模式运行项目，无需Firebase和OpenAI API

---

## 📋 什么是Mock模式？

Mock模式是为了简化开发和演示而设计的运行模式，它：

- ✅ **不需要Firebase** - 使用JWT进行用户认证
- ✅ **不需要OpenAI API** - 使用预设的AI响应
- ✅ **只需要MongoDB** - 使用MongoDB Atlas免费版（或本地MongoDB）
- ✅ **完整功能演示** - 所有核心功能都能正常使用
- ✅ **快速部署** - 5分钟即可开始使用

---

## 🎯 适用场景

Mock模式适合：

1. **演示和测试** - 快速展示项目功能
2. **本地开发** - 不需要配置复杂的外部服务
3. **学习和练习** - 适合学习项目架构
4. **成本控制** - 不需要付费API就能运行

⚠️ **不适合生产环境** - Mock模式仅供开发和演示使用

---

## 🔧 功能对比

| 功能 | 标准模式 | Mock模式 |
|------|---------|----------|
| 用户注册 | Firebase Auth | JWT + MongoDB |
| 用户登录 | Firebase Auth | JWT + MongoDB |
| 用户管理 | Firestore | MongoDB |
| AI排课建议 | OpenAI API | 预设算法 |
| AI洞察 | OpenAI API | 预设响应 |
| 数据持久化 | Firestore | MongoDB |
| 部署难度 | 较高 | 较低 |
| 运行成本 | 较高 | 较低 |

---

## 🚀 快速开始

### 方法一：使用Docker Compose（推荐）

1. **配置环境变量**

```bash
# 复制配置文件
cp .env.mock.example .env

# 编辑 .env，填入MongoDB连接字符串
# MONGODB_URL=mongodb+srv://...
```

2. **启动服务**

```bash
docker-compose up
```

3. **访问应用**

- 前端：http://localhost:5173
- 后端API：http://localhost:8000
- API文档：http://localhost:8000/docs

### 方法二：手动运行

**后端：**

```bash
cd backend
pip install -r requirements.txt

# 设置环境变量
export MONGODB_URL="your-mongodb-connection-string"
export DEV_MODE=true
export USE_MOCK_AUTH=true
export USE_MOCK_AI=true

# 启动
uvicorn app.main:app --reload
```

**前端：**

```bash
cd frontend
npm install

# 创建 .env.local
echo "VITE_API_URL=http://localhost:8000" > .env.local
echo "VITE_USE_MOCK_AUTH=true" >> .env.local

# 启动
npm run dev
```

---

## 🔑 测试账号

Mock模式提供了预设的测试账号：

### 账号1：普通用户
- **邮箱**: test@example.com
- **密码**: password
- **用途**: 测试基本功能

### 账号2：管理员
- **邮箱**: admin@example.com
- **密码**: admin123
- **用途**: 测试管理功能

### 注册新账号
你也可以注册新账号：
- 任意邮箱格式即可
- 密码需要6位以上
- 数据保存在MongoDB

---

## 📡 API端点

### 认证相关

```bash
# 登录
POST /auth/login
Body: {"email": "test@example.com", "password": "password"}

# 注册
POST /auth/register
Body: {"email": "new@example.com", "password": "password123", "username": "用户名"}

# 获取当前用户
GET /auth/me
Headers: {"Authorization": "Bearer YOUR_TOKEN"}

# 登出
POST /auth/logout
Headers: {"Authorization": "Bearer YOUR_TOKEN"}

# 获取测试账号列表
GET /auth/test-accounts
```

### AI相关

```bash
# 生成AI洞察
POST /ai/insight
Headers: {"Authorization": "Bearer YOUR_TOKEN"}
Body: {"content": "今天学习了React..."}

# 获取排课建议
POST /ai/schedule-suggestions
Headers: {"Authorization": "Bearer YOUR_TOKEN"}
Body: {"students": [...], "teachers": [...]}

# 生成课程摘要
POST /ai/course-summary
Headers: {"Authorization": "Bearer YOUR_TOKEN"}
Body: {"content": "课程内容...", "subject": "数学"}

# 分析学生表现
POST /ai/analyze-performance
Headers: {"Authorization": "Bearer YOUR_TOKEN"}
Body: {"student_id": "123", "records": [...]}

# 获取教学建议
POST /ai/teaching-tips
Headers: {"Authorization": "Bearer YOUR_TOKEN"}
Body: {"subject": "数学", "student_level": "中级"}
```

---

## 🔨 开发指南

### 前端集成

```javascript
// 使用Mock认证服务
import mockAuth from './services/mockAuthService';

// 登录
const user = await mockAuth.login('test@example.com', 'password');

// 注册
const newUser = await mockAuth.register('new@example.com', 'password', '用户名');

// 获取当前用户
const currentUser = await mockAuth.getCurrentUser();

// 认证请求
const response = await mockAuth.authFetch('/api/some-endpoint', {
  method: 'POST',
  body: JSON.stringify(data)
});
```

```javascript
// 使用Mock AI服务
import mockAI from './services/mockAIService';

// 生成洞察
const insight = await mockAI.generateInsight('内容...');

// 获取排课建议
const suggestions = await mockAI.getScheduleSuggestions(students, teachers);

// 生成课程摘要
const summary = await mockAI.generateCourseSummary('内容...', '数学');
```

### 后端扩展

```python
# 添加新的Mock AI功能
# backend/app/services/mock_ai_service.py

def generate_new_feature(input_data: str) -> Dict:
    """新的Mock AI功能"""
    return {
        "result": "Mock结果",
        "confidence": 0.95,
        "note": "这是Mock响应"
    }
```

---

## 🌐 部署到GCP

使用Mock模式部署到GCP Cloud Run：

```bash
# 设置环境变量
export PROJECT_ID='your-gcp-project-id'
export MONGODB_URL='your-mongodb-connection-string'

# 运行部署脚本
./scripts/mock-deploy.sh
```

详细步骤请查看 [小白部署指南](./beginner-deploy-guide.md)

---

## ⚙️ 配置说明

### 环境变量

**后端：**

| 变量 | 说明 | 默认值 | 必需 |
|------|------|--------|------|
| `MONGODB_URL` | MongoDB连接字符串 | - | ✅ |
| `MONGODB_DB_NAME` | 数据库名称 | xdf_class_arranger | ❌ |
| `DEV_MODE` | 开发模式 | true | ❌ |
| `USE_MOCK_AUTH` | 使用Mock认证 | true | ❌ |
| `USE_MOCK_AI` | 使用Mock AI | true | ❌ |
| `API_HOST` | API主机 | 0.0.0.0 | ❌ |
| `API_PORT` | API端口 | 8000 | ❌ |

**前端：**

| 变量 | 说明 | 默认值 | 必需 |
|------|------|--------|------|
| `VITE_API_URL` | 后端API地址 | http://localhost:8000 | ✅ |
| `VITE_USE_MOCK_AUTH` | 使用Mock认证 | true | ❌ |

---

## 🔐 安全性说明

⚠️ **Mock模式的安全注意事项：**

1. **仅用于开发和演示** - 不要在生产环境使用
2. **JWT密钥** - 使用了固定的开发密钥，生产环境必须更换
3. **密码加密** - 使用了bcrypt，但建议生产环境使用更强的策略
4. **测试账号** - `/auth/test-accounts` 端点在生产环境应该删除
5. **数据验证** - Mock模式简化了部分验证逻辑

### 升级到生产模式

如果要部署到生产环境，建议：

1. 替换Mock认证为Firebase或其他OAuth服务
2. 集成真实的AI API（OpenAI、Claude等）
3. 更换为强密码策略和JWT密钥
4. 添加更严格的输入验证
5. 启用HTTPS和CORS白名单
6. 添加请求限流和安全日志

---

## 📊 监控和调试

### 查看日志

**本地：**
```bash
# 后端日志
docker-compose logs -f backend

# 前端日志
docker-compose logs -f frontend
```

**GCP Cloud Run：**
```bash
# 后端日志
gcloud run services logs read classarranger-backend --region asia-northeast1 --limit 50

# 前端日志
gcloud run services logs read classarranger-frontend --region asia-northeast1 --limit 50
```

### 健康检查

```bash
# 后端健康检查
curl http://localhost:8000/health

# AI服务健康检查
curl http://localhost:8000/ai/health

# 测试认证
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

---

## 🐛 常见问题

### Q1: MongoDB连接失败？

**解决方案：**
1. 检查MongoDB Atlas网络访问设置（允许0.0.0.0/0）
2. 确认连接字符串中的密码正确
3. 检查数据库用户权限

### Q2: JWT Token无效？

**解决方案：**
1. 检查Token是否过期（默认7天）
2. 清除浏览器localStorage重新登录
3. 确认后端JWT密钥一致

### Q3: AI功能返回空结果？

**原因：**
Mock AI返回的是预设响应，可能需要根据实际输入调整。

**解决方案：**
编辑 `backend/app/services/mock_ai_service.py` 自定义响应。

### Q4: 前端无法连接后端？

**解决方案：**
1. 检查 `VITE_API_URL` 配置是否正确
2. 确认后端服务已启动
3. 检查CORS配置

---

## 📚 相关文档

- [小白部署指南](./beginner-deploy-guide.md) - GCP部署详细步骤
- [本地运行指南](./local-run.md) - 本地开发环境设置
- [API文档](http://localhost:8000/docs) - FastAPI自动生成的API文档

---

## 🔄 从Mock模式迁移到生产模式

参考 [完整部署指南](./gcp-deployment-guide.md) 了解如何集成真实的Firebase和OpenAI API。

---

**享受Mock模式带来的便利！🚀**

