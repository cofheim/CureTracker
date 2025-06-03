'use client';

import React, { useState, useMemo } from 'react';
import { Form, Input, Button, Tabs, Card, Row, Col, Typography, App, Select } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, GlobalOutlined } from '@ant-design/icons';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../lib/apiConfig';
import countryList from 'country-list';

// const { TabPane } = Tabs; // TabPane больше не нужен при использовании items prop
const { Title } = Typography;
const { Option } = Select; // Для использования в Select

const AuthPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { message } = App.useApp();

  // Получаем и мемоизируем список стран
  const countries = useMemo(() => countryList.getData(), []);

  const onFinishLogin = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/User/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: values.email, password: values.password }),
        credentials: 'include',
      });

      if (response.ok) {
        message.success('Вход выполнен успешно!');
        router.push('/');
      } else {
        const errorData = await response.json();
        message.error(errorData.message || 'Ошибка входа. Проверьте данные и попробуйте снова.');
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error('Произошла ошибка сети. Пожалуйста, попробуйте позже.');
    }
    setLoading(false);
  };

  const onFinishRegister = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/User/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userName: values.userName, 
          email: values.email, 
          password: values.password,
          countryCode: values.countryCode
        }),
        credentials: 'include',
      });

      if (response.ok) {
        message.success('Регистрация прошла успешно! Теперь вы можете войти.');
      } else {
        const errorData = await response.json();
        if (response.status === 409) {
          message.error(errorData.message || 'Пользователь с таким Email уже существует.');
        } else {
          message.error(errorData.message || 'Ошибка регистрации. Пожалуйста, попробуйте снова.');
        }
      }
    } catch (error) {
      console.error('Register error:', error);
      message.error('Произошла ошибка сети. Пожалуйста, попробуйте позже.');
    }
    setLoading(false);
  };

  const loginForm = (
    <Form
      name="login"
      onFinish={onFinishLogin}
      layout="vertical"
      requiredMark={false}
    >
      <Form.Item
        name="email"
        rules={[{ required: true, message: 'Пожалуйста, введите ваш Email!' }, { type: 'email', message: 'Введите корректный Email!' }]}
      >
        <Input prefix={<MailOutlined />} placeholder="Email" />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: 'Пожалуйста, введите ваш пароль!' }]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="Пароль" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block style={{ background: '#1890ff', borderColor: '#1890ff' }}>
          Войти
        </Button>
      </Form.Item>
    </Form>
  );

  const registerForm = (
    <Form
      name="register"
      onFinish={onFinishRegister}
      layout="vertical"
      requiredMark={false}
    >
      <Form.Item
        name="userName"
        rules={[{ required: true, message: 'Пожалуйста, введите ваше имя пользователя!' }]}
      >
        <Input prefix={<UserOutlined />} placeholder="Имя пользователя" />
      </Form.Item>
      <Form.Item
        name="email"
        rules={[{ required: true, message: 'Пожалуйста, введите ваш Email!' }, { type: 'email', message: 'Введите корректный Email!' }]}
      >
        <Input prefix={<MailOutlined />} placeholder="Email" />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: 'Пожалуйста, введите ваш пароль!' }, { min: 6, message: 'Пароль должен содержать не менее 6 символов' }]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="Пароль" />
      </Form.Item>
      <Form.Item
        name="confirmPassword"
        dependencies={['password']}
        hasFeedback
        rules={[
          { required: true, message: 'Пожалуйста, подтвердите ваш пароль!' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('Пароли не совпадают!'));
            },
          }),
        ]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="Подтвердите пароль" />
      </Form.Item>
      <Form.Item
        name="countryCode"
        rules={[{ required: true, message: 'Пожалуйста, выберите вашу страну!' }]}
      >
        <Select
          showSearch
          placeholder="Выберите страну"
          optionFilterProp="children"
          filterOption={(input, option) =>
            option?.children?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
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
        <Button type="primary" htmlType="submit" loading={loading} block style={{ background: '#1890ff', borderColor: '#1890ff' }}>
          Зарегистрироваться
        </Button>
      </Form.Item>
    </Form>
  );

  const items = [
    {
      key: 'login',
      label: 'Вход',
      children: loginForm,
    },
    {
      key: 'register',
      label: 'Регистрация',
      children: registerForm,
    },
  ];

  return (
    <>
      <Head>
        <title>Вход / Регистрация - CureTracker</title>
      </Head>
      <Row justify="center" align="middle" style={{ minHeight: '100vh', background: '#f0f8ff' }}>
        <Col xs={22} sm={16} md={12} lg={8} xl={6}>
          <Card style={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Title level={2} style={{ color: '#1890ff' }}>CureTracker</Title>
            </div>
            <Tabs defaultActiveKey="login" centered items={items} />
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default AuthPage; 