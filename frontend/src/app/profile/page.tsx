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

const { Title, Text } = Typography;

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [editing, setEditing] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [form] = Form.useForm();
  const router = useRouter();
  const { message } = App.useApp();
  const { theme } = useTheme();

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

  // Эффект для инициализации формы при получении данных профиля
  useEffect(() => {
    if (profile) {
      form.setFieldsValue({
        name: profile.name,
        email: profile.email,
      });
    }
  }, [profile, form]);

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
      } else if (response.status === 401) {
        router.push('/auth');
      } else {
        message.error('Не удалось загрузить данные профиля');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      message.error('Произошла ошибка при загрузке профиля');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (values: any) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/User/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        message.success('Профиль успешно обновлен');
        setEditing(false);
        fetchUserProfile();
      } else if (response.status === 409) {
        message.error('Этот email уже используется другим пользователем');
      } else {
        const errorData = await response.json();
        message.error(errorData.message || 'Не удалось обновить профиль');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Произошла ошибка при обновлении профиля');
    } finally {
      setLoading(false);
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
                onFinish={handleUpdateProfile}
                size={isMobile ? 'small' : 'middle'}
                initialValues={{
                  name: profile?.name,
                  email: profile?.email
                }}
              >
                <Form.Item
                  name="name"
                  label="Имя пользователя"
                  rules={[{ required: true, message: 'Пожалуйста, введите имя пользователя' }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Имя пользователя" />
                </Form.Item>

                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Пожалуйста, введите email' },
                    { type: 'email', message: 'Пожалуйста, введите корректный email' }
                  ]}
                >
                  <Input prefix={<MailOutlined />} placeholder="Email" />
                </Form.Item>

                <Form.Item>
                  <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: '100%' }}>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      icon={<SaveOutlined />}
                      loading={loading}
                      block={isMobile}
                    >
                      Сохранить
                    </Button>
                    <Button onClick={() => setEditing(false)} block={isMobile}>Отмена</Button>
                  </Space>
                </Form.Item>
              </Form>
            ) : (
              <div>
                <p><strong>Имя пользователя:</strong> {profile?.name}</p>
                <p style={{ wordBreak: 'break-all' }}><strong>Email:</strong> {profile?.email}</p>
              </div>
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
        </Col>
      </Row>
    </div>
  );
};

export default ProfilePage; 