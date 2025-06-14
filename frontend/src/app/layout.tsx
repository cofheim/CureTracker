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

const MobileHeader: React.FC<{ onMenuClick: () => void, title: string }> = ({ onMenuClick, title }) => {
  const { theme } = useTheme();

  return (
    <Header style={{ 
      padding: '0 16px', 
      background: theme === 'dark' ? '#141414' : '#fff', 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: `1px solid ${theme === 'dark' ? '#303030' : '#f0f0f0'}`
    }}>
      <Button 
        type="text" 
        icon={<MenuOutlined />} 
        onClick={onMenuClick} 
        style={{ fontSize: '18px' }}
      />
      <div style={{ fontSize: '18px', fontWeight: '500' }}>{title}</div>
      <div style={{ width: '32px' }}></div> 
    </Header>
  );
};

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

  const getPageTitle = () => {
    if (pathname === '/') {
      return 'Главная';
    }
    // Находим все пункты меню, которым соответствует текущий путь (кроме главной страницы)
    const matchingItems = menuItems.filter(item => item.key !== '/' && pathname.startsWith(item.key));

    if (matchingItems.length > 0) {
      // Из всех совпадений выбираем самое длинное (наиболее точное)
      const bestMatch = matchingItems.reduce((best, current) => 
        current.key.length > best.key.length ? current : best
      );
      return bestMatch.label;
    }
    
    // Если не нашлось совпадений по части пути, ищем точное совпадение
    const exactMatch = menuItems.find(item => item.key === pathname);
    if (exactMatch) {
      return exactMatch.label;
    }

    return 'CureTracker'; // Общий запасной заголовок
  };

  const pageTitle = getPageTitle();

  if (isAuthPage) {
    return (
      <>
        {children}
        <ThemeToggle />
      </>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {isMobile ? (
        <>
          <MobileHeader onMenuClick={() => setDrawerVisible(true)} title={pageTitle} />
          <Drawer
            title="Меню"
            placement="left"
            onClose={() => setDrawerVisible(false)}
            open={drawerVisible}
            bodyStyle={{ padding: 0 }}
          >
            <div style={{ fontSize: '18px', fontWeight: 'bold', padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
              CureTracker
            </div>
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
          theme="dark"
        >
          <div style={{ 
            height: '32px', 
            margin: '16px', 
            background: 'rgba(255, 255, 255, 0.2)', 
            textAlign: 'center', 
            lineHeight: '32px', 
            color: 'white',
            fontWeight: 'bold' 
          }}>
            CT
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[pathname]}
            items={menuItems}
          />
        </Sider>
      )}
      <Layout>
        <Content style={{ padding: isMobile ? '8px' : '16px' }}>
          {children}
        </Content>
      </Layout>
      <ThemeToggle />
    </Layout>
  );
};

const AppWithTheme: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: theme === 'dark' ? '#177ddc' : '#1890ff',
        },
      }}
      locale={ru_RU}
    >
      <App>
        <AppLayout>
          {children}
        </AppLayout>
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
        <AntdRegistry>
          <ThemeProvider>
            <AppWithTheme>
              <AuthProvider>
                {children}
              </AuthProvider>
            </AppWithTheme>
          </ThemeProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
