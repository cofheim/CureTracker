'use client'; // Если используем ConfigProvider, layout должен быть клиентским или использовать AntdRegistry

import './globals.css';
import React, { useState, useEffect } from 'react';
import { Layout, Menu, ConfigProvider, theme, App } from 'antd';
import { HomeOutlined, MedicineBoxOutlined, ScheduleOutlined, HistoryOutlined } from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';
import ru_RU from 'antd/locale/ru_RU';

const { Header, Content, Sider } = Layout;

// export const metadata: Metadata = { // Metadata не может быть экспортирована из клиентского компонента
// title: "CureTracker",
// description: "Ваш персональный трекер приема лекарств",
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const isAuthPage = pathname === '/auth';

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: 'Главная',
      onClick: () => router.push('/'),
    },
    {
      key: '/medicines',
      icon: <MedicineBoxOutlined />,
      label: 'Лекарства',
      onClick: () => router.push('/medicines'),
    },
    {
      key: '/courses',
      icon: <ScheduleOutlined />,
      label: 'Курсы лечения',
      onClick: () => router.push('/courses'),
    },
    {
      key: '/activity',
      icon: <HistoryOutlined />,
      label: 'История',
      onClick: () => router.push('/activity'),
    },
  ];

  return (
    <html lang="ru">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>CureTracker</title>
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <ConfigProvider
          theme={{
            algorithm: theme.defaultAlgorithm,
            token: {
              colorPrimary: '#1890ff',
            },
          }}
          locale={ru_RU}
        >
          <App>
            {isAuthPage ? (
              children
            ) : (
              <Layout style={{ minHeight: '100vh' }}>
                <Sider
                  collapsible
                  collapsed={collapsed}
                  onCollapse={(value) => setCollapsed(value)}
                >
                  <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <span style={{ color: 'white', fontWeight: 'bold' }}>
                      {collapsed ? 'CT' : 'CureTracker'}
                    </span>
                  </div>
                  <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[pathname]}
                    items={menuItems}
                  />
                </Sider>
                <Layout>
                  <Content style={{ margin: '0', padding: '0 16px' }}>
                    {children}
                  </Content>
                </Layout>
              </Layout>
            )}
          </App>
        </ConfigProvider>
      </body>
    </html>
  );
}
