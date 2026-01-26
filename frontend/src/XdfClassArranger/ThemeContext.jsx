import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Default to bright mode (默认为亮色模式)
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('xdf-theme');
    return savedTheme || 'bright';
  });

  useEffect(() => {
    // Apply theme to document root (将主题应用到文档根元素)
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('xdf-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'bright' ? 'dark' : 'bright');
  };

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
