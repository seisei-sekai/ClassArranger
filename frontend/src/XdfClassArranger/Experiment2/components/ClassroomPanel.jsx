/**
 * Classroom Panel - Experiment2
 * 教室管理面板
 */

import React, { useState } from 'react';

const ClassroomPanel = ({ classrooms, onClassroomsChange, granularity }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCampus, setFilterCampus] = useState('');
  const [editingClassroom, setEditingClassroom] = useState(null);

  /**
   * Filter classrooms
   */
  const filteredClassrooms = classrooms.filter(classroom => {
    if (searchTerm && !classroom.name.includes(searchTerm)) return false;
    if (filterCampus && classroom.campus !== filterCampus) return false;
    return true;
  });

  /**
   * Handle classroom deletion
   */
  const handleDelete = (id) => {
    if (confirm('确定要删除这个教室吗？')) {
      onClassroomsChange(classrooms.filter(c => c.id !== id));
    }
  };

  /**
   * Handle classroom edit
   */
  const handleEdit = (classroom) => {
    setEditingClassroom(classroom);
    alert('编辑功能开发中');
  };

  /**
   * Get unique campuses for filter
   */
  const uniqueCampuses = [...new Set(classrooms.map(c => c.campus).filter(Boolean))];

  /**
   * Group classrooms by campus
   */
  const groupedClassrooms = filteredClassrooms.reduce((acc, classroom) => {
    const campus = classroom.campus || '未指定';
    if (!acc[campus]) {
      acc[campus] = [];
    }
    acc[campus].push(classroom);
    return acc;
  }, {});

  return (
    <div className="classroom-panel">
      <div className="panel-header">
        <h2>教室管理</h2>
        <div className="panel-summary">
          共 {classrooms.length} 间教室
        </div>
      </div>

      {/* Filters */}
      <div className="panel-filters">
        <input
          type="text"
          className="search-input"
          placeholder="搜索教室名称..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <select
          className="filter-select"
          value={filterCampus}
          onChange={(e) => setFilterCampus(e.target.value)}
        >
          <option value="">所有校区</option>
          {uniqueCampuses.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Classroom list */}
      <div className="panel-content">
        {filteredClassrooms.length === 0 ? (
          <div className="empty-state">
            <p>没有找到教室数据</p>
            <p className="empty-hint">请前往"数据导入"添加教室</p>
          </div>
        ) : (
          <div className="classroom-groups">
            {Object.entries(groupedClassrooms).map(([campus, rooms]) => (
              <div key={campus} className="campus-group">
                <h3 className="campus-title">{campus} ({rooms.length}间)</h3>
                <div className="classroom-list">
                  {rooms.map(classroom => (
                    <div key={classroom.id} className="classroom-item">
                      <div className="item-header">
                        <span className="classroom-name">{classroom.name}</span>
                        <div className="item-actions">
                          <button
                            className="btn-icon edit"
                            onClick={() => handleEdit(classroom)}
                            title="编辑"
                          >
                            ✎
                          </button>
                          <button
                            className="btn-icon delete"
                            onClick={() => handleDelete(classroom.id)}
                            title="删除"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <div className="item-details">
                        <span className="detail-badge type">{classroom.type}</span>
                        <span className="detail-badge capacity">容量: {classroom.capacity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassroomPanel;
