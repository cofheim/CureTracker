// src/app/providers.tsx
'use client';

import '@ant-design/v5-patch-for-react-19';
import { ConfigProvider, theme } from 'antd';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
        },
        components: {
          Button: {
            motion: false
          }
        }
      }}
    >
      {children}
    </ConfigProvider>
  );
}