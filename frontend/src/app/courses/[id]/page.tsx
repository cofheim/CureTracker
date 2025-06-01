'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Table, Button, Typography, Space, Tag, Modal, Input, Spin, App, Tabs, Calendar, Badge } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ArrowLeftOutlined, CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { API_BASE_URL } from '../../../lib/apiConfig';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// Интерфейсы для типизации данных
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

  const [course, setCourse] = useState<Course | null>(null);
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [skipModalVisible, setSkipModalVisible] = useState<boolean>(false);
  const [skipReason, setSkipReason] = useState<string>('');
  const [currentIntakeId, setCurrentIntakeId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('list');
  const [calendarData, setCalendarData] = useState<Record<string, Intake[]>>({});

  // Загрузка данных о курсе и приемах при монтировании компонента
  useEffect(() => {
    fetchCourseDetails();
    fetchIntakes();
    fetchCalendarData();
  }, [courseId]);

  // Функция для загрузки данных о курсе
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

  // Функция для загрузки приемов лекарств
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

  // Функция для загрузки данных календаря
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
        // Фильтруем данные только для текущего курса
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

  // Функция для отметки приема как принятого
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

  // Функция для открытия модального окна пропуска приема
  const handleOpenSkipModal = (intakeId: string) => {
    setCurrentIntakeId(intakeId);
    setSkipReason('');
    setSkipModalVisible(true);
  };

  // Функция для отметки приема как пропущенного
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

  // Получение цвета для статуса приема
  const getStatusColor = (status: IntakeStatus) => {
    switch (status) {
      case IntakeStatus.Taken:
        return 'green';
      case IntakeStatus.Missed:
        return 'red';
      case IntakeStatus.Skipped:
        return 'orange';
      case IntakeStatus.Scheduled:
        return 'blue';
      default:
        return 'default';
    }
  };

  // Получение русского названия для статуса приема
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

  // Определение колонок для таблицы
  const columns = [
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
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (record: Intake) => (
        <Space size="middle">
          {record.status === IntakeStatus.Scheduled && (
            <>
              <Button 
                type="primary" 
                icon={<CheckCircleOutlined />}
                onClick={() => handleMarkAsTaken(record.id)}
              >
                Принято
              </Button>
              <Button 
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleOpenSkipModal(record.id)}
              >
                Пропущено
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  // Функция для отображения дат в календаре
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
    <div style={{ padding: '20px', background: '#f0f8ff', minHeight: '100vh' }}>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => router.push('/courses')} 
        style={{ marginBottom: '20px' }}
      >
        Вернуться к списку курсов
      </Button>
      
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '50px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {course ? (
            <>
              <Title level={2}>{course.name}</Title>
              <div style={{ marginBottom: '20px' }}>
                <Text strong>Лекарство: </Text>
                <Text>{course.medicineName}</Text>
                <br />
                <Text strong>Период: </Text>
                <Text>{new Date(course.startDate).toLocaleDateString()} - {new Date(course.endDate).toLocaleDateString()}</Text>
                <br />
                <Text strong>Частота: </Text>
                <Text>{course.intakeFrequency}</Text>
                <br />
                <Text strong>Статус: </Text>
                <Tag color={course.status === 'Active' ? 'green' : 
                           course.status === 'Planned' ? 'blue' : 
                           course.status === 'Completed' ? 'purple' : 'red'}>
                  {course.status === 'Active' ? 'Активный' : 
                   course.status === 'Planned' ? 'Запланирован' : 
                   course.status === 'Completed' ? 'Завершен' : 'Отменен'}
                </Tag>
                <br />
                <Text strong>Прогресс: </Text>
                <Text>{course.takenDosesCount} принято / {course.skippedDosesCount} пропущено</Text>
              </div>

              <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <TabPane 
                  tab={<span><UnorderedListOutlined /> Список приемов</span>}
                  key="list"
                >
                  <Table 
                    columns={columns} 
                    dataSource={intakes.map(intake => ({ ...intake, key: intake.id }))} 
                    pagination={{ pageSize: 10 }}
                    bordered
                  />
                </TabPane>
                <TabPane 
                  tab={<span><CalendarOutlined /> Календарь</span>}
                  key="calendar"
                >
                  <div className="calendar-container" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
                    <Calendar cellRender={dateCellRender} />
                  </div>
                </TabPane>
              </Tabs>
            </>
          ) : (
            <div style={{ textAlign: 'center', margin: '50px 0' }}>
              <Text>Курс не найден или у вас нет доступа к нему.</Text>
            </div>
          )}
        </>
      )}

      <Modal
        title="Пропуск приема"
        open={skipModalVisible}
        onOk={handleMarkAsSkipped}
        onCancel={() => setSkipModalVisible(false)}
        okText="Подтвердить"
        cancelText="Отмена"
      >
        <p>Укажите причину пропуска приема:</p>
        <Input.TextArea 
          rows={4} 
          value={skipReason}
          onChange={(e) => setSkipReason(e.target.value)}
          placeholder="Например: Забыл, плохое самочувствие, и т.д."
        />
      </Modal>
    </div>
  );
};

export default CourseDetailsPage; 