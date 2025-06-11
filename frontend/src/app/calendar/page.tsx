'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Badge, Spin, Typography, Row, Col, Select, Button, App, Tooltip, Popconfirm } from 'antd';
import type { BadgeProps } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import utc from 'dayjs/plugin/utc';
import { API_BASE_URL } from '../../lib/apiConfig';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../lib/ThemeContext';
import ThemeWrapper from '../components/ThemeWrapper';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

dayjs.locale('ru');
dayjs.extend(utc);

const { Title, Text } = Typography;
const { Option } = Select;

interface Intake {
  id: string;
  scheduledTime: string;
  actualTime: string | null;
  status: 'Scheduled' | 'Taken' | 'Missed' | 'Skipped';
  courseId: string;
  courseName: string;
  medicineName: string;
}

const CalendarPage: React.FC = () => {
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentDate, setCurrentDate] = useState(dayjs());
  const router = useRouter();
  const { message } = App.useApp();
  const { theme } = useTheme();

  useEffect(() => {
    fetchIntakesForMonth(currentDate);
  }, [currentDate]);

  const fetchIntakesForMonth = async (date: dayjs.Dayjs) => {
    setLoading(true);
    const startDate = dayjs.utc(date).startOf('month').toISOString();
    const endDate = dayjs.utc(date).endOf('month').toISOString();

    try {
      const response = await fetch(`${API_BASE_URL}/api/Intakes/calendar/range?StartDate=${startDate}&EndDate=${endDate}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setIntakes(data);
      } else if (response.status === 401) {
        router.push('/auth');
      } else {
        message.error('Не удалось загрузить данные для календаря');
      }
    } catch (error) {
      console.error('Error fetching calendar intakes:', error);
      message.error('Произошла ошибка при загрузке данных для календаря');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsTaken = async (intakeId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/Intakes/${intakeId}/take`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        message.success('Прием отмечен как принятый');
        fetchIntakesForMonth(currentDate);
      } else {
        const errorData = await response.json();
        message.error(errorData.message || 'Не удалось отметить прием');
      }
    } catch (error) {
      console.error('Error marking intake as taken:', error);
      message.error('Произошла ошибка при обновлении статуса приема');
    }
  };

  const handleMarkAsSkipped = async (intakeId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/Intakes/${intakeId}/skip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skipReason: 'Пропущено из календаря' }),
        credentials: 'include',
      });

      if (response.ok) {
        message.success('Прием отмечен как пропущенный');
        fetchIntakesForMonth(currentDate);
      } else {
        const errorData = await response.json();
        message.error(errorData.message || 'Не удалось отметить прием');
      }
    } catch (error) {
      console.error('Error marking intake as skipped:', error);
      message.error('Произошла ошибка при обновлении статуса приема');
    }
  };

  const getListData = (value: dayjs.Dayjs) => {
    return intakes.filter(intake => dayjs.utc(intake.scheduledTime).isSame(value, 'day'));
  };

  const dateCellRender = (value: dayjs.Dayjs) => {
    const listData = getListData(value);
    return (
      <ul className="events" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {listData.map((item) => (
          <li key={item.id} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Badge status={item.status as BadgeProps['status']} text={`${dayjs.utc(item.scheduledTime).format('HH:mm')} ${item.medicineName}`} />
            </div>
            {item.status === 'Scheduled' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Tooltip title="Принять">
                  <Button
                    type="text"
                    shape="circle"
                    icon={<CheckCircleOutlined style={{ color: 'green' }} />}
                    onClick={() => handleMarkAsTaken(item.id)}
                  />
                </Tooltip>
                <Tooltip title="Пропустить">
                  <Popconfirm
                    title="Вы уверены, что хотите пропустить этот прием?"
                    onConfirm={() => handleMarkAsSkipped(item.id)}
                    okText="Да"
                    cancelText="Нет"
                  >
                    <Button
                      type="text"
                      danger
                      shape="circle"
                      icon={<CloseCircleOutlined />}
                    />
                  </Popconfirm>
                </Tooltip>
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };
  
  const handlePanelChange = (date: dayjs.Dayjs, mode: string) => {
    setCurrentDate(date);
    if (mode === 'month') {
        fetchIntakesForMonth(date);
    }
  };

  const backgroundColor = theme === 'dark' ? 'var(--secondary-color)' : '#f0f8ff';

  return (
    <ThemeWrapper>
      <div style={{ padding: '20px', background: backgroundColor, minHeight: '100vh' }}>
        <Title level={2} style={{ color: 'var(--primary-color)', marginBottom: '20px' }}>Календарь приемов</Title>
        {loading && <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>}
        {!loading && 
          <Calendar 
            dateCellRender={dateCellRender} 
            onPanelChange={handlePanelChange}
            onSelect={(date) => setCurrentDate(date)}
          />
        }
      </div>
    </ThemeWrapper>
  );
};

export default CalendarPage; 