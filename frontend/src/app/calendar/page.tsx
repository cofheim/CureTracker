'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Badge, Spin, Typography, Row, Col, Select, Button, App } from 'antd';
import type { BadgeProps } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import utc from 'dayjs/plugin/utc';
import { API_BASE_URL } from '../../lib/apiConfig';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../lib/ThemeContext';
import ThemeWrapper from '../components/ThemeWrapper';

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

  const getListData = (value: dayjs.Dayjs) => {
    return intakes.filter(intake => dayjs.utc(intake.scheduledTime).isSame(value, 'day'));
  };

  const dateCellRender = (value: dayjs.Dayjs) => {
    const listData = getListData(value);
    return (
      <ul className="events" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {listData.map((item) => (
          <li key={item.id} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
            <Badge status={item.status as BadgeProps['status']} text={`${dayjs.utc(item.scheduledTime).format('HH:mm')} ${item.medicineName}`} />
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