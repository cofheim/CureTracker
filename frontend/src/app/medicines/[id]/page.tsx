'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Typography, Button, Descriptions, Spin, App, Space, Divider } from 'antd';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { API_BASE_URL } from '../../../lib/apiConfig';
import EntityActivityLog from '../../components/EntityActivityLog';
import { useTheme } from '../../../lib/ThemeContext';
import ThemeWrapper from '../../components/ThemeWrapper';

const { Title, Text } = Typography;

interface Medicine {
  id: string;
  name: string;
  description: string;
  dosagePerTake: number;
  storageConditions: string;
  type: string;
}

enum MedicineType {
  Capsule = 'Capsule',
  Tablet = 'Tablet',
  Liquid = 'Liquid',
  Injection = 'Injection',
  Powder = 'Powder',
  Other = 'Other'
}

const MedicineDetailsPage: React.FC = () => {
  const params = useParams();
  const medicineId = params.id as string;
  const router = useRouter();
  const { message, modal } = App.useApp();
  const { theme } = useTheme();
  
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchMedicineDetails();
  }, [medicineId]);

  const fetchMedicineDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/Medicine/${medicineId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setMedicine(data);
      } else if (response.status === 401) {
        router.push('/auth');
      } else if (response.status === 404) {
        message.error('Лекарство не найдено');
        router.push('/medicines');
      } else {
        message.error('Не удалось загрузить информацию о лекарстве');
      }
    } catch (error) {
      console.error('Error fetching medicine details:', error);
      message.error('Произошла ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    message.info('Функция редактирования будет доступна в ближайшее время');
  };

  const handleDelete = () => {
    modal.confirm({
      title: 'Удалить лекарство?',
      content: 'Вы уверены, что хотите удалить это лекарство? Это действие нельзя отменить.',
      okText: 'Да, удалить',
      cancelText: 'Отмена',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/Medicine/${medicineId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          if (response.ok) {
            message.success('Лекарство успешно удалено');
            router.push('/medicines');
          } else {
            const errorData = await response.json();
            message.error(errorData.message || 'Не удалось удалить лекарство');
          }
        } catch (error) {
          console.error('Error deleting medicine:', error);
          message.error('Произошла ошибка при удалении лекарства');
        }
      },
    });
  };

  const getMedicineTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      [MedicineType.Capsule]: 'Капсула',
      [MedicineType.Tablet]: 'Таблетка',
      [MedicineType.Liquid]: 'Жидкость',
      [MedicineType.Injection]: 'Инъекция',
      [MedicineType.Powder]: 'Порошок',
      [MedicineType.Other]: 'Другое',
    };
    return typeLabels[type] || type;
  };

  const backgroundColor = theme === 'dark' ? 'var(--secondary-color)' : '#f0f8ff';

  return (
    <div style={{ background: backgroundColor, minHeight: '100vh' }}>
      <div style={{ padding: '20px' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => router.push('/medicines')} 
          style={{ marginBottom: '20px' }}
        >
          Вернуться к списку лекарств
        </Button>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            {medicine ? (
              <>
                <Card>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <Title level={2} style={{ color: 'var(--primary-color)' }}>{medicine.name}</Title>
                    <Space>
                      <Button 
                        type="primary" 
                        icon={<EditOutlined />} 
                        onClick={handleEdit}
                      >
                        Редактировать
                      </Button>
                      <Button 
                        type="primary" 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={handleDelete}
                      >
                        Удалить
                      </Button>
                    </Space>
                  </div>
                  
                  <Descriptions bordered column={1}>
                    <Descriptions.Item label="Описание">
                      {medicine.description || 'Нет описания'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Дозировка">
                      {medicine.dosagePerTake} мг
                    </Descriptions.Item>
                    <Descriptions.Item label="Условия хранения">
                      {medicine.storageConditions || 'Не указано'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Тип">
                      {getMedicineTypeLabel(medicine.type)}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
                
                <EntityActivityLog 
                  entityType="medicine" 
                  entityId={medicineId} 
                  title="История действий с лекарством" 
                />
              </>
            ) : (
              <div style={{ textAlign: 'center', margin: '50px 0' }}>
                <Text>Лекарство не найдено или у вас нет доступа к нему.</Text>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default function MedicineDetailsPageWithTheme() {
  return (
    <ThemeWrapper>
      <MedicineDetailsPage />
    </ThemeWrapper>
  );
} 