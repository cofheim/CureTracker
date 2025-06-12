'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Badge, Spin, Typography, Row, Col, Select, Button, App, Tooltip, Popconfirm, List, Card, Space } from 'antd';
import type { BadgeProps, CalendarProps } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import localeData from 'dayjs/plugin/localeData';
import utc from 'dayjs/plugin/utc';
import { API_BASE_URL } from '../../lib/apiConfig';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../lib/ThemeContext';
import { CheckCircleOutlined, CloseCircleOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { usePageTitle } from '../../lib/contexts/PageTitleContext';
import ruRU from 'antd/es/locale/ru_RU';

dayjs.locale('ru');
dayjs.extend(localeData);
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
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [mode, setMode] = useState<CalendarProps<Dayjs>['mode']>('month');
  const router = useRouter();
  const { message } = App.useApp();
  const { theme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle('Календарь приемов');
  }, [setTitle]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchIntakesForMonth(currentDate);
  }, [currentDate]);

  const fetchIntakesForMonth = async (date: dayjs.Dayjs) => {
    setLoading(true);
    const startDate = dayjs.utc(date).startOf('month').toISOString();
    const endDate = dayjs.utc(date).endOf('month').toISOString();

    try {
      const response = await fetch(`${API_BASE_URL}/Intakes/calendar/range?StartDate=${startDate}&EndDate=${endDate}`, {
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
      const response = await fetch(`${API_BASE_URL}/Intakes/${intakeId}/take`, {
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
      const response = await fetch(`${API_BASE_URL}/Intakes/${intakeId}/skip`, {
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

  const getListDataForDate = (date: dayjs.Dayjs) => {
    return intakes.filter(intake => dayjs.utc(intake.scheduledTime).isSame(date, 'day'));
  };

  const cellRender: CalendarProps<Dayjs>['cellRender'] = (current, info) => {
    if (info.type === 'date') {
      const listData = getListDataForDate(current);
      const isSelected = selectedDate.isSame(current, 'day');
      
      const cellStyle: React.CSSProperties = {
        border: isSelected ? `2px solid ${theme === 'dark' ? '#177ddc' : '#1890ff'}` : 'none',
        borderRadius: '8px',
        padding: '4px',
        height: '100%',
        transition: 'border 0.2s',
      };

      return (
        <div style={cellStyle}>
          {listData.length > 0 ? (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {listData.map((item) => (
                <li key={item.id}>
                  <Badge status={item.status as BadgeProps['status']} text={isMobile ? '' : item.medicineName} />
                </li>
              ))}
            </ul>
          ) : (
            <div style={{opacity: 0.5}}>{current.date()}</div>
          )}
        </div>
      );
    }
    return info.originNode;
  };
  
  const handlePanelChange = (date: Dayjs, newMode: CalendarProps<Dayjs>['mode']) => {
    setSelectedDate(date);
    if (newMode === 'month') {
        fetchIntakesForMonth(date);
    }
    setCurrentDate(date);
  };
  
  const onSelect = (date: Dayjs) => {
    setSelectedDate(date);
    if (mode === 'year') {
      setMode('month');
    }
    setCurrentDate(date);
  };
  
  const headerRender: CalendarProps<Dayjs>['headerRender'] = ({ value, type, onChange, onTypeChange }) => {
    const monthOptions = [];

    const months = dayjs.localeData().months();

    for (let i = 0; i < 12; i++) {
      monthOptions.push(
        <Select.Option key={i} value={i} className="month-item" style={{ textTransform: 'capitalize' }}>
          {months[i]}
        </Select.Option>,
      );
    }

    const year = value.year();
    const month = value.month();
    const options = [];
    for (let i = year - 10; i < year + 10; i += 1) {
      options.push(
        <Select.Option key={i} value={i} className="year-item">
          {i}
        </Select.Option>,
      );
    }
    return (
      <div style={{ padding: 8 }}>
        <Row gutter={8} justify="end">
          <Col>
            <Select
              size="small"
              dropdownMatchSelectWidth={false}
              className="my-year-select"
              value={year}
              onChange={(newYear) => {
                const now = value.clone().year(newYear);
                onChange(now);
              }}
            >
              {options}
            </Select>
          </Col>
          <Col>
            <Select
              size="small"
              dropdownMatchSelectWidth={false}
              value={month}
              onChange={(newMonth) => {
                const now = value.clone().month(newMonth);
                onChange(now);
              }}
            >
              {monthOptions}
            </Select>
          </Col>
          <Col>
            <Button.Group>
              <Button onClick={() => onTypeChange('month')}>Месяц</Button>
              <Button onClick={() => onTypeChange('year')}>Год</Button>
            </Button.Group>
          </Col>
        </Row>
      </div>
    );
  };

  const selectedDateIntakes = getListDataForDate(selectedDate);
  const backgroundColor = theme === 'dark' ? 'var(--secondary-color)' : '#f0f2f5';
  
  return (
    <div style={{ background: backgroundColor, padding: isMobile ? 8 : 24, height: '100%' }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Calendar
            fullscreen={!isMobile}
            cellRender={cellRender}
            headerRender={headerRender}
            mode={mode}
            onPanelChange={handlePanelChange}
            onSelect={onSelect}
            value={currentDate}
          />
          {!isMobile && selectedDateIntakes.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Text type="secondary">На выбранную дату приемов не запланировано.</Text>
            </div>
          )}
          {selectedDateIntakes.length > 0 && (
            <>
              <Title level={4} style={{ marginTop: '20px', marginBottom: '10px' }}>
                Приемы на {selectedDate.format('D MMMM YYYY')}
              </Title>
              <List
                grid={{
                  gutter: 16,
                  xs: 1,
                  sm: 1,
                  md: 2,
                  lg: 3,
                  xl: 4,
                  xxl: 5,
                }}
                dataSource={selectedDateIntakes}
                renderItem={(item) => (
                  <List.Item>
                    <Card
                      title={
                        <Space>
                          <MedicineBoxOutlined />
                          {item.medicineName}
                        </Space>
                      }
                      size="small"
                      actions={item.status === 'Scheduled' ? [
                        <Tooltip title="Принять">
                          <Button
                            type="text"
                            icon={<CheckCircleOutlined style={{ color: 'green' }} />}
                            onClick={() => handleMarkAsTaken(item.id)}
                          />
                        </Tooltip>,
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
                              icon={<CloseCircleOutlined />}
                            />
                           </Popconfirm>
                        </Tooltip>
                      ] : undefined}
                    >
                      <Text strong>Курс:</Text> <Text>{item.courseName}</Text><br/>
                      <Text strong>Время:</Text> <Text>{dayjs.utc(item.scheduledTime).format('HH:mm')}</Text><br/>
                      <Text strong>Статус:</Text> <Badge status={item.status as BadgeProps['status']} text={item.status} />
                    </Card>
                  </List.Item>
                )}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default CalendarPage; 