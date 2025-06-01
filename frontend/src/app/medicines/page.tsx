'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Typography, Space, Spin, Popconfirm, App } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import { API_BASE_URL } from '../../lib/apiConfig';

const { Title, Text } = Typography;
const { Option } = Select;

// Интерфейсы для типизации данных
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

  // Загрузка списка лекарств при монтировании компонента
  useEffect(() => {
    fetchMedicines();
  }, []);

  // Функция для загрузки списка лекарств с API
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
        // Если пользователь не авторизован, перенаправляем на страницу входа
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

  // Обработчик отправки формы (создание/редактирование лекарства)
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

  // Обработчик удаления лекарства
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

  // Обработчик открытия модального окна для редактирования
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

  // Обработчик открытия модального окна для создания
  const handleAdd = () => {
    setEditingMedicine(null);
    form.resetFields();
    setModalVisible(true);
  };

  // Определение колонок для таблицы
  const columns = [
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
        <Space size="middle">
          <Button 
            onClick={() => router.push(`/medicines/${record.id}`)}
          >
            Подробнее
          </Button>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            Редактировать
          </Button>
          <Popconfirm
            title="Удалить лекарство?"
            description="Вы уверены, что хотите удалить это лекарство?"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button type="primary" danger icon={<DeleteOutlined />}>
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ background: '#f0f8ff', minHeight: '100vh' }}>
      <Head>
        <title>Лекарства - CureTracker</title>
      </Head>
      
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Title level={2} style={{ color: '#1890ff', margin: 0 }}>Мои лекарства</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAdd}
          >
            Добавить лекарство
          </Button>
        </div>
        
        {loading && !modalVisible ? (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '50px 0' }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            {medicines.length === 0 ? (
              <div style={{ textAlign: 'center', margin: '50px 0' }}>
                <Text>У вас пока нет добавленных лекарств. Нажмите "Добавить лекарство", чтобы начать.</Text>
              </div>
            ) : (
              <Table 
                columns={columns} 
                dataSource={medicines.map(med => ({ ...med, key: med.id }))} 
                pagination={{ pageSize: 10 }}
                bordered
              />
            )}
          </>
        )}
        
        <Modal
          title={editingMedicine ? 'Редактировать лекарство' : 'Добавить лекарство'}
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
              <Input placeholder="Например: Аспирин" />
            </Form.Item>
            
            <Form.Item
              name="description"
              label="Описание"
            >
              <Input.TextArea rows={3} placeholder="Краткое описание лекарства" />
            </Form.Item>
            
            <Form.Item
              name="dosagePerTake"
              label="Дозировка (мг)"
              rules={[{ required: true, message: 'Пожалуйста, укажите дозировку' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} placeholder="Например: 500" />
            </Form.Item>
            
            <Form.Item
              name="storageConditions"
              label="Условия хранения"
            >
              <Input placeholder="Например: Хранить в сухом месте при температуре до 25°C" />
            </Form.Item>
            
            <Form.Item
              name="type"
              label="Тип лекарства"
              rules={[{ required: true, message: 'Пожалуйста, выберите тип лекарства' }]}
            >
              <Select placeholder="Выберите тип лекарства">
                <Option value={MedicineType.Tablet}>Таблетка</Option>
                <Option value={MedicineType.Capsule}>Капсула</Option>
                <Option value={MedicineType.Liquid}>Жидкость</Option>
                <Option value={MedicineType.Injection}>Инъекция</Option>
                <Option value={MedicineType.Powder}>Порошок</Option>
                <Option value={MedicineType.Other}>Другое</Option>
              </Select>
            </Form.Item>
            
            <Form.Item>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <Button onClick={() => setModalVisible(false)}>Отмена</Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {editingMedicine ? 'Сохранить' : 'Добавить'}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default MedicinesPage; 