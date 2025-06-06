'use client';

import React, { ReactNode } from 'react';
import { useTheme } from '../../lib/ThemeContext';
import { ConfigProvider, theme as antdTheme } from 'antd';

interface ThemeWrapperProps {
  children: ReactNode;
}


const ThemeWrapper: React.FC<ThemeWrapperProps> = ({ children }) => {
  const { theme } = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: theme === 'dark' ? '#177ddc' : '#1890ff',
        },
      }}
    >
      <div className={`theme-${theme}`}>{children}</div>
    </ConfigProvider>
  );
};

export default ThemeWrapper; 