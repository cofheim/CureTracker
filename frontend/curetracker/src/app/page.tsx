"use client";

import { Typography, Button } from "antd";
import { useEffect, useState } from "react";
import AuthFormSwitcher from "./components/AuthFormSwitcher";
import Link from "next/link";
const { Title, Paragraph } = Typography;

export default function Home() {
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuth(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuth(false);
  };

  if (!isAuth) {
    return <AuthFormSwitcher onAuth={() => setIsAuth(true)} />;
  }

  return (
    <div style={{
      position: 'relative',
      minHeight: 'calc(100vh - 128px)',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center'
    }}>
      <Button
        onClick={handleLogout}
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px'
        }}
      >
        Выйти
      </Button>
      <Title level={1} style={{ marginBottom: '16px' }}>
        Добро пожаловать в CureTracker!
      </Title>
      <Paragraph style={{ marginBottom: '32px', fontSize: '16px', maxWidth: '600px' }}>
        CureTracker поможет вам отслеживать прием лекарств, управлять курсами лечения и не забывать о своем здоровье.
      </Paragraph>
      <Link href="/medicines" passHref>
        <Button type="primary" size="large" style={{ padding: '0 40px', height: '48px', fontSize: '16px' }}>
          Перейти к моим лекарствам
        </Button>
      </Link>
    </div>
  );
}
