'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Space,
  Select, // Добавлено
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  LogoutOutlined,
  EditOutlined,
  SaveOutlined,
  GlobalOutlined, // Добавлено
  CopyOutlined // Для кнопки копирования
} from '@ant-design/icons';
import { API_BASE_URL } from '../../lib/apiConfig';
import { useTheme } from '../../lib/ThemeContext';
import axios from 'axios';
import { useAuth } from '@/lib/contexts/AuthContext';
import countryList from 'country-list'; // Добавлено
import Head from 'next/head'; // Для заголовка страницы

const { Title, Text } = Typography;
const { Option } = Select; // Добавлено

interface UserProfile {
  id: string;
  name: string;
  email: string;
  timeZoneId?: string;
  countryCode?: string; // Добавлено
  connectionCode?: string; // Добавлено для отображения сгенерированного кода
}

const ProfilePage: React.FC = () => {
  const { user, loading: authLoading, refetchUser } = useAuth(); // Добавлено refetchUser
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [form] = Form.useForm();
  const router = useRouter();
  const { message } = App.useApp();
  const { theme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [pageLoading, setPageLoading] = useState<boolean>(true); // Состояние для общей загрузки страницы

  const countries = useMemo(() => countryList.getData(), []); // Инициализация списка стран

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth?redirect=/profile');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setPageLoading(true);
      if (user) { // Убедимся, что user загружен из AuthContext
        await fetchUserProfile();
      }
      setPageLoading(false);
    };
    fetchInitialData();

    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, [user]); // Добавляем user в зависимости

  useEffect(() => {
    if (profile) { // Используем profile вместо user для установки значений формы
      form.setFieldsValue({
        name: profile.name,
        email: profile.email,
        countryCode: profile.countryCode,
      });
    }
  }, [profile, form, editing]); // Добавляем editing в зависимости, чтобы форма сбрасывалась корректно

  const fetchUserProfile = async () => {
    if (!user?.id) return; // Не выполняем запрос, если нет user.id
    try {
      const response = await axios.get<UserProfile>(`${API_BASE_URL}/User/me`, {
        withCredentials: true,
      });
      setProfile(response.data);
      form.setFieldsValue({
        name: response.data.name,
        email: response.data.email,
        countryCode: response.data.countryCode,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push('/auth');
      } else {
        message.error('Не удалось загрузить данные профиля');
      }
    }
  };

  const onFinish = async (values: any) => {
    setIsSubmitting(true);
    try {
      await axios.put(`${API_BASE_URL}/User/update-profile`, {
        name: values.name,
        email: values.email,
        countryCode: values.countryCode, // Передаем countryCode
      }, { withCredentials: true });
      message.success('Профиль успешно обновлен');
      // Обновляем локальное состояние профиля и данные в AuthContext
      const updatedProfile = { 
        ...(profile || {}), // Берем текущий профиль или пустой объект
        id: user!.id, // user.id должен быть здесь
        name: values.name, 
        email: values.email, 
        countryCode: values.countryCode 
      };
      setProfile(updatedProfile as UserProfile); // Приводим к UserProfile
      if (refetchUser) refetchUser(); // Обновляем данные пользователя в AuthContext
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
    if (!user || !user.id) {
      message.error('Информация о пользователе еще не загружена. Пожалуйста, подождите.');
      return;
    }
    setIsGeneratingCode(true);
    try {
      const response = await axios.post<string>(`${API_BASE_URL}/User/generate-connection-code`, {}, { withCredentials: true });
      setProfile(prev => prev ? { ...prev, connectionCode: response.data } : null); // Обновляем connectionCode в локальном стейте
      message.success('Код для подключения Telegram сгенерирован');
    } catch (error: any) {
      console.error('Error generating code:', error);
      if (error.response) {
        if (error.response.status === 401) {
          message.error('Ошибка авторизации. Пожалуйста, войдите в систему снова.');
        } else {
          message.error(`Ошибка при генерации кода: ${error.response.data?.message || error.response.data || error.message}`);
        }
      } else {
        message.error('Ошибка сети или сервер недоступен при генерации кода.');
      }
    } finally {
      setIsGeneratingCode(false);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('Код скопирован!');
    }, (err) => {
      message.error('Не удалось скопировать код.');
      console.error('Could not copy text: ', err);
    });
  };

  const handleLogout = async () => {
    // ... (код без изменений)
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
    if (!profile?.name && !user?.name) return 'U';
    const nameToUse = profile?.name || user?.name || '';
    const initials = nameToUse.split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
    return initials || 'U';
  };

  if (pageLoading || authLoading) {
    return (
      <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
        <Spin size="large" />
      </Row>
    );
  }

  if (!user && !authLoading) { // Если пользователь не авторизован и загрузка завершена
    return null; // Или показать сообщение/редирект, если router.push не успел сработать
  }
  
  const cardBackgroundColor = theme === 'dark' ? '#1e1e1e' : '#ffffff';
  const textColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)';


  return (
    <>
      <Head>
        <title>Профиль - CureTracker</title>
      </Head>
      <div style={{ padding: isMobile ? '16px' : '24px', background: theme === 'dark' ? '#141414' : '#f0f2f5', minHeight: '100vh' }}>
        <Row gutter={[16, 16]} justify="center">
          <Col xs={24} sm={24} md={10} lg={8} xl={7}>
            <Card 
              style={{ marginBottom: '20px', background: cardBackgroundColor, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              actions={editing ? [] : [
                <Button icon={<EditOutlined />} key="edit" onClick={() => setEditing(true)} style={{color: textColor}}>
                  Редактировать
                </Button>,
              ]}
            >
              <Row justify="center" style={{ marginBottom: 20 }}>
                <Avatar size={100} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }}>
                  {getInitials()}
                </Avatar>
              </Row>
              <div style={{ textAlign: 'center' }}>
                <Title level={3} style={{color: textColor}}>{profile?.name || user?.name}</Title>
                <Text type="secondary" style={{color: textColor ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.45)'}}>{profile?.email || user?.email}</Text>
              </div>
              <Divider />
              {editing ? (
                <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ 
                  name: profile?.name, 
                  email: profile?.email, 
                  countryCode: profile?.countryCode 
                }}>
                  <Form.Item name="name" label={<Text style={{color: textColor}}>Имя</Text>} rules={[{ required: true, message: 'Пожалуйста, введите ваше имя!' }]}>
                    <Input prefix={<UserOutlined />} />
                  </Form.Item>
                  <Form.Item name="email" label={<Text style={{color: textColor}}>Email</Text>} rules={[{ required: true, message: 'Пожалуйста, введите ваш Email!' }, { type: 'email', message: 'Введите корректный Email!' }]}>
                    <Input prefix={<MailOutlined />} />
                  </Form.Item>
                  <Form.Item name="countryCode" label={<Text style={{color: textColor}}>Страна</Text>} rules={[{ required: true, message: 'Пожалуйста, выберите вашу страну!' }]}>
                    <Select
                      showSearch
                      placeholder="Выберите страну"
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        (option?.children?.toString() ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {countries.map(country => (
                        <Option key={country.code} value={country.code}>
                          {country.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item>
                    <Space>
                      <Button type="primary" htmlType="submit" loading={isSubmitting} icon={<SaveOutlined />}>
                        Сохранить
                      </Button>
                      <Button onClick={() => {
                        setEditing(false); 
                        form.resetFields(); // Сброс изменений при отмене
                        if (profile) { // Восстановление исходных значений
                           form.setFieldsValue({
                            name: profile.name,
                            email: profile.email,
                            countryCode: profile.countryCode,
                          });
                        }
                      }}>
                        Отмена
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              ) : (
                <>
                  <Row gutter={[16,16]} style={{ marginBottom: '10px' }}>
                    <Col span={8}><Text strong style={{color: textColor}}>Имя:</Text></Col>
                    <Col span={16}><Text style={{color: textColor}}>{profile?.name || user?.name}</Text></Col>
                  </Row>
                  <Row gutter={[16,16]} style={{ marginBottom: '10px' }}>
                    <Col span={8}><Text strong style={{color: textColor}}>Email:</Text></Col>
                    <Col span={16}><Text style={{color: textColor}}>{profile?.email || user?.email}</Text></Col>
                  </Row>
                  <Row gutter={[16,16]} style={{ marginBottom: '20px' }}>
                    <Col span={8}><Text strong style={{color: textColor}}>Страна:</Text></Col>
                    <Col span={16}><Text style={{color: textColor}}>{profile?.countryCode ? countries.find(c => c.code === profile.countryCode)?.name : 'Не указана'}</Text></Col>
                  </Row>
                  <Row gutter={[16,16]} style={{ marginBottom: '20px' }}>
                    <Col span={8}><Text strong style={{color: textColor}}>Часовой пояс:</Text></Col>
                    <Col span={16}><Text style={{color: textColor}}>{profile?.timeZoneId || 'Определяется по стране'}</Text></Col>
                  </Row>
                </>
              )}
            </Card>
          </Col>

          <Col xs={24} sm={24} md={10} lg={8} xl={7}>
            <Card title={<Title level={4} style={{color: textColor}}>Подключение Telegram</Title>} style={{ background: cardBackgroundColor, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              {profile?.connectionCode ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text style={{color: textColor}}>Ваш код для подключения Telegram:</Text>
                  <Row gutter={8} align="middle">
                    <Col flex="auto">
                      <Input value={profile.connectionCode} readOnly suffix={
                        <Button 
                          icon={<CopyOutlined />} 
                          type="text" 
                          onClick={() => copyToClipboard(profile.connectionCode!)}
                        />
                      } />
                    </Col>
                  </Row>
                  <Button 
                    type="default" 
                    onClick={handleGenerateCode} 
                    loading={isGeneratingCode}
                    block
                  >
                    Сгенерировать новый код
                  </Button>
                </Space>
              ) : (
                <Button 
                  type="primary" 
                  onClick={handleGenerateCode} 
                  loading={isGeneratingCode} 
                  icon={<GlobalOutlined />}
                  block
                >
                  Получить код для подключения
                </Button>
              )}
              <Text type="secondary" style={{ marginTop: '10px', display: 'block', color: textColor ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.45)' }}>
                Используйте этот код в Telegram-боте для связи вашего аккаунта.
              </Text>
            </Card>

            <Button 
              type="dashed" 
              danger 
              onClick={handleLogout} 
              icon={<LogoutOutlined />} 
              style={{ marginTop: '20px', width: '100%' }}
            >
              Выйти из аккаунта
            </Button>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default ProfilePage;