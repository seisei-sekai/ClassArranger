# 本地运行指南

**Created:** 2026-01-22
**Last Updated:** 2026-01-22
**Purpose:** 本地开发和运行 ClassArranger 项目的完整指南

---

## 前置要求

- Node.js 20+
- Python 3.11+
- Docker 和 Docker Compose（如果使用方法一）

## 方法一：使用 Docker Compose（推荐）

### 1. 设置环境变量

```bash
# 复制环境变量模板
cp .env.example .env
```

### 2. 启动所有服务

```bash
# 使用 Makefile（推荐）
make dev

# 或者直接使用 docker-compose
docker-compose up --build
```

服务将在以下地址运行：
- 前端：http://localhost:5173
- 后端 API：http://localhost:8000
- API 文档：http://localhost:8000/docs
- MongoDB：localhost:27017

---

## 方法二：手动运行（不使用 Docker）

### 1. 设置环境变量

```bash
cp .env.example .env
```

### 2. 启动 MongoDB

确保本地 MongoDB 服务正在运行，或使用 Docker 单独启动：

```bash
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

### 3. 启动后端

```bash
cd backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# macOS/Linux:
source venv/bin/activate
# Windows:
# venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 启动后端服务
uvicorn app.main:app --reload --port 8000
```

### 4. 启动前端（新终端窗口）

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端将在 http://localhost:5173 运行

---

## 方法三：只运行前端

如果只需要测试前端 UI：

```bash
cd frontend
npm install
npm run dev
```

访问：http://localhost:5173

**注意**：如果前端需要调用后端 API，后端必须也在运行。

---

## 快速命令参考

```bash
# 使用 Makefile
make dev              # 启动所有服务（Docker）
make dev-frontend     # 只启动前端
make dev-backend      # 只启动后端
make clean            # 清理 Docker 容器和镜像
make status           # 查看服务状态

# 手动运行
cd frontend && npm run dev          # 前端
cd backend && uvicorn app.main:app --reload  # 后端
```

---

## 常见问题

### 1. 端口被占用

如果 5173 或 8000 端口被占用，可以：

**前端**：修改 `frontend/vite.config.js` 中的端口号
```js
server: {
  port: 3000,  // 改为其他端口
}
```

**后端**：修改启动命令
```bash
uvicorn app.main:app --reload --port 8001
```

### 2. 依赖安装失败

**前端**：
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**后端**：
```bash
cd backend
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 访问应用

启动成功后：

1. **XdfClassArranger**：
   - Dashboard：http://localhost:5173/dashboard
   - 排课功能：http://localhost:5173/function
   - 我的主页：http://localhost:5173/mypage

2. **后端 API 文档**：http://localhost:8000/docs

