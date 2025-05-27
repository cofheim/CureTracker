'use client';

import { Layout, Menu, theme } from "antd";
import "./globals.css";
import { Content, Footer, Header } from "antd/es/layout/layout";
import Link from "next/link";
import { Providers } from './providers'
import { usePathname } from 'next/navigation';

const items = [
  {
    key: "/", 
    label: <Link href={"/"} style={{ fontSize: '16px', fontWeight: 700 }}>Главная</Link>
  },
  {
    key: "/medicines", 
    label: <Link href={"/medicines"} style={{ fontSize: '16px', fontWeight: 700 }}>Лекарства</Link>
  },
  {
    key: "/calendar", 
    label: <Link href={"/calendar"} style={{ fontSize: '16px', fontWeight: 700 }}>Календарь</Link>
  }
]

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { token } = theme.useToken();

  // Градиентный фон для хедера
  const headerBackground = "linear-gradient(90deg,rgb(34, 80, 230) 0%,rgb(255, 0, 0) 100%)";
  
  // Стили для активного пункта меню
  const activeItemStyle = {
    backgroundColor: 'rgba(194, 15, 15, 0.2)',
    borderRadius: '6px',
    transition: 'all 0.3s ease'
  };

  return (
    <html lang="ru">
      <body>
        <Providers>
          <Layout style={{ minHeight: "100vh" }}>
            <Header style={{ 
              background: headerBackground,
              padding: '0 24px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
            }}>
              <Menu 
                mode="horizontal"
                selectedKeys={[pathname]}
                items={items}
                style={{ 
                  background: 'transparent',
                  borderBottom: 'none',
                  color: 'white',
                  fontSize: '16px'
                }}
                className="custom-menu"
              />
            </Header>
            <Content style={{padding: "0 48px"}}>
              {children}
            </Content>
            <Footer style={{
              textAlign: "center",
              background: "#f0f2f5",
              color: "#2c3e50",
              padding: "12px 0",
              borderTop: "1px solid #e0e0e0",
              fontSize: "14px"
            }}>
              CureTracker 2025 Created by Cofheim
            </Footer>
          </Layout>
        </Providers>
      </body>
    </html>
  );
}
