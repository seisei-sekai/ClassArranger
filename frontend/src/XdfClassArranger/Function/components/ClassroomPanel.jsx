/**
 * Classroom Panel Component
 * 教室资源面板组件
 * 
 * Display and manage classroom resources
 * 显示和管理教室资源
 * 
 * Note: Excel loading functionality to be integrated with xlsx library
 * 注意：Excel加载功能将与xlsx库集成
 */

import React, { useState, useEffect } from 'react';
import './ClassroomPanel.css';

const ClassroomPanel = ({ classrooms, schedule, onSelectRoom }) => {
  const [filter, setFilter] = useState('all'); // 'all', 'available', 'occupied'
  const [campusFilter, setCampusFilter] = useState('all');
  
  // Get unique campuses (获取唯一校区)
  const campuses = [...new Set(classrooms.map(r => r.campus))].filter(Boolean);
  
  // Filter classrooms (过滤教室)
  const filteredRooms = classrooms.filter(room => {
    if (campusFilter !== 'all' && room.campus !== campusFilter) return false;
    
    if (filter === 'available') {
      return !isRoomOccupied(room, schedule);
    } else if (filter === 'occupied') {
      return isRoomOccupied(room, schedule);
    }
    
    return true;
  });
  
  // Calculate room statistics (计算教室统计)
  const stats = {
    total: classrooms.length,
    available: classrooms.filter(r => !isRoomOccupied(r, schedule)).length,
    occupied: classrooms.filter(r => isRoomOccupied(r, schedule)).length
  };
  
  return (
    <div className="classroom-panel">
      <div className="panel-header">
        <h3 className="panel-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          教室资源
        </h3>
      </div>
      
      {/* Statistics (统计) */}
      <div className="room-stats">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">总计</div>
        </div>
        <div className="stat-card available">
          <div className="stat-value">{stats.available}</div>
          <div className="stat-label">可用</div>
        </div>
        <div className="stat-card occupied">
          <div className="stat-value">{stats.occupied}</div>
          <div className="stat-label">占用</div>
        </div>
      </div>
      
      {/* Filters (过滤器) */}
      <div className="panel-filters">
        <div className="filter-group">
          <label>状态:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">全部</option>
            <option value="available">可用</option>
            <option value="occupied">占用中</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>校区:</label>
          <select value={campusFilter} onChange={(e) => setCampusFilter(e.target.value)}>
            <option value="all">全部校区</option>
            {campuses.map(campus => (
              <option key={campus} value={campus}>{campus}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Room List (教室列表) */}
      <div className="room-list">
        {filteredRooms.length === 0 ? (
          <div className="empty-state">
            <p>未找到教室</p>
          </div>
        ) : (
          filteredRooms.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              isOccupied={isRoomOccupied(room, schedule)}
              onSelect={() => onSelectRoom && onSelectRoom(room)}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Check if room is occupied (检查教室是否被占用)
const isRoomOccupied = (room, schedule) => {
  if (!schedule || schedule.length === 0) return false;
  return schedule.some(course => course.room && course.room.id === room.id);
};

// Room Card Component (教室卡片组件)
const RoomCard = ({ room, isOccupied, onSelect }) => {
  return (
    <div 
      className={`room-card ${isOccupied ? 'occupied' : 'available'}`}
      onClick={onSelect}
    >
      <div className="room-header">
        <div className="room-name">{room.name || room.id}</div>
        <div className={`room-status ${isOccupied ? 'occupied' : 'available'}`}>
          {isOccupied ? '占用' : '可用'}
        </div>
      </div>
      
      <div className="room-details">
        {room.campus && (
          <div className="room-detail">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span>{room.campus}</span>
          </div>
        )}
        
        {room.capacity && (
          <div className="room-detail">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>容量: {room.capacity}</span>
          </div>
        )}
        
        {room.priority && (
          <div className="room-detail">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>优先级: {room.priority}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassroomPanel;

