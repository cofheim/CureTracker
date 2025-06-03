'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Table, Button, Typography, Space, Tag, Modal, Input, Spin, App, Tabs, Calendar, Badge } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ArrowLeftOutlined, CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { API_BASE_URL } from '../../../lib/apiConfig';
import { useTheme } from '../../../lib/ThemeContext';
import ThemeWrapper from '../../components/ThemeWrapper';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface Intake {
  id: string;
  scheduledTime: string;
  actualTime: string | null;
  status: IntakeStatus;
  skipReason: string | null;
  courseId: string;
  courseName: string;
  medicineName: string;
}

interface Course {
  id: string;
  name: string;
  description: string;
  timesADay: number;
  timesOfTaking: string[];
  startDate: string;
  endDate: string;
  status: string;
  intakeFrequency: string;
  takenDosesCount: number;
  skippedDosesCount: number;
  medicineId: string;
  medicineName: string;
}

enum IntakeStatus {
  Scheduled = 'Scheduled',
  Taken = 'Taken',
  Missed = 'Missed',
  Skipped = 'Skipped'
}

const CourseDetailsPage: React.FC = () => {
  const params = useParams();
  const courseId = params.id as string;
  const router = useRouter();
  const { message, modal } = App.useApp();
  const { theme } = useTheme();

  const [course, setCourse] = useState<Course | null>(null);
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [skipModalVisible, setSkipModalVisible] = useState<boolean>(false);
  const [skipReason, setSkipReason] = useState<string>('');
  const [currentIntakeId, setCurrentIntakeId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('list');
  const [calendarData, setCalendarData] = useState<Record<string, Intake[]>>({});
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    fetchCourseDetails();
    fetchIntakes();
    fetchCalendarData();
  }, [courseId]);

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

  const fetchCourseDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/Courses/${courseId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setCourse(data);
      } else if (response.status === 401) {
        router.push('/auth');
      } else {
        message.error('Не удалось загрузить данные о курсе');
      }
    } catch (error) {
      console.error('Error fetching course details:', error);
      message.error('Произошла ошибка при загрузке данных о курсе');
    } finally {
      setLoading(false);
    }
  };

  const fetchIntakes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/Courses/${courseId}/intakes`, {
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
        message.error('Не удалось загрузить список приемов');
      }
    } catch (error) {
      console.error('Error fetching intakes:', error);
      message.error('Произошла ошибка при загрузке списка приемов');
    }
  };

  const fetchCalendarData = async () => {
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      const response = await fetch(`${API_BASE_URL}/api/Intakes/calendar?year=${year}&month=${month}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const filteredData: Record<string, Intake[]> = {};
        for (const [date, dayIntakes] of Object.entries(data)) {
          const courseIntakes = (dayIntakes as Intake[]).filter(intake => intake.courseId === courseId);
          if (courseIntakes.length > 0) {
            filteredData[date] = courseIntakes;
          }
        }
        setCalendarData(filteredData);
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      message.error('Произошла ошибка при загрузке данных календаря');
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
        fetchIntakes();
        fetchCourseDetails();
        fetchCalendarData();
      } else {
        const errorData = await response.json();
        message.error(errorData.message || 'Не удалось отметить прием');
      }
    } catch (error) {
      console.error('Error marking intake as taken:', error);
      message.error('Произошла ошибка при обновлении статуса приема');
    }
  };

  const handleOpenSkipModal = (intakeId: string) => {
    setCurrentIntakeId(intakeId);
    setSkipReason('');
    setSkipModalVisible(true);
  };

  const handleMarkAsSkipped = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/Intakes/${currentIntakeId}/skip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skipReason }),
        credentials: 'include',
      });

      if (response.ok) {
        message.success('Прием отмечен как пропущенный');
        setSkipModalVisible(false);
        fetchIntakes();
        fetchCourseDetails();
        fetchCalendarData();
      } else {
        const errorData = await response.json();
        message.error(errorData.message || 'Не удалось отметить прием');
      }
    } catch (error) {
      console.error('Error marking intake as skipped:', error);
      message.error('Произошла ошибка при обновлении статуса приема');
    }
  };

  const getStatusColor = (status: IntakeStatus) => {
    switch (status) {
      case IntakeStatus.Taken:
        return theme === 'dark' ? 'green' : 'green';
      case IntakeStatus.Missed:
        return theme === 'dark' ? 'red' : 'red';
      case IntakeStatus.Skipped:
        return theme === 'dark' ? 'orange' : 'orange';
      case IntakeStatus.Scheduled:
        return theme === 'dark' ? 'blue' : 'blue';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: IntakeStatus) => {
    switch (status) {
      case IntakeStatus.Taken:
        return 'Принято';
      case IntakeStatus.Missed:
        return 'Пропущено';
      case IntakeStatus.Skipped:
        return 'Пропущено намеренно';
      case IntakeStatus.Scheduled:
        return 'Запланировано';
      default:
        return status;
    }
  };

  const backgroundColor = theme === 'dark' ? 'var(--secondary-color)' : '#f0f8ff';

  const columns: ColumnsType<Intake> = [
    {
      title: 'Дата и время',
      key: 'scheduledTime',
      render: (record: Intake) => (
        <>{new Date(record.scheduledTime).toLocaleString()}</>
      ),
      sorter: (a: Intake, b: Intake) => 
        new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime(),
      defaultSortOrder: 'ascend' as 'ascend',
    },
    {
      title: 'Лекарство',
      key: 'medicineName',
      dataIndex: 'medicineName',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Статус',
      key: 'status',
      render: (record: Intake) => (
        <Tag color={getStatusColor(record.status as IntakeStatus)}>
          {getStatusLabel(record.status as IntakeStatus)}
        </Tag>
      ),
      filters: [
        { text: 'Принято', value: IntakeStatus.Taken },
        { text: 'Пропущено', value: IntakeStatus.Missed },
        { text: 'Пропущено намеренно', value: IntakeStatus.Skipped },
      ],
      onFilter: (value: any, record: Intake) => record.status === value,
    },
    {
      title: 'Фактическое время',
      key: 'actualTime',
      render: (record: Intake) => (
        <>{record.actualTime ? new Date(record.actualTime).toLocaleString() : '-'}</>
      ),
      className: isMobile ? 'hidden-column' : '',
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (record: Intake) => (
        <Space size={isMobile ? "small" : "middle"} wrap>
          {record.status === IntakeStatus.Scheduled && (
            <>
              <Button 
                type="primary" 
                size={isMobile ? "small" : "middle"}
                icon={<CheckCircleOutlined />}
                onClick={() => handleMarkAsTaken(record.id)}
              >
                {!isMobile && "Принято"}
              </Button>
              <Button 
                danger
                size={isMobile ? "small" : "middle"}
                icon={<CloseCircleOutlined />}
                onClick={() => handleOpenSkipModal(record.id)}
              >
                {!isMobile && "Пропущено"}
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const dateCellRender = (date: dayjs.Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    const dayIntakes = calendarData[dateStr] || [];
    
    return (
      <ul className="events" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {dayIntakes.map((intake) => (
          <li key={intake.id} style={{ marginBottom: '2px' }}>
            <Badge 
              status={intake.status === IntakeStatus.Taken ? 'success' : 
                     intake.status === IntakeStatus.Skipped ? 'warning' : 
                     intake.status === IntakeStatus.Scheduled ? 'processing' : 'error'} 
              text={`${new Date(intake.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`} 
            />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div style={{ background: backgroundColor, minHeight: '100vh' }}>
      <div style={{ padding: '20px' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => router.push('/courses')} 
          style={{ marginBottom: '20px' }}
        >
          Вернуться к списку курсов
        </Button>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            {course ? (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <Title level={2} style={{ color: 'var(--primary-color)' }}>{course.name}</Title>
                  <Space direction="vertical" size="small">
                    <Text>Лекарство: <strong>{course.medicineName}</strong></Text>
                    <Text>Описание: {course.description || 'Нет описания'}</Text>
                    <Text>Период: {dayjs(course.startDate).format('DD.MM.YYYY')} - {dayjs(course.endDate).format('DD.MM.YYYY')}</Text>
                    <Text>Частота приема: {course.intakeFrequency === 'Daily' ? 'Ежедневно' : 
                                          course.intakeFrequency === 'Weekly' ? 'Еженедельно' : 'Ежемесячно'}</Text>
                    <Text>Количество приемов в день: {course.timesADay}</Text>
                    <Text>Статус: <Tag color={course.status === 'Active' ? 'green' : 
                                        course.status === 'Completed' ? 'blue' : 
                                        course.status === 'Planned' ? 'orange' : 'red'}>
                      {course.status === 'Active' ? 'Активный' : 
                       course.status === 'Completed' ? 'Завершен' : 
                       course.status === 'Planned' ? 'Запланирован' : 'Отменен'}
                    </Tag></Text>
                    <Text>Принято доз: {course.takenDosesCount}</Text>
                    <Text>Пропущено доз: {course.skippedDosesCount}</Text>
                  </Space>
                </div>
                
                <style jsx global>{`
                  .hidden-column {
                    display: none;
                  }
                `}</style>
                
                <Tabs 
                  activeKey={activeTab} 
                  onChange={setActiveTab}
                  items={[
                    {
                      key: 'list',
                      label: <span><UnorderedListOutlined /> Список приемов</span>,
                      children: (
                        <Table 
                          columns={columns} 
                          dataSource={intakes}
                          rowKey="id"
                          pagination={{ pageSize: 10 }}
                          scroll={{ x: 'max-content' }}
                        />
                      )
                    },
                    {
                      key: 'calendar',
                      label: <span><CalendarOutlined /> Календарь</span>,
                      children: (
                        <Calendar 
                          dateCellRender={dateCellRender}
                          monthCellRender={undefined}
                        />
                      )
                    }
                  ]}
                />
              </>
            ) : (
              <div style={{ textAlign: 'center', margin: '50px 0' }}>
                <Text>Курс не найден или у вас нет доступа к нему.</Text>
              </div>
            )}
          </>
        )}
      </div>
      
      <Modal
        title="Причина пропуска приема"
        open={skipModalVisible}
        onOk={handleMarkAsSkipped}
        onCancel={() => setSkipModalVisible(false)}
        okText="Подтвердить"
        cancelText="Отмена"
      >
        <Input.TextArea 
          rows={4} 
          placeholder="Укажите причину пропуска приема (необязательно)"
          value={skipReason}
          onChange={(e) => setSkipReason(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default function CourseDetailsPageWithTheme() {
  return (
    <ThemeWrapper>
      <CourseDetailsPage />
    </ThemeWrapper>
  );
} 