'use client';

import './globals.css';
import React, { useState, useEffect } from 'react';
import { Layout, Menu, ConfigProvider, theme as antdTheme, App, Button, Drawer, FloatButton } from 'antd';
import { HomeOutlined, MedicineBoxOutlined, ScheduleOutlined, HistoryOutlined, UserOutlined, MenuOutlined, BulbOutlined, BulbFilled, CalendarOutlined } from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';
import ru_RU from 'antd/locale/ru_RU';
import { ThemeProvider, useTheme } from '../lib/ThemeContext';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { Inter } from 'next/font/google';
import { AuthProvider } from '../lib/contexts/AuthContext';

const { Header, Content, Sider } = Layout;

const inter = Inter({ subsets: ['latin'] });

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <FloatButton
      icon={theme === 'light' ? <BulbOutlined /> : <BulbFilled />}
      onClick={toggleTheme}
      tooltip={theme === 'light' ? 'Включить темную тему' : 'Включить светлую тему'}
      className="theme-toggle-button"
    />
  );
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const isAuthPage = pathname === '/auth';
  const { theme } = useTheme();

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) {
        setCollapsed(true);
      }
    };

    checkIsMobile();

    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: 'Главная',
      onClick: () => {
        router.push('/');
        if (isMobile) setDrawerVisible(false);
      },
    },
    {
      key: '/medicines',
      icon: <MedicineBoxOutlined />,
      label: 'Лекарства',
      onClick: () => {
        router.push('/medicines');
        if (isMobile) setDrawerVisible(false);
      },
    },
    {
      key: '/courses',
      icon: <ScheduleOutlined />,
      label: 'Курсы лечения',
      onClick: () => {
        router.push('/courses');
        if (isMobile) setDrawerVisible(false);
      },
    },
    {
      key: '/calendar',
      icon: <CalendarOutlined />,
      label: 'Календарь',
      onClick: () => {
        router.push('/calendar');
        if (isMobile) setDrawerVisible(false);
      },
    },
    {
      key: '/activity',
      icon: <HistoryOutlined />,
      label: 'История',
      onClick: () => {
        router.push('/activity');
        if (isMobile) setDrawerVisible(false);
      },
    },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: 'Профиль',
      onClick: () => {
        router.push('/profile');
        if (isMobile) setDrawerVisible(false);
      },
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: theme === 'dark' ? '#177ddc' : '#1890ff',
          fontSize: 14,
        },
      }}
      locale={ru_RU}
    >
      <App>
        {isAuthPage ? (
          <>
            {children}
            <ThemeToggle />
          </>
        ) : (
          <Layout style={{ minHeight: '100vh' }}>
            {isMobile ? (
              <>
                <Header style={{ 
                  padding: '0 16px', 
                  background: theme === 'dark' ? '#1f1f1f' : '#fff', 
                  boxShadow: '0 1px 4px rgba(0,21,41,.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <Button 
                    type="text" 
                    icon={<MenuOutlined />} 
                    onClick={() => setDrawerVisible(true)} 
                    style={{ fontSize: '18px' }}
                  />
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>CureTracker</div>
                  <div style={{ width: '32px' }}></div> 
                </Header>
                <Drawer
                  title="Меню"
                  placement="left"
                  onClose={() => setDrawerVisible(false)}
                  open={drawerVisible}
                  bodyStyle={{ padding: 0 }}
                >
                  <Menu
                    theme={theme === 'dark' ? 'dark' : 'light'}
                    mode="inline"
                    selectedKeys={[pathname]}
                    items={menuItems}
                  />
                </Drawer>
              </>
            ) : (
              <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={(value) => setCollapsed(value)}
                theme={theme === 'dark' ? 'dark' : 'dark'} 
              >
                <Menu
                  theme={theme === 'dark' ? 'dark' : 'dark'} 
                  mode="inline"
                  selectedKeys={[pathname]}
                  items={menuItems}
                  style={{ marginTop: '16px' }}
                />
              </Sider>
            )}
            <Layout>
              <Content style={{ margin: '0', padding: isMobile ? '8px' : '0 16px' }}>
                {children}
              </Content>
            </Layout>
            <ThemeToggle />
          </Layout>
        )}
      </App>
    </ConfigProvider>
  );
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>CureTracker</title>
      </head>
      <body style={{ margin: 0, padding: 0 }} className={inter.className}>
        <AuthProvider>
        <AntdRegistry>
          <ThemeProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </ThemeProvider>
        </AntdRegistry>
        </AuthProvider>
      </body>
    </html>
  );
}
