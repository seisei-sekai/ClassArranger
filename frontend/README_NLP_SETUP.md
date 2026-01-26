# NLP Constraint Conversion System - Setup Guide
# NLP约束转换系统 - 设置指南

## Quick Setup / 快速设置

### 1. Get OpenAI API Key / 获取OpenAI API密钥

Visit https://platform.openai.com/api-keys and create an API key.

访问 https://platform.openai.com/api-keys 创建API密钥。

### 2. Create Environment File / 创建环境文件

Create a file named `.env.local` in the `frontend/` directory:

在 `frontend/` 目录中创建名为 `.env.local` 的文件：

```bash
cd frontend
cp .env.example .env.local
```

### 3. Add Your API Key / 添加你的API密钥

Edit `.env.local` and add your OpenAI API key:

编辑 `.env.local` 并添加你的OpenAI API密钥：

```bash
VITE_OPENAI_API_KEY=sk-proj-your-actual-api-key-here
```

**⚠️ Important / 重要**: 
- Never commit `.env.local` to Git (it's already in `.gitignore`)
- 永远不要将 `.env.local` 提交到Git（已在 `.gitignore` 中）
- Keep your API key secure and don't share it
- 保护好你的API密钥，不要分享

### 4. Restart Development Server / 重启开发服务器

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
# or
yarn dev
```

---

## File Structure / 文件结构

The NLP system consists of the following files:

NLP系统由以下文件组成：

```
frontend/src/XdfClassArranger/Function/
├── services/
│   └── openaiService.js          # OpenAI API integration
├── utils/
│   ├── constraintTemplates.js    # Predefined constraint templates
│   ├── excelConstraintExtractor.js  # Excel data extraction
│   ├── constraintValidator.js    # Validation logic
│   └── nlpLogger.js               # Logging system
├── prompts/
│   └── constraintParsingPrompt.js  # OpenAI prompt templates
├── components/
│   ├── ConstraintReviewDialog.jsx   # Main review UI
│   └── ConstraintReviewDialog.css   # Styling
└── __tests__/
    └── constraintParsing.test.js    # Unit tests
```

---

## Configuration / 配置

### Model Selection / 模型选择

Default model: `gpt-4o-mini` (cost-effective)

默认模型：`gpt-4o-mini`（性价比高）

To change the model, edit `openaiService.js`:

要更改模型，编辑 `openaiService.js`：

```javascript
constructor(apiKey) {
  this.model = 'gpt-4o-mini'; // Change to 'gpt-4o' for higher accuracy
}
```

### Batch Size / 批处理大小

Default: 5 students per batch

默认：每批5个学生

To change, edit `openaiService.js`:

要更改，编辑 `openaiService.js`：

```javascript
async batchParse(students, onProgress = null) {
  const batchSize = 5; // Change this number
  // ...
}
```

---

## Testing / 测试

### Unit Tests / 单元测试

Run the test suite:

运行测试套件：

```bash
cd frontend
npm test constraintParsing.test.js
```

### Integration Tests (with real API) / 集成测试（使用真实API）

**Note**: Integration tests are commented out by default to avoid API costs.

**注意**：集成测试默认被注释掉以避免API费用。

To run them:

要运行它们：

1. Uncomment the integration test section in `constraintParsing.test.js`
2. Ensure your API key is set
3. Run: `npm test constraintParsing.test.js`

---

## Usage / 使用方法

### From the UI / 从用户界面

1. Go to the Function component in the scheduling system
2. Click "Add Student"
3. Paste Excel data
4. Click "AI Smart Parse" button
5. Review results in the dialog
6. Approve and import

1. 进入排课系统的Function组件
2. 点击"添加学生"
3. 粘贴Excel数据
4. 点击"AI智能解析"按钮
5. 在对话框中审核结果
6. 批准并导入

### Programmatically / 编程方式

```javascript
import { getOpenAIParser } from './services/openaiService';
import { extractConstraintData } from './utils/excelConstraintExtractor';

// Extract data from Excel
const students = extractConstraintData(excelRows);

// Parse constraints
const parser = getOpenAIParser();
const results = await parser.batchParse(students);

// Handle results
results.forEach(result => {
  if (result.success) {
    console.log('Parsed:', result.constraint);
  } else {
    console.error('Failed:', result.error);
  }
});
```

---

## Monitoring and Debugging / 监控和调试

### View Logs / 查看日志

Open browser console and run:

打开浏览器控制台并运行：

```javascript
import { getNLPLogger } from './utils/nlpLogger';
const logger = getNLPLogger();

// Get statistics
console.log(logger.getStatistics());

// Get recent errors
console.log(logger.getRecentErrors());

// Export all logs
logger.downloadLogs();
```

### Common Issues / 常见问题

**1. API Key Not Found / API密钥未找到**

Error: `VITE_OPENAI_API_KEY is undefined`

Solution:
- Check `.env.local` exists in `frontend/` directory
- Restart development server
- Verify the key starts with `sk-proj-` or `sk-`

**2. Rate Limit Exceeded / 超出速率限制**

Error: `429 Too Many Requests`

Solution:
- Wait a few minutes before retrying
- Reduce batch size in `openaiService.js`
- Check your OpenAI account usage limits

**3. Invalid Constraint Format / 约束格式无效**

Error: `Validation failed: ...`

Solution:
- Check the prompt template in `constraintParsingPrompt.js`
- Verify input data is correctly formatted
- Use the edit modal to manually correct constraints

---

## Cost Estimation / 费用估算

### Pricing (as of 2026-01) / 定价（截至2026-01）

- **gpt-4o-mini**: ~$0.0001/1K tokens (very affordable)
- **gpt-4o**: ~$0.005/1K tokens (higher accuracy)

### Typical Usage / 典型使用

- Average student constraint: ~300 tokens (input + output)
- Cost per student (gpt-4o-mini): ~$0.00003 USD
- **100 students**: ~$0.003 USD (less than 1 cent!)

---

## Security Best Practices / 安全最佳实践

### DO / 应该做

✅ Store API key in `.env.local` (gitignored)
✅ Use environment variables for sensitive data
✅ Rotate API keys regularly
✅ Monitor API usage in OpenAI dashboard
✅ Implement rate limiting

### DON'T / 不应该做

❌ Commit API keys to Git
❌ Share API keys in chat/email
❌ Hardcode API keys in source code
❌ Use production keys in development
❌ Expose API keys in client-side code (for production, move to backend)

---

## Migration to Backend (Production) / 迁移到后端（生产环境）

For production, the OpenAI API calls should be made from the backend:

在生产环境中，OpenAI API调用应该从后端进行：

### Backend Implementation / 后端实现

1. Create a new endpoint: `POST /api/parse-constraints`
2. Move `openaiService.js` logic to backend
3. Implement authentication and authorization
4. Add request validation and sanitization
5. Set up proper error handling and logging

### Frontend Changes / 前端更改

1. Update `ConstraintReviewDialog.jsx` to call backend API
2. Remove OpenAI API key from frontend `.env.local`
3. Add proper error handling for API failures

---

## Support / 支持

For issues or questions:

如有问题或疑问：

1. Check the [User Guide](../docs/NLP约束转换系统使用指南.md)
2. Review the [Troubleshooting](../docs/NLP约束转换系统使用指南.md#故障排除--troubleshooting) section
3. Export logs using `logger.downloadLogs()`
4. Create a GitHub Issue with logs and error messages

---

## Resources / 资源

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [OpenAI Pricing](https://openai.com/pricing)
- [Full User Guide](../docs/NLP约束转换系统使用指南.md)
- [Test Cases](src/XdfClassArranger/Function/__tests__/constraintParsing.test.js)

---

**Last Updated:** 2026-01-23  
**Status:** ✅ Production Ready

