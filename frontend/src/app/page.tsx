'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spin, Typography, Button, Row, Col, Card, Space, App } from 'antd';
import { LogoutOutlined, MedicineBoxOutlined, ScheduleOutlined } from '@ant-design/icons';
import Head from 'next/head';
import { API_BASE_URL } from '../lib/apiConfig'; // Предполагаем, что apiConfig.ts на один уровень выше

const { Title, Text, Paragraph } = Typography;

// Это временная заглушка для состояния аутентификации
// В реальном приложении это будет управляться через Context, Redux, Zustand или проверкой cookie на сервере/запросом к API
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null - состояние загрузки
  const [userData, setUserData] = useState<any>(null); // Данные пользователя, если есть
  const router = useRouter();

  useEffect(() => {
    // Пытаемся получить информацию о текущем пользователе, чтобы проверить аутентификацию
    // Бэкенд должен иметь эндпоинт, который возвращает данные пользователя, если токен валиден
    // или 401, если нет.
    // Например, GET /User/me или подобный
    const checkAuth = async () => {
      try {
        // Важно: для этого запроса credentials: 'include' необходим, чтобы cookie передавались
        const response = await fetch(`${API_BASE_URL}/User/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // ВАЖНО для отправки cookie
        });

        if (response.ok) {
          const data = await response.json();
          setUserData(data);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          router.push('/auth');
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
        // Можно добавить обработку, если API недоступен
        router.push('/auth'); // В случае ошибки сети тоже редирект на /auth
      }
    };

    checkAuth();
  }, [router]);

  return { isAuthenticated, userData };
};

const HomePage: React.FC = () => {
  const { isAuthenticated, userData } = useAuth();
  const router = useRouter();
  const { message } = App.useApp(); // Используем App.useApp() вместо message.useMessage()

  const handleLogout = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/User/logout`, { 
          method: 'POST', 
          credentials: 'include' 
        });
        
        if (response.ok) {
          message.success('Вы успешно вышли из системы');
        } else {
          console.error("Logout error:", await response.text());
        }
    } catch (error) {
        console.error("Logout error:", error);
    }
    
    // После выхода (успешного или нет), клиент должен быть перенаправлен на страницу входа
    router.push('/auth');
  };

  if (isAuthenticated === null) {
    return (
      <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
        <Spin size="large" />
      </Row>
    );
  }

  if (!isAuthenticated) {
    // Редирект уже должен был произойти в useAuth, но на всякий случай
    return null; 
  }

  return (
    <div style={{ padding: '20px', background: '#f0f8ff', minHeight: '100vh' }}>
      <Head>
        <title>Главная - CureTracker</title>
      </Head>
      <Row justify="space-between" align="middle" style={{ marginBottom: '20px' }}>
        <Title level={2} style={{ color: '#1890ff' }}>Добро пожаловать в CureTracker!</Title>
        <Button type="primary" onClick={handleLogout} danger icon={<LogoutOutlined />}>
          Выйти
        </Button>
      </Row>
      
      {userData && (
        <Card style={{ marginBottom: '20px' }}>
            <Title level={4}>Ваш профиль</Title>
            <Text strong>ID:</Text> <Text>{userData.id}</Text><br/>
            <Text strong>Имя:</Text> <Text>{userData.name}</Text><br/>
            <Text strong>Email:</Text> <Text>{userData.email}</Text><br/>
            {userData.telegramId && <><Text strong>Telegram ID:</Text> <Text>{userData.telegramId}</Text><br/></>}
        </Card>
      )}

      <Title level={3} style={{ marginTop: '30px' }}>Что вы хотите сделать?</Title>
      
      <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
        <Col xs={24} sm={12} md={8}>
          <Card 
            hoverable 
            style={{ height: '100%' }}
            onClick={() => router.push('/medicines')}
          >
            <div style={{ textAlign: 'center' }}>
              <MedicineBoxOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
              <Title level={4}>Управление лекарствами</Title>
              <Paragraph>
                Добавляйте, редактируйте и удаляйте лекарства в вашей базе данных.
              </Paragraph>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <Card 
            hoverable 
            style={{ height: '100%' }}
            onClick={() => router.push('/courses')}
          >
            <div style={{ textAlign: 'center' }}>
              <ScheduleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
              <Title level={4}>Курсы лечения</Title>
              <Paragraph>
                Создавайте и управляйте курсами приема лекарств, отслеживайте прогресс.
              </Paragraph>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HomePage;
