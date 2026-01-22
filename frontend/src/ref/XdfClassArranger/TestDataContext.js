import React, { createContext, useContext, useState } from 'react';

// 创建测试数据上下文
const TestDataContext = createContext();

// 自定义 Hook 方便使用
export const useTestData = () => {
  const context = useContext(TestDataContext);
  if (!context) {
    throw new Error('useTestData must be used within TestDataProvider');
  }
  return context;
};

// Provider 组件
export const TestDataProvider = ({ children }) => {
  const [showTestData, setShowTestData] = useState(false);

  const toggleTestData = () => {
    setShowTestData(prev => !prev);
  };

  return (
    <TestDataContext.Provider value={{ showTestData, toggleTestData }}>
      {children}
    </TestDataContext.Provider>
  );
};



