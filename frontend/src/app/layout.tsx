'use client'; // Если используем ConfigProvider, layout должен быть клиентским или использовать AntdRegistry

import './globals.css';
import React, { useState, useEffect } from 'react';
import { Layout, Menu, ConfigProvider, theme, App, Button, Drawer } from 'antd';
import { HomeOutlined, MedicineBoxOutlined, ScheduleOutlined, HistoryOutlined, UserOutlined, MenuOutlined } from '@ant-design/icons';
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
  const [isMobile, setIsMobile] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const isAuthPage = pathname === '/auth';

  // Определение мобильного устройства при загрузке и изменении размера окна
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) {
        setCollapsed(true);
      }
    };

    // Проверяем при первой загрузке
    checkIsMobile();

    // Добавляем слушатель изменения размера окна
    window.addEventListener('resize', checkIsMobile);

    // Очистка слушателя при размонтировании компонента
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
              fontSize: 14,
            },
          }}
          locale={ru_RU}
        >
          <App>
            {isAuthPage ? (
              children
            ) : (
              <Layout style={{ minHeight: '100vh' }}>
                {isMobile ? (
                  <>
                    <Header style={{ 
                      padding: '0 16px', 
                      background: '#fff', 
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
                      <div style={{ width: '32px' }}></div> {/* Для выравнивания заголовка по центру */}
                    </Header>
                    <Drawer
                      title="Меню"
                      placement="left"
                      onClose={() => setDrawerVisible(false)}
                      open={drawerVisible}
                      bodyStyle={{ padding: 0 }}
                    >
                      <Menu
                        theme="light"
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
                  >
                    <Menu
                      theme="dark"
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
              </Layout>
            )}
          </App>
        </ConfigProvider>
      </body>
    </html>
  );
}
