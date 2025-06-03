'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Typography, Space, Spin, Popconfirm, App } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import { API_BASE_URL } from '../../lib/apiConfig';
import { useTheme } from '../../lib/ThemeContext';
import ThemeWrapper from '../components/ThemeWrapper';

const { Title, Text } = Typography;
const { Option } = Select;

interface Medicine {
  id: string;
  name: string;
  description: string;
  dosagePerTake: number;
  storageConditions: string;
  type: MedicineType;
}

enum MedicineType {
  Capsule = 'Capsule',
  Tablet = 'Tablet',
  Liquid = 'Liquid',
  Injection = 'Injection',
  Powder = 'Powder',
  Other = 'Other'
}

const MedicinesPage: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [form] = Form.useForm();
  const router = useRouter();
  const { message, modal } = App.useApp();
  const { theme } = useTheme();
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIfMobile();
    
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/Medicine`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setMedicines(data);
      } else if (response.status === 401) {
        // Если пользовательне авторизован, перенаправляем на страницу входа
        router.push('/auth');
      } else {
        message.error('Не удалось загрузить список лекарств');
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
      message.error('Произошла ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const url = editingMedicine 
        ? `${API_BASE_URL}/Medicine/${editingMedicine.id}` 
        : `${API_BASE_URL}/Medicine`;
      
      const method = editingMedicine ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
        credentials: 'include',
      });

      if (response.ok) {
        message.success(
          editingMedicine 
            ? 'Лекарство успешно обновлено' 
            : 'Лекарство успешно добавлено'
        );
        setModalVisible(false);
        form.resetFields();
        fetchMedicines();
      } else {
        const errorData = await response.json();
        message.error(errorData.message || 'Не удалось сохранить лекарство');
      }
    } catch (error) {
      console.error('Error saving medicine:', error);
      message.error('Произошла ошибка при сохранении данных');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/Medicine/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        message.success('Лекарство успешно удалено');
        fetchMedicines();
      } else {
        const errorData = await response.json();
        message.error(errorData.message || 'Не удалось удалить лекарство');
      }
    } catch (error) {
      console.error('Error deleting medicine:', error);
      message.error('Произошла ошибка при удалении данных');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    form.setFieldsValue({
      name: medicine.name,
      description: medicine.description,
      dosagePerTake: medicine.dosagePerTake,
      storageConditions: medicine.storageConditions,
      type: medicine.type,
    });
    setModalVisible(true);
  };

  const handleAdd = () => {
    setEditingMedicine(null);
    form.resetFields();
    setModalVisible(true);
  };

  const columns: ColumnsType<Medicine> = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Medicine) => (
        <a onClick={() => router.push(`/medicines/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      className: isMobile ? 'hidden-column' : '',
    },
    {
      title: 'Дозировка',
      dataIndex: 'dosagePerTake',
      key: 'dosagePerTake',
      render: (text: number) => `${text} мг`,
    },
    {
      title: 'Условия хранения',
      dataIndex: 'storageConditions',
      key: 'storageConditions',
      className: isMobile ? 'hidden-column' : '',
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (type: MedicineType) => {
        const typeLabels = {
          [MedicineType.Capsule]: 'Капсула',
          [MedicineType.Tablet]: 'Таблетка',
          [MedicineType.Liquid]: 'Жидкость',
          [MedicineType.Injection]: 'Инъекция',
          [MedicineType.Powder]: 'Порошок',
          [MedicineType.Other]: 'Другое',
        };
        return typeLabels[type] || type;
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: Medicine) => (
        <Space size="small" wrap>
          <Button 
            size={isMobile ? "small" : "middle"}
            onClick={() => router.push(`/medicines/${record.id}`)}
          >
            Подробнее
          </Button>
          <Button 
            type="primary" 
            size={isMobile ? "small" : "middle"}
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            {!isMobile && "Редактировать"}
          </Button>
          <Popconfirm
            title="Удалить лекарство?"
            description="Вы уверены, что хотите удалить это лекарство?"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button type="primary" danger size={isMobile ? "small" : "middle"} icon={<DeleteOutlined />}>
              {!isMobile && "Удалить"}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const backgroundColor = theme === 'dark' ? 'var(--secondary-color)' : '#f0f8ff';

  return (
    <div style={{ background: backgroundColor, minHeight: '100vh' }}>
      <Head>
        <title>Лекарства - CureTracker</title>
      </Head>
      
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Title level={2} style={{ color: 'var(--primary-color)', margin: 0 }}>Мои лекарства</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAdd}
          >
            Добавить лекарство
          </Button>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            <style jsx global>{`
              .hidden-column {
                display: none;
              }
            `}</style>
            <Table 
              columns={columns} 
              dataSource={medicines} 
              rowKey="id" 
              pagination={{ pageSize: 10 }}
              scroll={{ x: 'max-content' }}
            />
          </>
        )}
      </div>

      <Modal
        title={editingMedicine ? 'Редактировать лекарство' : 'Добавить новое лекарство'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Название"
            rules={[{ required: true, message: 'Пожалуйста, введите название лекарства' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Описание"
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          
          <Form.Item
            name="dosagePerTake"
            label="Дозировка (мг)"
            rules={[{ required: true, message: 'Пожалуйста, укажите дозировку' }]}
          >
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="storageConditions"
            label="Условия хранения"
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="type"
            label="Тип"
            rules={[{ required: true, message: 'Пожалуйста, выберите тип лекарства' }]}
          >
            <Select>
              <Option value={MedicineType.Capsule}>Капсула</Option>
              <Option value={MedicineType.Tablet}>Таблетка</Option>
              <Option value={MedicineType.Liquid}>Жидкость</Option>
              <Option value={MedicineType.Injection}>Инъекция</Option>
              <Option value={MedicineType.Powder}>Порошок</Option>
              <Option value={MedicineType.Other}>Другое</Option>
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingMedicine ? 'Сохранить' : 'Добавить'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>Отмена</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default function MedicinesPageWithTheme() {
  return (
    <ThemeWrapper>
      <MedicinesPage />
    </ThemeWrapper>
  );
} 