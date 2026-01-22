# FullCalendar React 使用说明

## [文档] 目录

1. [基本介绍](#基本介绍)
2. [已安装的包](#已安装的包)
3. [当前功能](#当前功能)
4. [使用方法](#使用方法)
5. [配置说明](#配置说明)
6. [扩展开发](#扩展开发)

---

## 基本介绍

FullCalendar 是一个功能强大的 JavaScript 日历库，我们已经成功集成到 `XdfClassArranger` 组件中。

### 版本信息

- **FullCalendar**: 最新版本
- **React**: 18.3.1
- **插件**: dayGrid, timeGrid, interaction, list

---

## 已安装的包

我们已经安装了以下 FullCalendar 相关包：

```json
{
  "@fullcalendar/core": "最新版",
  "@fullcalendar/react": "最新版",
  "@fullcalendar/daygrid": "最新版", // 月视图/日视图
  "@fullcalendar/timegrid": "最新版", // 周视图/带时间的日视图
  "@fullcalendar/interaction": "最新版", // 交互功能（拖拽、点击）
  "@fullcalendar/list": "最新版" // 列表视图
}
```

### 各插件说明

| 插件                | 功能                 | 视图类型                                    |
| ------------------- | -------------------- | ------------------------------------------- |
| `dayGridPlugin`     | 月视图、日视图       | `dayGridMonth`, `dayGridWeek`, `dayGridDay` |
| `timeGridPlugin`    | 带时间轴的周/日视图  | `timeGridWeek`, `timeGridDay`               |
| `interactionPlugin` | 拖拽、调整大小、点击 | -                                           |
| `listPlugin`        | 列表形式显示事件     | `listWeek`, `listMonth`, `listYear`         |

---

## 当前功能

### [√] 已实现的功能

1. **视图切换**

   - [日历] 月视图（dayGridMonth）
   - [日历] 周视图（timeGridWeek）
   - [列表] 日视图（timeGridDay）
   - [编辑] 列表视图（listWeek）

2. **事件管理**

   - + 点击日期添加新课程
   - [查看]️ 点击事件查看详情
   - [删除]️ 删除课程
   - ⟲ 拖动改变时间
   - ⏱️ 拖动边缘调整时长

3. **中文化**

   - [中文] 界面完全中文化
   - [时间] 时区设置为东京时间
   - [日历] 日期格式符合中文习惯

4. **示例数据**
   - 三个示例课程
   - 包含学生、老师、校区、教室信息

---

## 使用方法

### 1. 启动应用

```bash
cd /Users/benz/Desktop/Stanford/FA25/sci_tokyo/sci_tokyo
npm start
```

然后访问对应的路由（通常是 `/xdf-class-arranger`）

### 2. 基本操作

#### [日历] 查看日历

- **切换视图**: 右上角按钮（月/周/日/列表）
- **导航**: 左上角的 "上一月/下一月" 按钮
- **回到今天**: 点击 "今天" 按钮

#### + 添加课程

1. 点击任意日期
2. 在弹出框中输入课程名称
3. 点击确定

#### [查看]️ 查看课程详情

- 直接点击日历上的课程
- 会显示完整信息（时间、学生、老师、校区、教室）

#### [删除]️ 删除课程

1. 点击要删除的课程
2. 在详情弹窗中点击"确定"即可删除

#### ⟲ 修改课程时间

- **拖动整个事件**: 改变开始时间（保持时长不变）
- **拖动事件边缘**: 调整时长

### 3. 视图说明

#### 月视图 (dayGridMonth)

```javascript
// 显示整月的所有课程
// 适合查看整体安排
初始视图，显示所有日期和事件
```

#### 周视图 (timeGridWeek)

```javascript
// 显示一周，带时间轴（8:00-22:00）
// 适合详细安排课程时间
每天按小时显示，可以看到精确的上课时间
```

#### 日视图 (timeGridDay)

```javascript
// 显示单日，带完整时间轴
// 适合查看某天的详细安排
专注于单日的课程安排，时间精确到分钟
```

#### 列表视图 (listWeek)

```javascript
// 以列表形式显示本周事件
// 适合打印或快速浏览
按时间顺序列出所有课程;
```

---

## 配置说明

### 当前配置

```javascript
<FullCalendar
  // 插件
  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
  // 初始设置
  initialView="dayGridMonth" // 默认显示月视图
  initialDate="2025-12-01" // 初始显示2025年12月
  // 时间配置
  locale="zh-cn" // 中文界面
  timeZone="Asia/Tokyo" // 东京时间
  slotMinTime="08:00:00" // 开始时间 8:00
  slotMaxTime="22:00:00" // 结束时间 22:00
  slotDuration="00:30:00" // 时间槽30分钟
  // 功能开关
  editable={true} // 允许编辑
  selectable={true} // 允许选择
  dayMaxEvents={true} // 事件过多时显示"更多"
  weekends={true} // 显示周末
  navLinks={true} // 日期可点击
  // 事件数据
  events={events} // 课程数据
  // 事件处理
  dateClick={handleDateClick} // 点击日期
  eventClick={handleEventClick} // 点击事件
  eventDrop={handleEventDrop} // 拖动事件
  eventResize={handleEventResize} // 调整大小
/>
```

### 可修改的关键参数

| 参数           | 默认值         | 说明     | 可选值                                                    |
| -------------- | -------------- | -------- | --------------------------------------------------------- |
| `initialView`  | `dayGridMonth` | 初始视图 | `dayGridMonth`, `timeGridWeek`, `timeGridDay`, `listWeek` |
| `slotMinTime`  | `08:00:00`     | 开始时间 | 任意时间（如 `06:00:00`）                                 |
| `slotMaxTime`  | `22:00:00`     | 结束时间 | 任意时间（如 `23:00:00`）                                 |
| `slotDuration` | `00:30:00`     | 时间间隔 | `00:15:00`, `01:00:00` 等                                 |
| `weekends`     | `true`         | 显示周末 | `true` / `false`                                          |
| `editable`     | `true`         | 允许编辑 | `true` / `false`                                          |

---

## 扩展开发

### 1. 添加更多事件数据

修改 `events` state 来添加更多课程：

```javascript
const [events, setEvents] = useState([
  {
    id: "1",
    title: "1v1大学面试练习 - 张三",
    start: "2025-12-10T10:00:00",
    end: "2025-12-10T12:00:00",
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
    extendedProps: {
      student: "张三",
      teacher: "李老师",
      campus: "旗舰校",
      room: "个别指导室1",
      courseType: "面试练习",
      status: "已确认",
    },
  },
  // 添加更多事件...
]);
```

### 2. 从后端加载数据

```javascript
useEffect(() => {
  // 从API获取课程数据
  fetch("/api/courses")
    .then((res) => res.json())
    .then((data) => {
      setEvents(data);
    });
}, []);
```

### 3. 自定义事件颜色

根据课程类型设置不同颜色：

```javascript
const getEventColor = (courseType) => {
  const colors = {
    面试练习: "#4CAF50",
    志望理由书: "#2196F3",
    EJU日语: "#FF9800",
    EJU文数: "#9C27B0",
    校内考: "#F44336",
  };
  return colors[courseType] || "#666666";
};
```

### 4. 添加更多插件

FullCalendar 还支持其他插件：

```bash
# 资源时间轴（适合多教室管理）
npm install @fullcalendar/resource-timeline

# 谷歌日历集成
npm install @fullcalendar/google-calendar

# iCalendar 支持
npm install @fullcalendar/icalendar
```

### 5. 连接 Excel 数据

基于之前分析的 `前途塾1v1约课.xlsx`，你可以：

```javascript
// 读取 Excel 数据并转换为 FullCalendar 事件格式
const convertExcelToEvents = (excelData) => {
  return excelData.map((row, index) => ({
    id: String(index),
    title: `${row["上课内容"]} - ${row["学生姓名"]}`,
    start: row["起止时间"], // 需要转换为 ISO 格式
    backgroundColor: getColorByType(row["上课内容"]),
    extendedProps: {
      student: row["学生姓名"],
      teacher: row["负责老师"],
      campus: row["校区"],
      courseType: row["上课内容"],
      duration: row["上课时长"],
    },
  }));
};
```

### 6. 教室资源管理

利用 `教室列表.csv`，可以实现教室管理：

```javascript
// 定义教室资源
const classrooms = [
  { id: '1', title: '个别指导室1', campus: '旗舰校' },
  { id: '2', title: '个别指导室2', campus: '旗舰校' },
  { id: '3', title: '板二101', campus: '东京本校' },
  // ...
];

// 使用 resourceTimelinePlugin
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';

<FullCalendar
  plugins={[resourceTimelinePlugin, ...]}
  schedulerLicenseKey="GPL-My-Project-Is-Open-Source"
  resources={classrooms}
  // ...
/>
```

### 7. 导出功能

```javascript
// 导出为 iCal 格式
const exportToICS = () => {
  const icsContent = events
    .map((event) => {
      return `BEGIN:VEVENT
UID:${event.id}
DTSTAMP:${new Date().toISOString()}
DTSTART:${event.start}
DTEND:${event.end}
SUMMARY:${event.title}
END:VEVENT`;
    })
    .join("\n");

  // 下载文件
  const blob = new Blob([icsContent], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "courses.ics";
  a.click();
};
```

### 8. 冲突检测

```javascript
// 检查时间冲突
const hasConflict = (newEvent) => {
  return events.some((event) => {
    const newStart = new Date(newEvent.start);
    const newEnd = new Date(newEvent.end);
    const existingStart = new Date(event.start);
    const existingEnd = new Date(event.end);

    return (
      (newStart >= existingStart && newStart < existingEnd) ||
      (newEnd > existingStart && newEnd <= existingEnd) ||
      (newStart <= existingStart && newEnd >= existingEnd)
    );
  });
};
```

---

## 常见问题

### Q1: 如何修改工作时间？

修改 `slotMinTime` 和 `slotMaxTime`：

```javascript
slotMinTime = "06:00:00"; // 早上6点开始
slotMaxTime = "23:00:00"; // 晚上11点结束
```

### Q2: 如何隐藏周末？

设置 `weekends={false}`

### Q3: 如何改变时间间隔？

修改 `slotDuration`：

```javascript
slotDuration = "00:15:00"; // 15分钟间隔
slotDuration = "01:00:00"; // 1小时间隔
```

### Q4: 如何添加更多视图？

在 `headerToolbar` 的 `right` 部分添加：

```javascript
right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek,listMonth";
```

### Q5: 事件太多怎么办？

FullCalendar 会自动处理，超过限制会显示 "+N more" 链接

---

## 参考资源

- [手册] [FullCalendar 官方文档](https://fullcalendar.io/docs)
- [配置] [React 集成指南](https://fullcalendar.io/docs/react)
- [设计] [样式定制](https://fullcalendar.io/docs/css-customization)
- [日历] [事件对象](https://fullcalendar.io/docs/event-object)
- [目标] [API 方法](https://fullcalendar.io/docs/Calendar)

---

## 下一步开发建议

1. [√] **连接后端 API**: 从服务器加载和保存课程数据
2. [√] **Excel 导入**: 实现从 `前途塾1v1约课.xlsx` 导入数据
3. [√] **冲突检测**: 防止教室或老师时间冲突
4. [√] **权限管理**: 不同角色（学管/教务）有不同权限
5. [√] **通知系统**: 课程变更时通知相关人员
6. [√] **打印功能**: 生成可打印的课程表
7. [√] **筛选功能**: 按校区、老师、学生筛选
8. [√] **统计功能**: 课程数量、教室使用率等

---

**版本**: v0.2.0  
**更新时间**: 2026-01-03  
**作者**: 开发团队
