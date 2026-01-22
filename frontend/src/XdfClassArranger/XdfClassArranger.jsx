import React, { useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import './XdfClassArranger.css';

const XdfClassArranger = () => {
  const calendarRef = useRef(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  
  // 苹果风格的颜色方案
  const appleColors = [
    { bg: '#FF3B30', border: '#FF3B30', text: '#FFFFFF' }, // 红色
    { bg: '#FF9500', border: '#FF9500', text: '#FFFFFF' }, // 橙色
    { bg: '#FFCC00', border: '#FFCC00', text: '#000000' }, // 黄色
    { bg: '#34C759', border: '#34C759', text: '#FFFFFF' }, // 绿色
    { bg: '#00C7BE', border: '#00C7BE', text: '#FFFFFF' }, // 青色
    { bg: '#007AFF', border: '#007AFF', text: '#FFFFFF' }, // 蓝色
    { bg: '#5856D6', border: '#5856D6', text: '#FFFFFF' }, // 紫色
    { bg: '#AF52DE', border: '#AF52DE', text: '#FFFFFF' }, // 粉紫色
  ];

  const getRandomColor = () => {
    return appleColors[Math.floor(Math.random() * appleColors.length)];
  };
  
  // 示例事件数据
  const [events, setEvents] = useState([
    {
      id: '1',
      title: '面试练习 - 张三',
      start: '2025-12-10T10:00:00',
      end: '2025-12-10T12:00:00',
      backgroundColor: '#FF3B30',
      borderColor: '#FF3B30',
      textColor: '#FFFFFF',
      extendedProps: {
        student: '张三',
        teacher: '李老师',
        campus: '旗舰校',
        room: '个别指导室1',
        description: '1v1大学面试练习'
      }
    },
    {
      id: '2',
      title: '志望理由书 - 王五',
      start: '2025-12-12T14:00:00',
      end: '2025-12-12T16:00:00',
      backgroundColor: '#007AFF',
      borderColor: '#007AFF',
      textColor: '#FFFFFF',
      extendedProps: {
        student: '王五',
        teacher: '赵老师',
        campus: '东京本校',
        room: '板二101',
        description: '1v1志望理由书指导'
      }
    },
    {
      id: '3',
      title: 'EJU日语 - 李四',
      start: '2025-12-15T09:00:00',
      end: '2025-12-15T11:00:00',
      backgroundColor: '#34C759',
      borderColor: '#34C759',
      textColor: '#FFFFFF',
      extendedProps: {
        student: '李四',
        teacher: '孙老师',
        campus: '旗舰校',
        room: '个别指导室3',
        description: '1v1EJU日语辅导'
      }
    },
    {
      id: '4',
      title: '小论文辅导 - 赵六',
      start: '2025-12-16T15:00:00',
      end: '2025-12-16T17:00:00',
      backgroundColor: '#FF9500',
      borderColor: '#FF9500',
      textColor: '#FFFFFF',
      extendedProps: {
        student: '赵六',
        teacher: '钱老师',
        campus: '旗舰校',
        room: '个别指导室2',
        description: '1v1校内考小论文'
      }
    }
  ]);

  // 拖拽选择创建新事件（苹果风格）
  const handleDateSelect = (selectInfo) => {
    const title = prompt('请输入课程名称:');
    if (title) {
      const color = getRandomColor();
      const newEvent = {
        id: String(Date.now()),
        title: title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay,
        backgroundColor: color.bg,
        borderColor: color.border,
        textColor: color.text
      };
      setEvents([...events, newEvent]);
      selectInfo.view.calendar.unselect(); // 清除选择
    }
  };

  // 点击事件显示详情弹窗（苹果风格）
  const handleEventClick = (clickInfo) => {
    const rect = clickInfo.el.getBoundingClientRect();
    setModalPosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
    setSelectedEvent(clickInfo.event);
    setShowEventModal(true);
  };

  // 双击事件编辑
  const handleEventDoubleClick = (event) => {
    const newTitle = prompt('修改课程名称:', event.title);
    if (newTitle && newTitle !== event.title) {
      event.setProp('title', newTitle);
      setEvents(events.map(e => 
        e.id === event.id ? { ...e, title: newTitle } : e
      ));
    }
  };

  // 删除事件
  const handleDeleteEvent = () => {
    if (selectedEvent) {
      selectedEvent.remove();
      setEvents(events.filter(e => e.id !== selectedEvent.id));
      setShowEventModal(false);
      setSelectedEvent(null);
    }
  };

  // 拖动事件改变时间（带动画反馈）
  const handleEventDrop = (info) => {
    // 添加触觉反馈效果
    info.el.style.transform = 'scale(1.05)';
    setTimeout(() => {
      info.el.style.transform = 'scale(1)';
    }, 200);
    
    // 更新事件数据
    setEvents(events.map(e => {
      if (e.id === info.event.id) {
        return {
          ...e,
          start: info.event.startStr,
          end: info.event.endStr
        };
      }
      return e;
    }));
  };

  // 调整事件时长（带动画反馈）
  const handleEventResize = (info) => {
    // 添加触觉反馈效果
    info.el.style.transform = 'scale(1.02)';
    setTimeout(() => {
      info.el.style.transform = 'scale(1)';
    }, 200);
    
    // 更新事件数据
    setEvents(events.map(e => {
      if (e.id === info.event.id) {
        return {
          ...e,
          start: info.event.startStr,
          end: info.event.endStr
        };
      }
      return e;
    }));
  };

  // 关闭弹窗
  const closeModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  return (
    <div className="xdf-class-arranger apple-style">
      <div className="apple-calendar-container">
        <div className="calendar-sidebar">
          <div className="sidebar-header">
            <h2>日历</h2>
          </div>
          <div className="calendar-list">
            <div className="calendar-item active">
              <span className="color-dot" style={{ backgroundColor: '#FF3B30' }}></span>
              <span>前途塾课程</span>
            </div>
          </div>
          <div className="mini-calendar">
            {/* 可以添加迷你月历 */}
          </div>
        </div>

        <div className="calendar-main">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            
            // 初始设置
            initialView="timeGridWeek"
            initialDate="2025-12-01"
            
            // 头部工具栏配置（苹果风格）
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            
            // 按钮文字
            buttonText={{
              today: '今天',
              month: '月',
              week: '周',
              day: '日'
            }}
            
            // 视图配置
            views={{
              dayGridMonth: {
                titleFormat: { year: 'numeric', month: 'long' },
                dayHeaderFormat: { weekday: 'short' }
              },
              timeGridWeek: {
                titleFormat: { year: 'numeric', month: 'long', day: 'numeric' },
                dayHeaderFormat: { weekday: 'short', month: 'numeric', day: 'numeric' },
                slotLabelFormat: {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: false
                }
              },
              timeGridDay: {
                titleFormat: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
              }
            }}
            
            // 时间配置
            locale="zh-cn"
            timeZone="Asia/Tokyo"
            slotMinTime="07:00:00"
            slotMaxTime="22:00:00"
            slotDuration="00:30:00"
            scrollTime="08:00:00"
            
            // 显示配置
            weekends={true}
            navLinks={true}
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            nowIndicator={true}
            
            // 高度配置
            height="auto"
            contentHeight="auto"
            aspectRatio={1.8}
            
            // 事件数据
            events={events}
            
            // 事件处理
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            
            // 事件渲染（苹果风格）
            eventContent={(eventInfo) => {
              const { event } = eventInfo;
              return (
                <div 
                  className="apple-event-content"
                  onDoubleClick={() => handleEventDoubleClick(event)}
                >
                  <div className="event-time">{eventInfo.timeText}</div>
                  <div className="event-title">{event.title}</div>
                  {event.extendedProps.room && (
                    <div className="event-location">{event.extendedProps.room}</div>
                  )}
                </div>
              );
            }}
          />
        </div>
      </div>

      {/* 苹果风格的事件详情弹窗 */}
      {showEventModal && selectedEvent && (
        <>
          <div className="modal-backdrop" onClick={closeModal}></div>
          <div 
            className="apple-event-modal"
            style={{
              left: `${modalPosition.x}px`,
              top: `${modalPosition.y}px`,
            }}
          >
            <div className="modal-header">
              <div 
                className="modal-color-bar" 
                style={{ backgroundColor: selectedEvent.backgroundColor }}
              ></div>
              <h3>{selectedEvent.title}</h3>
              <button className="modal-close" onClick={closeModal}>
                <svg width="14" height="14" viewBox="0 0 14 14">
                  <path d="M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z" fill="currentColor"/>
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="modal-row">
                <span className="modal-icon">[时间]</span>
                <div className="modal-info">
                  <div className="modal-label">时间</div>
                  <div className="modal-value">
                    {selectedEvent.start?.toLocaleString('zh-CN', { 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    {selectedEvent.end && ` - ${selectedEvent.end.toLocaleString('zh-CN', { 
                      hour: '2-digit',
                      minute: '2-digit'
                    })}`}
                  </div>
                </div>
              </div>
              
              {selectedEvent.extendedProps.student && (
                <div className="modal-row">
                  <span className="modal-icon">[用户]</span>
                  <div className="modal-info">
                    <div className="modal-label">学生</div>
                    <div className="modal-value">{selectedEvent.extendedProps.student}</div>
                  </div>
                </div>
              )}
              
              {selectedEvent.extendedProps.teacher && (
                <div className="modal-row">
                  <span className="modal-icon">[用户]‍[学校]</span>
                  <div className="modal-info">
                    <div className="modal-label">老师</div>
                    <div className="modal-value">{selectedEvent.extendedProps.teacher}</div>
                  </div>
                </div>
              )}
              
              {selectedEvent.extendedProps.campus && (
                <div className="modal-row">
                  <span className="modal-icon">[学校]</span>
                  <div className="modal-info">
                    <div className="modal-label">校区</div>
                    <div className="modal-value">{selectedEvent.extendedProps.campus}</div>
                  </div>
                </div>
              )}
              
              {selectedEvent.extendedProps.room && (
                <div className="modal-row">
                  <span className="modal-icon">[位置]</span>
                  <div className="modal-info">
                    <div className="modal-label">教室</div>
                    <div className="modal-value">{selectedEvent.extendedProps.room}</div>
                  </div>
                </div>
              )}
              
              {selectedEvent.extendedProps.description && (
                <div className="modal-row">
                  <span className="modal-icon">[编辑]</span>
                  <div className="modal-info">
                    <div className="modal-label">说明</div>
                    <div className="modal-value">{selectedEvent.extendedProps.description}</div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                className="modal-button modal-button-danger"
                onClick={handleDeleteEvent}
              >
                删除课程
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default XdfClassArranger;

