# 音频转写功能文档

**Created:** 2026-02-06
**Last Updated:** 2026-02-06
**Purpose:** 记录音频转写功能的实现、使用方法和技术细节

---

## 功能概述

音频转写功能（一键转写）使用 OpenAI Whisper API 将音频文件转换为文本。支持多种音频格式，提供实时进度显示和一键复制功能。

**🆕 新功能：智能分段处理**

- 支持最大 100MB 文件
- 大文件自动分段（每段 24MB）
- 使用上下文提示保持转写连续性
- 自动合并分段结果

## 架构设计

### Backend (DDD架构)

**位置:** `/backend/app/api/routes/ai.py`

**端点:** `POST /ai/whisper/transcribe`

**功能:**

- 接收音频文件上传
- 验证文件类型和大小
- 调用 OpenAI Whisper API
- 返回转写结果和元数据

**技术细节:**

- 文件大小限制: 100MB (自动分段处理)
- 单段大小: 24MB (Whisper API 单次限制 25MB)
- 支持格式: mp3, mp4, mpeg, mpga, m4a, wav, webm
- 使用 pydub + ffmpeg 进行音频分段
- 使用上下文提示 (prompt) 保持分段连续性
- 使用临时文件处理上传
- 自动清理临时文件
- 需要认证 (JWT Token)

### Frontend

#### 服务层 (Service Layer)

**位置:** `/frontend/src/XdfClassArranger/Experiment3/services/audioTranscriptionService.js`

**职责:**

- 文件验证
- 文件上传
- 进度跟踪
- 错误处理

**关键特性:**

- 使用 XMLHttpRequest 实现上传进度跟踪
- 分阶段进度显示 (上传 10-50%, 转写 50-90%, 完成 90-100%)
- 完整的错误处理和用户友好的错误消息

#### 组件层 (Presentation Layer)

**位置:** `/frontend/src/XdfClassArranger/Experiment3/components/AudioTranscription.jsx`

**UI 组件:**

1. 文件上传区域
2. 实时进度条
3. 转写结果展示
4. 一键复制按钮

**交互流程:**

1. 用户选择音频文件
2. 系统验证文件
3. 用户点击开始转写
4. 显示实时进度
5. 展示转写结果
6. 提供复制和重置功能

## 使用方法

### 前置条件

1. 配置 OpenAI API Key:

   ```bash
   # 在 .env 文件中添加
   OPENAI_API_KEY=your-api-key-here
   ```

2. 确保后端服务运行:

   ```bash
   docker-compose up backend
   ```

3. 确保前端服务运行:
   ```bash
   docker-compose up frontend
   ```

### 用户操作流程

1. 登录系统
2. 在侧边栏点击 "一键转写"
3. 点击 "选择音频文件" 上传本地音频文件
4. 点击 "开始转写"
5. 等待转写完成（进度条实时显示）
6. 查看转写结果
7. 点击 "复制文本" 将结果复制到剪贴板

### 支持的文件格式

- MP3 (.mp3)
- MP4 Audio (.mp4, .m4a)
- MPEG (.mpeg, .mpga)
- WAV (.wav)
- WebM (.webm)

### 文件大小限制

- 最大文件大小: 100MB
- 大于 25MB 的文件将自动分段处理
- 每段最大 24MB（符合 Whisper API 的 25MB 限制）
- 使用智能上下文提示保持分段间的连续性

## API 规格

### 请求

**端点:** `POST /ai/whisper/transcribe`

**Headers:**

```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Body:**

```
file: <audio_file>
```

### 响应

**成功响应 (200):**

```json
{
  "text": "转写的文本内容...",
  "language": "zh",
  "duration": 123.45,
  "filename": "audio.mp3",
  "size_mb": "2.34",
  "segments": 1,
  "success": true
}
```

**字段说明:**

- `segments`: 文件被分成的段数（1 表示未分段，>1 表示进行了分段处理）

**错误响应:**

1. API 未配置 (503):

```json
{
  "detail": {
    "error": "OpenAI API not configured",
    "message": "请在服务器端配置 OPENAI_API_KEY 环境变量"
  }
}
```

2. 文件格式错误 (400):

```json
{
  "detail": {
    "error": "Invalid file type",
    "message": "只支持音频格式: .mp3, .mp4, ...",
    "received": ".txt"
  }
}
```

3. 文件过大 (400):

```json
{
  "detail": {
    "error": "File too large",
    "message": "文件大小不能超过100MB",
    "size": "120.5MB"
  }
}
```

4. 转写失败 (500):

```json
{
  "detail": {
    "error": "Transcription failed",
    "message": "错误描述",
    "type": "ErrorType"
  }
}
```

## 技术实现细节

### 音频分段处理机制

**分段策略:**

```python
# 1. 加载音频文件
audio = AudioSegment.from_file(file_path)

# 2. 计算需要的段数
num_segments = math.ceil(file_size_mb / 24)  # 每段24MB

# 3. 按时间分段（非字节分段）
segment_duration_ms = total_duration_ms // num_segments

# 4. 导出每个分段
for i in range(num_segments):
    segment = audio[start_ms:end_ms]
    segment.export(temp_path, format=file_ext)
```

**上下文连续性:**

```python
# 使用前一段的末尾文本作为提示
if i > 0:
    transcript_params["prompt"] = previous_text[-200:]
```

**优势:**

- 按时间分段，保持音频完整性
- 使用提示参数，Whisper 能理解上下文
- 自动合并，用户无感知
- 支持任意时长的音频（理论上无限制）

### 进度跟踪机制

```javascript
// 上传阶段: 10% - 50%
xhr.upload.addEventListener("progress", (e) => {
  const uploadProgress = Math.round((e.loaded / e.total) * 40) + 10;
  onProgress(uploadProgress);
});

// 处理阶段: 50% - 90%
onProgress(90);

// 完成: 100%
onProgress(100);
```

### 剪贴板复制实现

支持两种复制方式：

1. 现代浏览器: `navigator.clipboard.writeText()`
2. 降级方案: `document.execCommand('copy')`

### 临时文件处理

Backend 使用 Python `tempfile` 模块：

```python
with tempfile.NamedTemporaryFile(suffix=file_ext, delete=False) as temp_file:
    temp_file.write(file_content)
    temp_file_path = temp_file.name

# 使用后清理
os.unlink(temp_file_path)
```

### 依赖项

**Backend:**

- `pydub==0.25.1` - 音频处理
- `ffmpeg` - 音频编解码（系统依赖）
- `openai==1.58.1` - Whisper API 客户端

**Dockerfile 配置:**

```dockerfile
# 安装 ffmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
```

## 性能考虑

### 转写时间

**单段文件 (≤25MB):**

- 通常为音频时长的 10-20%
- 例如: 5分钟音频 → 30-60秒转写时间

**分段文件 (>25MB):**

- 每段独立转写，时间累加
- 例如: 60分钟音频（3段）→ 每段4分钟 → 总计约12分钟
- 分段处理增加约 20-30% 额外时间（文件处理开销）

**优化建议:**

- 使用压缩格式（MP3）而非无损格式（WAV）
- 降低音频采样率和比特率（不影响转写质量）
- 对于超长音频，考虑预先分段上传

### 并发处理

- 每个用户可以同时转写一个文件
- 多个用户可以并发使用
- Backend 无状态设计，易于横向扩展
- 分段处理在单个请求内顺序执行

## 成本考虑

### OpenAI Whisper API 定价

- Whisper-1 模型: $0.006 / 分钟
- 10分钟音频 ≈ $0.06
- 60分钟音频 ≈ $0.36
- 建议设置使用限制和监控

**分段处理成本:**

- 成本只与音频时长相关，与分段数无关
- 100MB 文件 ≈ 60-90分钟音频 ≈ $0.36-$0.54
- 无额外 API 调用费用

## 安全性

### 认证与授权

- 需要 JWT Token 认证
- 所有登录用户均可使用

### 文件验证

- 前端验证文件类型和大小
- Backend 二次验证
- 防止恶意文件上传

### 临时文件安全

- 使用系统临时目录
- 处理完成后立即删除
- 不保存用户上传的音频文件

### 数据隐私

- 转写文本不存储在服务器
- 仅在客户端显示
- 用户可自行复制保存

## 错误处理

### Frontend 错误处理

- 文件验证错误 → 友好提示
- 上传错误 → 重试建议
- API 错误 → 解析 error detail
- 网络错误 → 连接检查提示

### Backend 错误处理

- 文件类型检查
- 文件大小限制
- API 调用异常捕获
- 临时文件清理保证

## 测试建议

### 功能测试

1. 上传各种格式的音频文件
2. 测试文件大小边界 (接近 25MB)
3. 测试不支持的文件格式
4. 测试网络中断场景
5. 测试复制功能在不同浏览器

### 性能测试

1. 测试不同长度的音频文件
2. 测试多用户并发转写
3. 监控 API 响应时间

### 安全测试

1. 测试未认证访问
2. 测试恶意文件上传
3. 测试超大文件上传

## 未来优化方向

1. **批量转写**
   - 支持一次上传多个文件
   - 队列管理

2. **历史记录**
   - 保存转写历史
   - 支持重新查看

3. **格式导出**
   - 导出为 TXT
   - 导出为 SRT (字幕格式)
   - 带时间戳的转写

4. **多语言支持**
   - 指定源语言
   - 翻译功能

5. **音频预处理**
   - 降噪
   - 音量调整
   - 格式自动转换

6. **并行分段处理**
   - 当前分段顺序处理
   - 可优化为并行 API 调用
   - 大幅减少大文件转写时间

7. **智能分段点检测**
   - 在静音处分段
   - 避免在句子中间切割
   - 提高转写质量

## 故障排查

### 问题: 转写失败

**可能原因:**

1. OpenAI API Key 未配置
2. API Key 无效或额度不足
3. 音频质量太差
4. 网络连接问题

**解决方案:**

1. 检查环境变量配置
2. 验证 API Key 有效性
3. 检查 OpenAI 账户余额
4. 使用更清晰的音频文件

### 问题: 上传或转写卡住

**可能原因:**

1. 大文件分段处理时间长
2. 网络不稳定
3. Backend 未响应
4. ffmpeg 未正确安装

**解决方案:**

1. 等待更长时间（大文件需要数分钟）
2. 检查网络连接
3. 检查 Docker 容器日志：`docker logs <container_id>`
4. 验证 ffmpeg 安装：`docker exec <container_id> ffmpeg -version`
5. 重新构建 Backend：`docker-compose up --build backend`

### 问题: 分段处理失败

**可能原因:**

1. 音频文件格式损坏
2. ffmpeg 不支持的编码格式
3. 内存不足

**解决方案:**

1. 使用音频转换工具重新编码文件
2. 转换为 MP3 格式（最兼容）
3. 增加 Docker 容器内存限制
4. 检查 Backend 日志获取详细错误

### 问题: 复制功能不工作

**可能原因:**

1. 浏览器不支持 clipboard API
2. HTTPS 要求未满足

**解决方案:**

1. 使用现代浏览器
2. 在 HTTPS 环境下运行
3. 手动选择文本复制

## 参考资料

- [OpenAI Whisper API 文档](https://platform.openai.com/docs/guides/speech-to-text)
- [FastAPI File Upload](https://fastapi.tiangolo.com/tutorial/request-files/)
- [React File Upload Best Practices](https://react.dev/)
- [XMLHttpRequest Progress Events](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest)

## 变更日志

### 2026-02-06 (v2.1 - 认证修复)

- 🐛 **修复未登录错误**
- ✅ 统一 token 存储键名（`auth_token`）
- ✅ 添加登录状态检查和自动重定向
- ✅ 改进错误处理和用户提示
- ✅ 添加加载状态显示
- ✅ 更好的错误消息（网络、认证、配置等）

### 2026-02-06 (v2 - 分段处理)

- ✅ **智能分段处理功能**
- ✅ 支持最大 100MB 文件（原 25MB）
- ✅ 使用 pydub + ffmpeg 进行音频分段
- ✅ 上下文提示保持转写连续性
- ✅ 自动合并分段结果
- ✅ 前端显示分段信息
- ✅ 更新 Dockerfile 添加 ffmpeg
- ✅ 更新文档说明新功能

### 2026-02-06 (v1 - 初始版本)

- ✅ 初始实现
- ✅ Backend Whisper API 集成
- ✅ Frontend 组件和服务层
- ✅ 路由和菜单配置
- ✅ 完整文档
- ✅ 支持最大 25MB 文件
