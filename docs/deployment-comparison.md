# 部署方案对比

**Created:** 2026-01-22  
**Last Updated:** 2026-01-22  
**Purpose:** 对比不同部署方案的优缺点，帮助选择合适的部署方式

---

## 📋 方案概览

本项目提供三种部署方案：

| 方案 | 技术栈 | 难度 | 成本 | 适用场景 |
|------|--------|------|------|---------|
| **方案一：GCP VM** | VM + Docker + 本地MongoDB | ⭐⭐ | $27/月 | 推荐，稳定可靠 |
| **方案二：Cloud Run** | Cloud Run + MongoDB Atlas | ⭐⭐⭐ | $0-10/月 | 无服务器，按需付费 |
| **方案三：本地部署** | Docker Compose | ⭐ | $0 | 开发测试 |

---

## 方案一：GCP VM + 本地MongoDB 🌟推荐

### 架构

```
GCP Compute Engine VM (e2-medium)
├── Docker Compose
│   ├── Frontend (Nginx, Port 80)
│   ├── Backend (FastAPI, Port 8000)
│   └── MongoDB (Port 27017, 内部)
└── 持久化磁盘 (20GB)
```

### 优点

✅ **简单易用**
- 一键部署脚本
- 无需配置外部服务
- 只需GCP账号

✅ **稳定可靠**
- VM持续运行
- 无冷启动问题
- 数据持久化在本地

✅ **成本可控**
- 固定月费约$27
- 可以停止VM节省费用
- 新用户有$300免费额度

✅ **完全控制**
- 可以SSH访问
- 可以自由配置
- 方便调试

### 缺点

❌ **固定成本**
- 即使无访问也收费（运行时）
- 需要手动管理

❌ **需要运维**
- 需要更新系统
- 需要监控资源

### 部署步骤

```bash
# 1. 设置项目ID
export PROJECT_ID='your-gcp-project-id'

# 2. 运行部署脚本
./scripts/deploy-gcp-vm.sh

# 3. 获取访问地址
# 脚本会自动显示外部IP
```

### 成本明细

```
VM实例 (e2-medium):  $25/月
磁盘 (20GB):         $2/月
网络出站:            $0-5/月
─────────────────────────
总计:               约$27-32/月
```

**节省方法:**
- 使用e2-small（$13/月）
- 不用时停止VM（只付磁盘费$2/月）
- 使用新用户$300免费额度

### 适用场景

- ✅ 演示和测试
- ✅ 小型生产环境（10-50用户）
- ✅ 需要稳定运行
- ✅ 需要完全控制

### 相关文档

- [小白部署指南](./beginner-deploy-guide.md)
- [本地MongoDB指南](./local-mongodb-guide.md)

---

## 方案二：GCP Cloud Run + MongoDB Atlas

### 架构

```
GCP Cloud Run (无服务器)
├── Frontend Service
│   └── 自动扩缩容 (0-5实例)
└── Backend Service
    └── 自动扩缩容 (0-10实例)
        │
        └──> MongoDB Atlas (云端)
            └── M0 Free Tier (512MB)
```

### 优点

✅ **按需付费**
- 无请求时不收费
- 自动扩缩容
- 适合低频访问

✅ **无需运维**
- 自动更新
- 自动扩展
- 高可用

✅ **低成本（低访问量）**
- 免费额度内：$0
- 低访问：$1-5/月

### 缺点

❌ **冷启动**
- 首次访问慢（2-3秒）
- 用户体验不佳

❌ **需要外部数据库**
- 需要配置MongoDB Atlas
- 多一个服务要管理

❌ **成本不可预测**
- 高访问量时费用上升
- 需要监控

### 部署步骤

```bash
# 1. 注册MongoDB Atlas
# 2. 获取连接字符串
# 3. 设置环境变量
export PROJECT_ID='your-gcp-project-id'
export MONGODB_URL='your-mongodb-atlas-connection-string'

# 4. 运行部署脚本
./scripts/mock-deploy.sh
```

### 成本明细

```
MongoDB Atlas (M0):     $0/月
Cloud Run (低访问):      $0-5/月
Cloud Run (中等访问):    $5-20/月
─────────────────────────
总计:                  $0-20/月
```

### 适用场景

- ✅ 低频访问应用
- ✅ 预算有限
- ✅ 不介意冷启动
- ✅ 需要自动扩展

### 相关文档

- [完整部署指南](./gcp-deployment-guide.md)
- [快速部署指南](./quick-deploy.md)

---

## 方案三：本地部署

### 架构

```
本地机器
└── Docker Compose
    ├── Frontend (Port 5173)
    ├── Backend (Port 8000)
    └── MongoDB (Port 27017)
```

### 优点

✅ **完全免费**
- 无任何云服务费用
- 使用本地资源

✅ **快速迭代**
- 代码热重载
- 即时调试
- 无部署延迟

✅ **隐私安全**
- 数据在本地
- 无外部访问

### 缺点

❌ **无法公网访问**
- 只能本地访问
- 无法演示给他人

❌ **不稳定**
- 机器关闭服务停止
- 需要手动管理

❌ **性能受限**
- 取决于本地机器配置

### 部署步骤

```bash
# 1. 启动服务
docker-compose up

# 2. 访问
# Frontend: http://localhost:5173
# Backend: http://localhost:8000
```

### 成本

```
完全免费 ($0)
```

### 适用场景

- ✅ 本地开发
- ✅ 功能测试
- ✅ 学习实验
- ❌ 不适合演示或生产

### 相关文档

- [本地运行指南](./local-run.md)
- [Mock模式指南](./mock-mode-guide.md)

---

## 🔍 详细对比

### 功能对比

| 功能 | GCP VM | Cloud Run | 本地 |
|------|--------|-----------|------|
| 公网访问 | ✅ | ✅ | ❌ |
| 固定IP | ✅可选 | ❌ | ❌ |
| HTTPS | ⚠️需配置 | ✅自动 | ❌ |
| 自动扩展 | ❌ | ✅ | ❌ |
| SSH访问 | ✅ | ❌ | ✅ |
| 数据持久化 | ✅ | ⚠️需外部 | ✅ |
| 冷启动 | ❌无 | ✅有 | ❌无 |

### 性能对比

| 指标 | GCP VM | Cloud Run | 本地 |
|------|--------|-----------|------|
| 响应时间 | 100-300ms | 100-300ms (热启动)<br>2-3s (冷启动) | <50ms |
| 并发支持 | 10-50用户 | 自动扩展 | 取决于机器 |
| 可用性 | 99%+ | 99.9%+ | 取决于本地 |
| 地域延迟 | 取决于区域 | 取决于区域 | 无 |

### 成本对比（月费用）

**低访问量（100次/天）:**
- GCP VM: $27
- Cloud Run: $0-1
- 本地: $0

**中等访问量（1000次/天）:**
- GCP VM: $27
- Cloud Run: $5-10
- 本地: $0

**高访问量（10000次/天）:**
- GCP VM: $27（可能需要升级）
- Cloud Run: $20-50
- 本地: $0（但无法支持）

---

## 🎯 推荐选择

### 场景一：演示和测试
**推荐：GCP VM** ✅
- 理由：稳定可靠，无冷启动，成本固定
- 费用：可使用免费额度

### 场景二：小型生产环境
**推荐：GCP VM** ✅
- 理由：性能稳定，易于管理，成本可预测
- 费用：$27/月可接受

### 场景三：低频访问应用
**推荐：Cloud Run** ✅
- 理由：按需付费，低成本
- 费用：可能$0-5/月

### 场景四：本地开发
**推荐：本地部署** ✅
- 理由：快速迭代，完全免费
- 费用：$0

### 场景五：预算有限
**推荐：Cloud Run** ✅
- 理由：免费额度内可能$0
- 或者：使用GCP新用户$300免费额度

---

## 🚀 迁移路径

### 从本地 → GCP VM

```bash
# 1. 备份本地数据
docker exec mongodb mongodump --archive > backup.archive

# 2. 部署GCP VM
export PROJECT_ID='your-project-id'
./scripts/deploy-gcp-vm.sh

# 3. 恢复数据到GCP
# (参考 local-mongodb-guide.md)
```

### 从GCP VM → Cloud Run

```bash
# 1. 备份VM数据到MongoDB Atlas
# 2. 部署Cloud Run
export PROJECT_ID='your-project-id'
export MONGODB_URL='mongodb-atlas-connection-string'
./scripts/mock-deploy.sh

# 3. 删除VM
gcloud compute instances delete classarranger-vm
```

### 从Cloud Run → GCP VM

```bash
# 1. 导出MongoDB Atlas数据
# 2. 部署GCP VM
export PROJECT_ID='your-project-id'
./scripts/deploy-gcp-vm.sh

# 3. 导入数据
# 4. 删除Cloud Run服务
```

---

## 💡 最佳实践

### 开发阶段
1. 本地开发和测试
2. 使用Git版本控制
3. 编写单元测试

### 演示阶段
1. 部署到GCP VM
2. 使用测试数据
3. 准备演示脚本

### 生产阶段
1. 根据访问量选择方案
2. 配置监控和告警
3. 定期备份数据
4. 设置HTTPS

---

## 📚 相关文档

### 部署指南
- [小白部署指南](./beginner-deploy-guide.md) - GCP VM方案
- [完整部署指南](./gcp-deployment-guide.md) - Cloud Run方案
- [本地运行指南](./local-run.md) - 本地方案

### 技术文档
- [Mock模式指南](./mock-mode-guide.md)
- [本地MongoDB指南](./local-mongodb-guide.md)
- [CI/CD指南](./ci-cd-guide.md)

---

## 🤔 还在犹豫？

**快速决策树：**

```
需要公网访问？
├─ 否 → 本地部署
└─ 是 → 
    访问量大吗？
    ├─ 否（<100次/天）→ Cloud Run
    └─ 是（>1000次/天）→ GCP VM
        
需要完全控制？
└─ 是 → GCP VM

预算有限？
└─ 是 → 
    新用户？
    ├─ 是 → GCP VM（用免费额度）
    └─ 否 → Cloud Run

介意冷启动？
└─ 是 → GCP VM
```

---

**还有疑问？查看各个详细指南或在GitHub提Issue！**

