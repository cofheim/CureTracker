'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spin, Typography, Button, Row, Col, Card, Space, App, Divider, Modal } from 'antd';
import { LogoutOutlined, MedicineBoxOutlined, ScheduleOutlined, HistoryOutlined } from '@ant-design/icons';
import Head from 'next/head';
import { API_BASE_URL } from '../lib/apiConfig';
import Dashboard from './components/Dashboard';
import { useTheme } from '../lib/ThemeContext';

const { Title, Text, Paragraph } = Typography;

const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null - состояние загрузки
  const [userData, setUserData] = useState<any>(null); // Данные пользователя, если есть
  const router = useRouter();

  useEffect(() => {

    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/User/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', 
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
        router.push('/auth'); 
      }
    };

    checkAuth();
  }, [router]);

  return { isAuthenticated, userData };
};

const HomePage: React.FC = () => {
  const { isAuthenticated, userData } = useAuth();
  const router = useRouter();
  const { message, modal } = App.useApp(); 
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const { theme } = useTheme();
  const [specialMessageVisible, setSpecialMessageVisible] = useState<boolean>(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  useEffect(() => {
    if (userData && userData.email === 'christina.brysina@yandex.ru') {
      setSpecialMessageVisible(true);
    }
  }, [userData]);

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
    return null; 
  }

  const backgroundColor = theme === 'dark' ? 'var(--secondary-color)' : '#f0f8ff';

  return (
    <div style={{ background: backgroundColor, minHeight: '100vh' }}>
      <Head>
        <title>Главная - CureTracker</title>
      </Head>
      
      <div style={{ padding: isMobile ? '10px' : '20px' }}>
        <Title level={isMobile ? 3 : 2} style={{ color: 'var(--primary-color)', marginTop: isMobile ? '10px' : '20px', wordBreak: 'break-word' }}>
          Добро пожаловать в CureTracker, {userData?.name}!
        </Title>
        
        
        <Dashboard />
        
        <Divider />
  
        <Title level={isMobile ? 4 : 3} style={{ marginTop: isMobile ? '20px' : '30px' }}>Что вы хотите сделать?</Title>
        
        <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} style={{ marginTop: isMobile ? '10px' : '20px' }}>
          <Col xs={24} sm={12} md={8}>
            <Card 
              hoverable 
              style={{ height: '100%' }}
              onClick={() => router.push('/medicines')}
              size={isMobile ? 'small' : 'default'}
            >
              <div style={{ textAlign: 'center' }}>
                <MedicineBoxOutlined style={{ fontSize: isMobile ? '36px' : '48px', color: 'var(--primary-color)', marginBottom: isMobile ? '8px' : '16px' }} />
                <Title level={isMobile ? 5 : 4}>Управление лекарствами</Title>
                <Paragraph style={{ fontSize: isMobile ? '12px' : '14px' }}>
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
              size={isMobile ? 'small' : 'default'}
            >
              <div style={{ textAlign: 'center' }}>
                <ScheduleOutlined style={{ fontSize: isMobile ? '36px' : '48px', color: 'var(--success-color)', marginBottom: isMobile ? '8px' : '16px' }} />
                <Title level={isMobile ? 5 : 4}>Курсы лечения</Title>
                <Paragraph style={{ fontSize: isMobile ? '12px' : '14px' }}>
                  Создавайте и управляйте курсами приема лекарств, отслеживайте прогресс.
                </Paragraph>
              </div>
            </Card>
          </Col>
  
          <Col xs={24} sm={12} md={8}>
            <Card 
              hoverable 
              style={{ height: '100%' }}
              onClick={() => router.push('/activity')}
              size={isMobile ? 'small' : 'default'}
            >
              <div style={{ textAlign: 'center' }}>
                <HistoryOutlined style={{ fontSize: isMobile ? '36px' : '48px', color: theme === 'dark' ? '#b37feb' : '#722ed1', marginBottom: isMobile ? '8px' : '16px' }} />
                <Title level={isMobile ? 5 : 4}>История действий</Title>
                <Paragraph style={{ fontSize: isMobile ? '12px' : '14px' }}>
                  Просматривайте историю всех действий с лекарствами, курсами и приемами.
                </Paragraph>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      <Modal
        title="Персональное сообщение"
        open={specialMessageVisible}
        onOk={() => setSpecialMessageVisible(false)}
        onCancel={() => setSpecialMessageVisible(false)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setSpecialMessageVisible(false)}>
            Ок
          </Button>
        ]}
      >
        <div style={{ padding: '10px 0' }}>
          <p>Дорогая Кристиночка! <br /> Это приложение создано специально для тебя, 
          чтобы ты могла легко и удобно следить за своим здоровьем, которое мне очень дорого! <br /> <br />Я тебя очень люблю! </p>
        </div>
      </Modal>
    </div>
  );
};

export default HomePage;
