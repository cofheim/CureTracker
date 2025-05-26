'use client';

import { Layout, Menu } from "antd";
import "./globals.css";
import { Content, Footer, Header } from "antd/es/layout/layout";
import Link from "next/link";
import { Providers } from './providers'
import { usePathname } from 'next/navigation';

const items = [
  {key: "/", "label": <Link href={"/"}>Главная</Link>},
  {key: "/medicines", "label": <Link href={"/medicines"}>Лекарства</Link>}
]

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <html lang="ru">
      <body>
        <Providers>
          <Layout style={{ minHeight: "100vh" }}>
            <Header>
              <Menu 
                theme="dark" 
                mode="horizontal" 
                selectedKeys={[pathname]}
                items={items} 
                style={{ flex: 1, minWidth: 0 }}
              />
            </Header>
            <Content style={{padding: "0 48px"}}>
              {children}
            </Content>
            <Footer style={{textAlign: "center"}}>CureTracker 2025 Created by Cofheim</Footer>
          </Layout>
        </Providers>
      </body>
    </html>
  );
}
