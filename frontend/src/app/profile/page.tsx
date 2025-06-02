'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  Typography, 
  Button, 
  Spin, 
  Row, 
  Col, 
  Avatar, 
  Divider,
  App,
  Form,
  Input,
  Space
} from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  LogoutOutlined,
  EditOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { API_BASE_URL } from '../../lib/apiConfig';
import { useTheme } from '../../lib/ThemeContext';
import axios from 'axios';
import { useAuth } from '@/lib/contexts/AuthContext';

const { Title, Text } = Typography;

interface UserProfile {
  id: string;
  name: string;
  email: string;
  timeZoneId?: string;
}

const ProfilePage: React.FC = () => {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [form] = Form.useForm();
  const router = useRouter();
  const { message } = App.useApp();
  const { theme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectionCode, setConnectionCode] = useState<string | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth?redirect=/profile');
    }
  }, [user, loading, router]);

  useEffect(() => {
    fetchUserProfile();
    
    // Определение мобильного устройства
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
    if (user) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        timeZoneId: user.timeZoneId || Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    }
  }, [user, form]);

  const fetchUserProfile = async () => {
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
        setProfile(data);
        form.setFieldsValue({
          name: data.name,
          email: data.email,
          timeZoneId: data.timeZoneId || Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      } else if (response.status === 401) {
        router.push('/auth');
      } else {
        message.error('Не удалось загрузить данные профиля');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      message.error('Произошла ошибка при загрузке профиля');
    }
  };

  const onFinish = async (values: any) => {
    setIsSubmitting(true);
    try {
      await axios.put(`${API_BASE_URL}/User/update-profile`, {
        name: values.name,
        email: values.email,
        timeZoneId: values.timeZoneId,
      }, { withCredentials: true });
      message.success('Профиль успешно обновлен');
      setProfile(prevProfile => prevProfile ? { ...prevProfile, ...values } : null);
      setEditing(false);
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
        message.error(`Ошибка при обновлении профиля: ${error.response.data.message}`);
      } else {
        message.error('Ошибка при обновлении профиля');
      }
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateCode = async () => {
    console.log('[ProfilePage] Attempting to generate code. Current user state:', user);
    if (!user || !user.id) {
      message.error('Информация о пользователе еще не загружена. Пожалуйста, подождите.');
      console.warn('[ProfilePage] User or user.id is missing.', user);
      return;
    }
    setIsGeneratingCode(true);
    try {
      console.log(`[ProfilePage] Sending request to: ${API_BASE_URL}/User/generate-connection-code`);
      const response = await axios.post(`${API_BASE_URL}/User/generate-connection-code`, {}, { withCredentials: true });
      setConnectionCode(response.data);
      message.success('Код для подключения Telegram сгенерирован');
    } catch (error: any) {
      console.error('[ProfilePage] Error generating code:', error);
      if (error.response) {
        console.error('[ProfilePage] Error response data:', error.response.data);
        console.error('[ProfilePage] Error response status:', error.response.status);
        console.error('[ProfilePage] Error response headers:', error.response.headers);
        if (error.response.status === 401) {
          message.error('Ошибка авторизации. Пожалуйста, войдите в систему снова.');
        } else {
          message.error(`Ошибка при генерации кода: ${error.response.data?.message || error.message}`);
        }
      } else if (error.request) {
        console.error('[ProfilePage] Error request:', error.request);
        message.error('Ошибка сети или сервер недоступен.');
      } else {
        message.error('Произошла неизвестная ошибка.');
      }
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/User/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        message.success('Вы успешно вышли из системы');
        router.push('/auth');
      } else {
        message.error('Не удалось выйти из системы');
      }
    } catch (error) {
      console.error('Error logging out:', error);
      message.error('Произошла ошибка при выходе из системы');
    }
  };

  const getInitials = () => {
    if (!profile) return 'U';
    const name = profile.name || '';
    const initials = name.split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
    return initials || 'U';
  };

  if (loading && !profile) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  // Определяем цвет фона в зависимости от темы
  const backgroundColor = theme === 'dark' ? 'var(--secondary-color)' : '#f0f8ff';

  return (
    <div style={{ background: backgroundColor, minHeight: '100vh', padding: isMobile ? '10px' : '20px' }}>
      <Title level={isMobile ? 3 : 2} style={{ marginBottom: '24px' }}>Профиль пользователя</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar 
                size={isMobile ? 80 : 100} 
                style={{ 
                  backgroundColor: 'var(--primary-color)',
                  fontSize: isMobile ? '28px' : '36px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}
              >
                {getInitials()}
              </Avatar>
              <Title level={isMobile ? 4 : 3}>{profile?.name}</Title>
              <Text type="secondary" style={{ fontSize: isMobile ? '12px' : '14px', wordBreak: 'break-all' }}>{profile?.email}</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Личная информация</span>
                {!editing && (
                  <Button 
                    type="text" 
                    icon={<EditOutlined />} 
                    onClick={() => setEditing(true)}
                    size={isMobile ? 'small' : 'middle'}
                  >
                    {!isMobile && 'Редактировать'}
                  </Button>
                )}
              </div>
            }
          >
            {editing ? (
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                size={isMobile ? 'small' : 'middle'}
                initialValues={{
                  name: profile?.name,
                  email: profile?.email,
                  timeZoneId: profile?.timeZoneId || Intl.DateTimeFormat().resolvedOptions().timeZone,
                }}
              >
                <Form.Item
                  label="Имя"
                  name="name"
                  rules={[{ required: true, message: 'Пожалуйста, введите ваше имя!' }]}
                >
                  <Input prefix={<UserOutlined />} />
                </Form.Item>
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[{ required: true, message: 'Пожалуйста, введите ваш Email!' }, { type: 'email', message: 'Введите корректный Email!' }]}
                >
                  <Input prefix={<MailOutlined />} />
                </Form.Item>
                <Form.Item
                  label="Часовой пояс (IANA)"
                  name="timeZoneId"
                  tooltip="Например, Europe/Moscow или America/New_York. Ваш текущий: Intl.DateTimeFormat().resolvedOptions().timeZone"
                >
                  <Input placeholder="Например, Europe/Moscow" />
                </Form.Item>
                <Form.Item>
                  <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: '100%' }}>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      icon={<SaveOutlined />}
                      loading={isSubmitting}
                      block={isMobile}
                    >
                      Сохранить
                    </Button>
                    <Button onClick={() => setEditing(false)} block={isMobile}>Отмена</Button>
                  </Space>
                </Form.Item>
              </Form>
            ) : (
              <>
                <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
                  <Col span={isMobile ? 24 : 8}><Text strong>Имя:</Text></Col>
                  <Col span={isMobile ? 24 : 16}><Text>{profile?.name}</Text></Col>
                </Row>
                <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
                  <Col span={isMobile ? 24 : 8}><Text strong>Email:</Text></Col>
                  <Col span={isMobile ? 24 : 16}><Text>{profile?.email}</Text></Col>
                </Row>
                <Row gutter={[16, 16]}>
                  <Col span={isMobile ? 24 : 8}><Text strong>Часовой пояс:</Text></Col>
                  <Col span={isMobile ? 24 : 16}><Text>{profile?.timeZoneId || 'Не указан'}</Text></Col>
                </Row>
              </>
            )}
          </Card>

          <Card style={{ marginTop: '16px' }}>
            <Divider orientation="left">Действия с аккаунтом</Divider>
            <Button 
              danger 
              type="primary" 
              icon={<LogoutOutlined />} 
              onClick={handleLogout}
              size={isMobile ? 'middle' : 'large'}
              block={isMobile}
            >
              Выйти из аккаунта
            </Button>
          </Card>

          <Card style={{ marginTop: 16 }} title="Подключение к Telegram">
            <Text>Подключите ваш аккаунт к Telegram, чтобы получать напоминания о приеме лекарств.</Text>
            <Button 
              onClick={handleGenerateCode} 
              loading={isGeneratingCode} 
              disabled={!user || !user.id || isGeneratingCode}
              style={{ marginTop: 16, marginRight: 16 }}
            >
              Сгенерировать код подключения
            </Button>
            {connectionCode && (
              <div style={{ marginTop: 16 }}>
                <Text strong>Ваш код подключения:</Text>
                <Text code style={{ fontSize: 18, padding: 8, background: '#f5f5f5' }}>{connectionCode}</Text>
                <Text style={{ display: 'block', marginTop: 8 }}>
                  Отправьте этот код нашему боту в Telegram, чтобы связать аккаунт.
                </Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProfilePage; 