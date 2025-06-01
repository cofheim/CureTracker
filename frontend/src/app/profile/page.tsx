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
  const [form] = Form.useForm();
  const router = useRouter();
  const { message } = App.useApp();

  useEffect(() => {
    fetchUserProfile();
  }, []);

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
        });
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

  return (
    <div style={{ background: '#f0f8ff', minHeight: '100vh', padding: '20px' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>Профиль пользователя</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar 
                size={100} 
                style={{ 
                  backgroundColor: '#1890ff',
                  fontSize: '36px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}
              >
                {getInitials()}
              </Avatar>
              <Title level={3}>{profile?.name}</Title>
              <Text type="secondary">{profile?.email}</Text>
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
                  >
                    Редактировать
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
                  <Space>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      icon={<SaveOutlined />}
                      loading={loading}
                    >
                      Сохранить
                    </Button>
                    <Button onClick={() => setEditing(false)}>Отмена</Button>
                  </Space>
                </Form.Item>
              </Form>
            ) : (
              <div>
                <p><strong>Имя пользователя:</strong> {profile?.name}</p>
                <p><strong>Email:</strong> {profile?.email}</p>
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
              size="large"
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