# 本地MongoDB使用指南

**Created:** 2026-01-22  
**Last Updated:** 2026-01-22  
**Purpose:** 说明如何在本地和GCP上使用MongoDB容器

---

## 📋 概述

本项目使用Docker容器化的MongoDB，特点：

- ✅ **无需安装MongoDB** - 使用Docker镜像
- ✅ **开箱即用** - docker-compose自动配置
- ✅ **数据持久化** - 使用Docker volume
- ✅ **本地和GCP一致** - 同样的配置

---

## 🏠 本地开发

### 方法一：使用Docker Compose（推荐）

```bash
# 1. 启动所有服务（包括MongoDB）
docker-compose up

# MongoDB会自动启动在 localhost:27017
# 后端会自动连接到 mongodb://mongodb:27017
```

**包含的服务：**
- Frontend (React) - http://localhost:5173
- Backend (FastAPI) - http://localhost:8000
- MongoDB - localhost:27017

### 方法二：单独启动MongoDB

```bash
# 启动MongoDB容器
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:7.0

# 启动后端（需要在backend目录）
cd backend
export MONGODB_URL=mongodb://localhost:27017
export MONGODB_DB_NAME=xdf_class_arranger
uvicorn app.main:app --reload

# 启动前端（需要在frontend目录）
cd frontend
npm run dev
```

---

## 💾 数据管理

### 查看MongoDB数据

**方法一：使用MongoDB Compass（图形界面）**

1. 下载安装：https://www.mongodb.com/products/compass
2. 连接字符串：`mongodb://localhost:27017`
3. 数据库：`xdf_class_arranger`

**方法二：使用命令行**

```bash
# 进入MongoDB容器
docker exec -it $(docker ps -q -f name=mongodb) mongosh

# 选择数据库
use xdf_class_arranger

# 查看所有集合
show collections

# 查看用户数据
db.users.find().pretty()

# 退出
exit
```

### 备份数据

```bash
# 备份所有数据
docker exec $(docker ps -q -f name=mongodb) mongodump \
  --db xdf_class_arranger \
  --out /data/backup

# 复制备份到本地
docker cp $(docker ps -q -f name=mongodb):/data/backup ./mongodb-backup
```

### 恢复数据

```bash
# 复制备份到容器
docker cp ./mongodb-backup $(docker ps -q -f name=mongodb):/data/backup

# 恢复数据
docker exec $(docker ps -q -f name=mongodb) mongorestore \
  --db xdf_class_arranger \
  /data/backup/xdf_class_arranger
```

### 清空数据

```bash
# 方法一：删除所有数据（保留容器）
docker exec -it $(docker ps -q -f name=mongodb) mongosh \
  --eval "use xdf_class_arranger; db.dropDatabase()"

# 方法二：删除容器和volume（彻底清空）
docker-compose down -v
docker-compose up
```

---

## 🌐 GCP部署

### 架构

GCP部署时，MongoDB也运行在同一个VM上的Docker容器中：

```
GCP VM
├── Frontend Container (Port 80)
├── Backend Container (Port 8000)
└── MongoDB Container (Port 27017, 仅内部访问)
```

### 特点

- **内部网络**: MongoDB只能被同VM的容器访问
- **数据持久化**: 数据保存在VM的Docker volume中
- **自动启动**: VM重启后自动启动所有容器

### 访问GCP上的MongoDB

```bash
# SSH连接到VM
gcloud compute ssh classarranger-vm --zone=asia-northeast1-a

# 进入MongoDB容器
docker exec -it $(docker ps -q -f name=mongodb) mongosh

# 查看数据
use xdf_class_arranger
db.users.find().pretty()
```

### 备份GCP上的MongoDB

```bash
# 方法一：在VM上备份
gcloud compute ssh classarranger-vm --zone=asia-northeast1-a --command='
  cd /opt/classarranger
  docker exec $(docker ps -q -f name=mongodb) mongodump \
    --db xdf_class_arranger \
    --out /data/backup
'

# 方法二：下载备份到本地
gcloud compute ssh classarranger-vm --zone=asia-northeast1-a --command='
  docker exec $(docker ps -q -f name=mongodb) mongodump \
    --db xdf_class_arranger \
    --archive=/data/backup.archive
'

gcloud compute scp classarranger-vm:/data/backup.archive ./mongodb-backup.archive --zone=asia-northeast1-a
```

---

## 🔧 配置说明

### MongoDB配置

**docker-compose.yml (本地开发):**
```yaml
mongodb:
  image: mongo:7.0
  ports:
    - "27017:27017"
  volumes:
    - mongodb_data:/data/db
  environment:
    - MONGO_INITDB_DATABASE=xdf_class_arranger
```

**docker-compose.prod.yml (GCP生产):**
```yaml
mongodb:
  image: mongo:7.0
  ports:
    - "27017:27017"  # 仅内部访问
  volumes:
    - mongodb_data:/data/db
  environment:
    - MONGO_INITDB_DATABASE=xdf_class_arranger
  restart: unless-stopped
  command: mongod --quiet --logpath /dev/null
```

### 连接字符串

**本地开发:**
```
MONGODB_URL=mongodb://mongodb:27017
```

**GCP生产:**
```
MONGODB_URL=mongodb://mongodb:27017
```

两者相同，因为都在Docker网络内部。

---

## 📊 数据库结构

### Collections（集合）

**1. users - 用户信息**
```javascript
{
  _id: ObjectId("..."),
  email: "test@example.com",
  username: "测试用户",
  hashed_password: "$2b$12$...",
  created_at: ISODate("2026-01-22T10:00:00Z"),
  updated_at: ISODate("2026-01-22T10:00:00Z")
}
```

**2. schedules - 排课数据**
```javascript
{
  _id: ObjectId("..."),
  user_id: "user-id",
  student_name: "学生姓名",
  teacher_name: "教师姓名",
  subject: "数学",
  start_time: ISODate("2026-01-22T14:00:00Z"),
  end_time: ISODate("2026-01-22T16:00:00Z"),
  status: "scheduled",
  created_at: ISODate("2026-01-22T10:00:00Z")
}
```

**3. diaries - 日记（示例）**
```javascript
{
  _id: ObjectId("..."),
  user_id: "user-id",
  title: "学习笔记",
  content: "今天学习了...",
  created_at: ISODate("2026-01-22T10:00:00Z"),
  updated_at: ISODate("2026-01-22T10:00:00Z")
}
```

---

## 🔐 安全性

### 当前配置

- ✅ **端口绑定**: MongoDB只监听内部网络
- ✅ **防火墙**: GCP防火墙不开放27017端口
- ✅ **容器隔离**: Docker网络隔离

### 生产环境建议

如果要在生产环境使用，建议：

1. **启用认证**:
```yaml
mongodb:
  environment:
    - MONGO_INITDB_ROOT_USERNAME=admin
    - MONGO_INITDB_ROOT_PASSWORD=secure_password
```

2. **限制连接**:
```bash
# 只允许后端容器访问
# 使用Docker网络限制
```

3. **加密传输**:
```bash
# 使用TLS/SSL连接
```

4. **定期备份**:
```bash
# 设置自动备份任务
```

---

## 🐛 常见问题

### Q1: MongoDB容器无法启动？

**检查端口占用:**
```bash
# 检查27017端口是否被占用
lsof -i :27017

# 如果被占用，停止占用的进程或更改端口
```

**查看日志:**
```bash
docker logs $(docker ps -aq -f name=mongodb)
```

### Q2: 连接失败？

**检查网络:**
```bash
# 确认MongoDB容器正在运行
docker ps | grep mongodb

# 测试连接
docker exec -it $(docker ps -q -f name=mongodb) mongosh --eval "db.version()"
```

### Q3: 数据丢失？

**原因:**
- Docker volume被删除（`docker-compose down -v`）
- VM实例被删除
- 容器被删除且没有使用volume

**预防:**
- 定期备份
- 使用持久化volume
- GCP VM使用持久化磁盘

### Q4: 如何迁移数据？

**从本地到GCP:**
```bash
# 1. 本地备份
docker exec $(docker ps -q -f name=mongodb) mongodump \
  --db xdf_class_arranger \
  --archive=/data/backup.archive

# 2. 复制备份文件
docker cp $(docker ps -q -f name=mongodb):/data/backup.archive ./backup.archive

# 3. 上传到GCP VM
gcloud compute scp ./backup.archive classarranger-vm:/tmp/backup.archive --zone=asia-northeast1-a

# 4. 在GCP上恢复
gcloud compute ssh classarranger-vm --zone=asia-northeast1-a --command='
  docker cp /tmp/backup.archive $(docker ps -q -f name=mongodb):/data/backup.archive
  docker exec $(docker ps -q -f name=mongodb) mongorestore \
    --db xdf_class_arranger \
    --archive=/data/backup.archive
'
```

---

## 📚 相关资源

- [MongoDB官方文档](https://www.mongodb.com/docs/)
- [MongoDB Docker镜像](https://hub.docker.com/_/mongo)
- [MongoDB Compass](https://www.mongodb.com/products/compass)
- [Motor (异步Python驱动)](https://motor.readthedocs.io/)

---

## 💡 最佳实践

1. **定期备份**: 每天或每周备份一次
2. **监控磁盘**: 确保有足够空间
3. **使用索引**: 为常用查询字段创建索引
4. **限制连接**: 只允许必要的服务访问
5. **日志管理**: 定期清理日志文件

---

**使用愉快！📊**

