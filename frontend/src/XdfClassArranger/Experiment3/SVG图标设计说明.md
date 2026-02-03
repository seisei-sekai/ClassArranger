# SVG 图标设计说明

## 设计原则

所有图标遵循日系极简（Minimalistic Japanese）设计风格：
- 纯线条设计，无填充色
- stroke-width: 2
- 使用 `currentColor` 自动继承文字颜色
- 统一尺寸：18x18 或 14x14
- 简洁、克制、功能性第一

---

## 冲突分析图标

### 1. 教师冲突图标
**尺寸**: 18x18  
**含义**: 一个人形 + 教学手势（伸展的手臂）

```jsx
<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
  <circle cx="12" cy="7" r="3" stroke="currentColor" strokeWidth="2"/>
  <path d="M3 21c0-3.5 4-6 9-6s9 2.5 9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  <path d="M8 9l-3 3M16 9l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
</svg>
```

**设计说明**:
- 圆形头部代表教师
- 下方弧线代表身体
- 两侧伸展的线条代表教学手势（像在讲课）

---

### 2. 学生冲突图标
**尺寸**: 18x18  
**含义**: 多个人形组合（大 + 小）

```jsx
<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
  <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="2"/>
  <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="2"/>
  <path d="M2 21c0-3 3-5 7-5s7 2 7 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  <path d="M15 21c0-2 2-3.5 4.5-3.5s4.5 1.5 4.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
</svg>
```

**设计说明**:
- 两个人形，代表多个学生
- 大小略有差异，营造群组感
- 重叠的身体线条代表团队

---

### 3. 教室冲突图标
**尺寸**: 18x18  
**含义**: 教室布局（房间 + 座位）

```jsx
<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
  <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
  <path d="M3 9h18M9 4v5M15 4v5" stroke="currentColor" strokeWidth="2"/>
  <circle cx="8" cy="14" r="1.5" fill="currentColor"/>
  <circle cx="12" cy="14" r="1.5" fill="currentColor"/>
  <circle cx="16" cy="14" r="1.5" fill="currentColor"/>
</svg>
```

**设计说明**:
- 外框代表教室墙壁
- 上方横线代表黑板区域
- 竖线代表窗户或柱子
- 下方三个点代表座位/桌椅

---

### 4. 午休违规图标
**尺寸**: 18x18  
**含义**: 时钟（指向午餐时间）

```jsx
<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
  <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  <path d="M8 2h8M8 22h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
</svg>
```

**设计说明**:
- 圆形时钟面
- 指针指向12点方向（午休时间）
- 上下横线代表时间段标记

---

## UI 功能图标

### 5. 完成图标（Checkmark）
**尺寸**: 14x14  
**含义**: 对勾 ✓

```jsx
<svg width="14" height="14" viewBox="0 0 24 24" fill="none">
  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
</svg>
```

**设计说明**:
- 简洁的对勾符号
- 较粗的 strokeWidth (2.5) 增加视觉重量
- round 端点柔和友好

**使用场景**:
- 排课完成徽章
- 功能列表项前缀
- 成功状态提示

---

## 标题图标

### 6. 书本图标（教程）
**尺寸**: 20x20  
**含义**: 翻开的书本

```jsx
<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M10 6h6M10 10h6M10 14h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
</svg>
```

**使用场景**: "使用教程" 标题

---

### 7. 灯泡图标（提示）
**尺寸**: 16x16  
**含义**: 电灯泡（创意/提示）

```jsx
<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
  <path d="M9 18h6M10 22h4M15 2a5 5 0 0 1 0 10 3.5 3.5 0 0 0-1 3H10a3.5 3.5 0 0 0-1-3 5 5 0 0 1 0-10h6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
</svg>
```

**使用场景**: 提示文本前缀

---

### 8. 网络节点图标（AI 引擎）
**尺寸**: 20x20  
**含义**: 神经网络/算法节点

```jsx
<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
  <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="2"/>
  <circle cx="6" cy="12" r="2" stroke="currentColor" strokeWidth="2"/>
  <circle cx="18" cy="12" r="2" stroke="currentColor" strokeWidth="2"/>
  <circle cx="12" cy="19" r="2" stroke="currentColor" strokeWidth="2"/>
  <path d="M12 7v4M10 11l-2 1M14 11l2 1M10 17l2-2M14 17l-2-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
</svg>
```

**使用场景**: "AI排课引擎" 标题

---

## CSS 样式配置

### 冲突图标容器
```css
.conflict-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}

.conflict-icon svg {
  display: block;
  opacity: 0.8;
}
```

### 列表项图标
```css
.ai-intro li {
  display: flex;
  align-items: center;
}

.ai-intro li svg {
  flex-shrink: 0;
  color: #6B7C6E;
  opacity: 0.9;
}
```

### 徽章图标
```css
.result-badge {
  display: inline-flex;
  align-items: center;
}

.result-badge svg {
  opacity: 0.9;
}
```

---

## 颜色继承机制

所有 SVG 使用 `stroke="currentColor"`，自动继承父元素颜色：

```jsx
// 成功状态（绿色）
<div className="conflict-item success">
  <span className="conflict-icon">
    <svg><!-- 图标会自动变成绿色 --></svg>
  </span>
</div>

// 警告状态（黄色）
<div className="conflict-item warning">
  <span className="conflict-icon">
    <svg><!-- 图标会自动变成黄色 --></svg>
  </span>
</div>
```

对应的 CSS：
```css
.conflict-item.success {
  background: #E8F0E9;
  color: #6B7C6E; /* SVG 继承这个颜色 */
}

.conflict-item.warning {
  background: #FFF4E6;
  color: #C17817; /* SVG 继承这个颜色 */
}
```

---

## 图标尺寸规范

| 使用场景 | 尺寸 | strokeWidth |
|---------|------|-------------|
| 标题图标 | 20x20 | 2 |
| 冲突分析 | 18x18 | 2 |
| 列表项 | 14x14 | 2.5 |
| 提示图标 | 16x16 | 2 |

---

## 最佳实践

### 1. 内联样式 vs CSS
优先使用 CSS，但特殊情况可使用内联样式：

```jsx
// 推荐：使用 CSS
<svg className="icon-teacher" width="18" height="18">...</svg>

// 可接受：特殊对齐需要
<svg width="14" height="14" style={{marginRight: '8px', verticalAlign: 'middle'}}>...</svg>
```

### 2. 响应式设计
图标大小在移动端保持不变（不需要缩放）：

```css
/* 桌面端和移动端使用相同尺寸 */
.conflict-icon svg {
  width: 18px;
  height: 18px;
}
```

### 3. 透明度控制
使用 opacity 增加视觉层次：

```css
/* 主要图标：较高不透明度 */
.conflict-icon svg {
  opacity: 0.8;
}

/* 辅助图标：中等不透明度 */
.ai-intro li svg {
  opacity: 0.9;
}
```

---

## 图标替换对照表

| 原文本标记 | 新 SVG 图标 | 说明 |
|-----------|------------|------|
| [用户][学校] | 教师图标 | 人形 + 教学手势 |
| [团队] | 学生群组图标 | 多人形组合 |
| [学校] | 教室图标 | 房间 + 座位 |
| [午餐] | 时钟图标 | 午休时间标记 |
| [√] | 对勾图标 | 完成/成功标记 |
| 📚 | 书本图标 | 教程/文档 |
| 💡 | 灯泡图标 | 提示/想法 |
| 🧬 | 网络节点图标 | AI/算法 |

---

## 未来扩展

如需添加新图标，遵循以下规范：

1. **设计风格**：线条简约，无填充
2. **尺寸标准**：14/16/18/20px
3. **颜色方案**：currentColor
4. **语义清晰**：图标含义一目了然
5. **可访问性**：适当的对比度和尺寸

---

**更新日期**: 2026年1月8日  
**设计师**: AI Assistant  
**设计风格**: Minimalistic Japanese (日系极简)

