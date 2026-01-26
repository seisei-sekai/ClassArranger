# NLP约束转换系统使用指南
# NLP Constraint Conversion System User Guide

**Created:** 2026-01-23  
**Last Updated:** 2026-01-23  
**Purpose:** Complete guide for using the Natural Language to Constraint conversion system  

---

## 目录 / Table of Contents

1. [系统概述 / System Overview](#系统概述--system-overview)
2. [快速开始 / Quick Start](#快速开始--quick-start)
3. [详细使用流程 / Detailed Workflow](#详细使用流程--detailed-workflow)
4. [置信度理解 / Understanding Confidence Scores](#置信度理解--understanding-confidence-scores)
5. [常见约束模式 / Common Constraint Patterns](#常见约束模式--common-constraint-patterns)
6. [最佳实践 / Best Practices](#最佳实践--best-practices)
7. [故障排除 / Troubleshooting](#故障排除--troubleshooting)
8. [技术参考 / Technical Reference](#技术参考--technical-reference)

---

## 系统概述 / System Overview

### What is it? / 这是什么？

NLP约束转换系统使用OpenAI的GPT模型自动将学生的自然语言时间偏好转换为结构化的排课约束。

The NLP Constraint Conversion System uses OpenAI's GPT models to automatically convert students' natural language time preferences into structured scheduling constraints.

### Key Features / 主要功能

- **智能解析 / Intelligent Parsing**: 支持中文、日文、英文混合的自然语言输入
- **批量处理 / Batch Processing**: 一次处理多个学生的约束
- **置信度评分 / Confidence Scoring**: 为每个解析结果提供置信度评分
- **人工审核 / Human Review**: 提供友好的审核界面进行最终确认
- **模板匹配 / Template Matching**: 自动匹配常用约束模板
- **冲突检测 / Conflict Detection**: 自动检测约束中的逻辑矛盾

---

## 快速开始 / Quick Start

### Step 1: 准备Excel数据 / Prepare Excel Data

从 `前途塾1v1约课.xlsx` 表格中复制学生数据，包含以下字段：
- 学生姓名
- 校区
- 学生希望时间段
- 希望具体时间
- 备注

Copy student data from `前途塾1v1约课.xlsx` spreadsheet, including:
- Student name
- Campus
- Preferred time period
- Specific time
- Remarks

### Step 2: 粘贴数据 / Paste Data

1. 在排课系统中点击"添加学生"
2. 在弹出的编辑框中粘贴Excel数据
3. 点击"AI智能解析"按钮

1. Click "Add Student" in the scheduling system
2. Paste Excel data in the edit modal
3. Click "AI Smart Parse" button

### Step 3: 审核结果 / Review Results

1. 查看解析结果表格
2. 检查置信度评分（绿色=高，黄色=中，红色=低）
3. 对低置信度的结果进行手动编辑
4. 批量批准高置信度结果

1. View the parsing results table
2. Check confidence scores (green=high, yellow=medium, red=low)
3. Manually edit low-confidence results
4. Batch approve high-confidence results

### Step 4: 最终批准 / Final Approval

点击"最终批准并导入"将已审核的约束导入排课系统。

Click "Final Approve and Import" to import reviewed constraints into the scheduling system.

---

## 详细使用流程 / Detailed Workflow

### 1. 数据导入阶段 / Data Import Phase

#### Excel数据格式要求 / Excel Data Format Requirements

系统会自动提取以下列的信息：

The system automatically extracts information from the following columns:

| 列名 / Column Name | 用途 / Purpose | 示例 / Example |
|------------------|--------------|---------------|
| 学生希望时间段 / Preferred Time Period | 主要时间偏好 / Main time preference | "平日下午", "周末全天" |
| 希望具体时间 / Specific Time | 具体时间段 / Specific time range | "14:00-17:00" |
| 起止时间 / Start-End Time | 课程时长信息 / Course duration info | "12/5 开始，共10次" |
| 备注 / Remarks | 额外约束和说明 / Additional constraints | "语校时间12:30-18:00" |

#### 数据组合规则 / Data Combination Rules

系统会按以下优先级组合字段：
1. 起止时间
2. 学生希望时间段
3. 希望具体时间
4. 每周频次
5. 备注

The system combines fields in the following priority order:
1. Start-end time
2. Preferred time period
3. Specific time
4. Weekly frequency
5. Remarks

### 2. AI解析阶段 / AI Parsing Phase

#### 解析过程 / Parsing Process

1. **数据提取 / Data Extraction**: 从Excel行中提取自然语言文本
2. **批量分组 / Batch Grouping**: 将学生按5人一组进行批处理
3. **API调用 / API Calls**: 调用OpenAI API进行解析
4. **结果验证 / Result Validation**: 验证解析结果的有效性
5. **置信度计算 / Confidence Calculation**: 计算并显示置信度

#### 进度监控 / Progress Monitoring

- 实时进度条显示处理进度
- 显示当前处理的学生数 / 总学生数
- 处理失败时会显示错误信息

Real-time progress bar shows processing status
- Displays current student / total students
- Shows error messages on failures

### 3. 审核阶段 / Review Phase

#### 审核界面元素 / Review Interface Elements

**统计信息 / Statistics Section**:
- 总学生数 / Total students
- 平均约束文本长度 / Average constraint text length
- 已批准数量 / Approved count
- 待审核数量 / Pending count

**筛选选项 / Filter Options**:
- 全部 / All
- 待审核 / Pending
- 已批准 / Approved
- 已拒绝 / Rejected
- 高/中/低置信度 / High/Medium/Low confidence

**单个约束操作 / Individual Constraint Actions**:
- ✓ 批准 / Approve
- ✗ 拒绝 / Reject
- ✎ 编辑 / Edit

**批量操作 / Batch Actions**:
- 批量批准高置信度 (≥0.8)
- 批量拒绝低置信度 (<0.5)

#### 编辑约束 / Editing Constraints

点击编辑按钮打开编辑模态框：

Click the edit button to open the edit modal:

1. **应用模板 / Apply Template**: 从预定义模板中选择
2. **允许日期 / Allowed Days**: 点击切换日期选择
3. **约束类型 / Strictness**:
   - 严格 (Strict): 必须遵守
   - 灵活 (Flexible): 建议遵守
   - 偏好 (Preferred): 优先考虑
4. **保存 / Save**: 保存编辑，置信度自动设为100%

### 4. 最终导入 / Final Import

点击"最终批准并导入"后：
1. 系统收集所有已批准和已编辑的约束
2. 为每个学生创建带约束的排课对象
3. 自动分配颜色和校区信息
4. 显示导入成功提示

After clicking "Final Approve and Import":
1. System collects all approved and edited constraints
2. Creates scheduling objects with constraints for each student
3. Automatically assigns colors and campus info
4. Shows success notification

---

## 置信度理解 / Understanding Confidence Scores

### 置信度等级 / Confidence Levels

| 等级 / Level | 范围 / Range | 颜色 / Color | 建议 / Recommendation |
|-------------|------------|------------|---------------------|
| 高 / High | ≥ 0.8 | 绿色 / Green | 可直接批准 / Can approve directly |
| 中 / Medium | 0.5 - 0.8 | 黄色 / Yellow | 建议审核 / Recommend review |
| 低 / Low | < 0.5 | 红色 / Red | 必须人工审核 / Must review manually |

### 影响置信度的因素 / Factors Affecting Confidence

**高置信度情况 / High Confidence Cases**:
- 清晰明确的时间表达："周一到周五14:00-17:00"
- 标准时段关键词："平日下午"、"周末全天"
- 简单的排除规则："除了周三"

**低置信度情况 / Low Confidence Cases**:
- 模糊的时间描述："可能下午或者晚上"
- 矛盾的约束："平日都可以，但工作日不行"
- 复杂的条件："如果是面试课就周末，其他课平日"

### 置信度与审核策略 / Confidence and Review Strategy

```
高置信度 (≥0.8)
  └─> 快速审核 → 批量批准

中置信度 (0.5-0.8)
  └─> 详细检查 → 确认无误后批准

低置信度 (<0.5)
  └─> 仔细审核 → 手动编辑 → 批准
```

---

## 常见约束模式 / Common Constraint Patterns

### 1. 时间段表达 / Time Period Expressions

| 自然语言 / Natural Language | 解析结果 / Parsed Result |
|-------------------------|----------------------|
| "上午" / "Morning" | 9:00-12:00 |
| "下午" / "Afternoon" | 14:00-18:00 |
| "晚上" / "Evening" | 18:00-21:30 |
| "中午" / "Noon" | 11:00-14:00 |

### 2. 日期表达 / Day Expressions

| 自然语言 / Natural Language | 解析结果 / Parsed Result |
|-------------------------|----------------------|
| "平日" / "Weekdays" | Monday-Friday |
| "周末" / "Weekend" | Saturday-Sunday |
| "周一到周五" | Monday-Friday |
| "周三周五" | Wednesday, Friday |

### 3. 排除表达 / Exclusion Expressions

| 自然语言 / Natural Language | 解析方式 / Parsing Method |
|-------------------------|----------------------|
| "除了平日下午" | Exclude weekday afternoons |
| "不能周三" | Exclude Wednesdays |
| "X不行" | Exclude X |
| "12:00-13:00不可以" | Exclude 12:00-13:00 |

### 4. 复杂模式 / Complex Patterns

**Example 1: 组合时间段 / Combined Time Periods**
```
输入 / Input: "平日的上午晚上，周末全天"
解析 / Parsed:
  - 工作日: 9:00-12:00, 18:00-21:30
  - 周末: 9:00-21:30
```

**Example 2: 带语校时间 / With Language School Time**
```
输入 / Input: "平日需12:30之前，18点之后；语校时间12:30-18:00"
解析 / Parsed:
  - 允许: 工作日 9:00-12:30, 18:00-21:30
  - 排除: 工作日 12:30-18:00
```

**Example 3: 偏好表达 / Preference Expression**
```
输入 / Input: "平日周末都可以，尽量安排在周末"
解析 / Parsed:
  - 允许日期: 所有日期
  - 约束类型: 偏好 (Preferred)
  - 说明: 优先考虑周末
```

---

## 最佳实践 / Best Practices

### For Administrators / 给管理员

1. **批量处理策略 / Batch Processing Strategy**
   - 一次处理20-30个学生为最佳
   - 避免一次处理过多导致API超时
   - 定期保存审核进度

2. **审核优先级 / Review Priority**
   ```
   1. 先处理低置信度 (需要最多关注)
   2. 快速批准高置信度 (节省时间)
   3. 最后处理中置信度 (按需审核)
   ```

3. **质量控制 / Quality Control**
   - 抽查高置信度结果确保准确性
   - 记录常见错误模式
   - 定期导出日志进行分析

### For Students / 给学生

**如何提供清晰的时间偏好 / How to Provide Clear Time Preferences**:

✅ **Good Examples / 好的示例**:
- "周一到周五14:00-17:00"
- "周末全天可以"
- "平日上午和晚上，周末全天"
- "除了周三下午，其他都可以"

❌ **Unclear Examples / 不清晰的示例**:
- "看情况" (too vague)
- "基本都可以吧" (uncertain)
- "可能下午" (ambiguous)
- "要看具体时间" (too conditional)

---

## 故障排除 / Troubleshooting

### 常见问题 / Common Issues

#### 1. API调用失败 / API Call Failures

**症状 / Symptoms**: 显示错误消息"API调用失败"

**可能原因 / Possible Causes**:
- API密钥无效或过期
- 网络连接问题
- OpenAI服务暂时不可用
- 达到API速率限制

**解决方案 / Solutions**:
1. 检查`.env.local`文件中的API密钥
2. 确认网络连接正常
3. 等待几分钟后重试
4. 减少批处理数量

#### 2. 解析结果置信度过低 / Low Confidence Parsing Results

**症状 / Symptoms**: 大量结果显示红色低置信度标签

**可能原因 / Possible Causes**:
- 输入文本过于模糊
- 包含大量非标准表达
- 数据格式不正确

**解决方案 / Solutions**:
1. 检查原始Excel数据质量
2. 手动编辑低置信度结果
3. 使用模板快速修正

#### 3. 约束验证失败 / Constraint Validation Failures

**症状 / Symptoms**: 显示错误"约束中存在逻辑矛盾"

**可能原因 / Possible Causes**:
- 允许时间和排除时间重叠
- 时间范围无效（起始时间晚于结束时间）
- 允许日期为空

**解决方案 / Solutions**:
1. 点击编辑按钮查看详细约束
2. 修正矛盾的时间设置
3. 应用预定义模板作为基础

#### 4. 导入后学生不显示 / Students Not Showing After Import

**症状 / Symptoms**: 点击"最终批准"后，学生列表中看不到新学生

**可能原因 / Possible Causes**:
- 没有勾选"显示可用性"选项
- 约束过于严格导致无可用时间
- 浏览器缓存问题

**解决方案 / Solutions**:
1. 在学生列表中手动启用"显示可用性"
2. 刷新页面
3. 检查约束是否合理

---

## 技术参考 / Technical Reference

### API配置 / API Configuration

**Environment Variables / 环境变量**:
```bash
VITE_OPENAI_API_KEY=your_api_key_here
```

**Model Selection / 模型选择**:
- Default: `gpt-4o-mini` (cost-effective)
- Alternative: `gpt-4o` (higher accuracy)
- Temperature: 0 (consistency)

### 约束数据结构 / Constraint Data Structure

```javascript
{
  allowedDays: [0, 1, 2, 3, 4, 5, 6], // 0=Sun, 1=Mon, ..., 6=Sat
  allowedTimeRanges: [
    {
      day: null | 0-6,  // null = applies to all allowed days
      start: 0-150,     // slot index (5-min increments)
      end: 0-150
    }
  ],
  excludedTimeRanges: [
    {
      day: null | 0-6,
      start: 0-150,
      end: 0-150
    }
  ],
  strictness: 'strict' | 'flexible' | 'preferred',
  confidence: 0.0 - 1.0,
  reasoning: 'string'  // AI's explanation in Chinese
}
```

### 时间槽转换 / Time Slot Conversion

**Formula / 公式**:
```
slotIndex = (hour - 9) × 12 + (minute / 5)
```

**Examples / 示例**:
- 9:00 → slot 0
- 10:00 → slot 12
- 14:30 → slot 66
- 21:30 → slot 150

### 日志系统 / Logging System

**日志类型 / Log Types**:
- `parse`: 解析尝试
- `edit`: 人工编辑
- `error`: 错误
- `approval`: 批准/拒绝
- `api_call`: API调用

**导出日志 / Export Logs**:
可通过浏览器控制台访问：
```javascript
import { getNLPLogger } from './utils/nlpLogger';
const logger = getNLPLogger();
logger.downloadLogs(); // Downloads JSON file
```

### 性能优化 / Performance Optimization

**批处理设置 / Batch Processing Settings**:
- Batch size: 5 students per batch
- Delay between batches: 1000ms
- Max retries: 3
- Retry delay: exponential backoff

**缓存策略 / Caching Strategy**:
- Parsed results cached in localStorage
- Template matches cached in memory
- Log retention: 500 most recent entries

---

## 附录 / Appendix

### A. 快捷键 / Keyboard Shortcuts

| 快捷键 / Shortcut | 功能 / Function |
|-----------------|----------------|
| Ctrl/Cmd + S | 保存当前编辑 |
| Esc | 关闭对话框 |
| ↑/↓ | 浏览学生列表 |
| Enter | 批准选中项 |

### B. 预定义模板列表 / Predefined Templates

1. 完全可用 (All Available)
2. 仅工作日 (Weekdays Only)
3. 仅周末 (Weekends Only)
4. 仅上午 (Morning Only)
5. 仅下午 (Afternoon Only)
6. 仅晚上 (Evening Only)
7. 工作日上午+晚上 (Weekday Morning & Evening)
8. 排除工作日下午 (Exclude Weekday Afternoon)
9. 优先周末 (Weekend Preferred)
10. 排除午餐时间 (Exclude Lunch Time)

### C. 联系支持 / Contact Support

如遇到问题，请：
1. 导出NLP日志 (`logger.downloadLogs()`)
2. 截图错误信息
3. 提供原始Excel数据样本
4. 联系技术支持团队

If you encounter issues:
1. Export NLP logs (`logger.downloadLogs()`)
2. Screenshot error messages
3. Provide sample Excel data
4. Contact technical support team

---

## 更新日志 / Change Log

### v1.0.0 (2026-01-23)
- 初始版本发布
- 支持中文、日文、英文混合解析
- 实现批量处理和人工审核流程
- 添加模板匹配和冲突检测

### Future Enhancements / 未来改进
- 支持语音输入
- 移动端优化
- 后端API迁移
- 自动学习和提示词优化

---

**文档维护者 / Document Maintainer**: XDF Development Team  
**最后更新 / Last Updated**: 2026-01-23  

