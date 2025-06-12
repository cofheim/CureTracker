import React, { useEffect, useState } from 'react';
import { Card, Typography, List, Tag, Progress, Space, Empty, Spin, Button } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, CalendarOutlined } from '@ant-design/icons';
import { API_BASE_URL } from '../../lib/apiConfig';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../lib/ThemeContext';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

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

const Dashboard: React.FC = () => {
  const [todayIntakes, setTodayIntakes] = useState<Intake[]>([]);
  const [activeCourses, setActiveCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    fetchTodayIntakes();
    fetchActiveCourses();
    
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  const fetchTodayIntakes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/Intakes/today`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTodayIntakes(data);
      } else if (response.status === 404) {
        setTodayIntakes([]);
      }
    } catch (error) {
      console.error('Error fetching today intakes:', error);
    }
  };

  const fetchActiveCourses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/Courses/active`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setActiveCourses(data);
      }
    } catch (error) {
      console.error('Error fetching active courses:', error);
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
        fetchTodayIntakes();
        fetchActiveCourses();
      }
    } catch (error) {
      console.error('Error marking intake as taken:', error);
    }
  };

  const handleMarkAsSkipped = async (intakeId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/Intakes/${intakeId}/skip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skipReason: 'Пропущено с главной страницы' }),
        credentials: 'include',
      });

      if (response.ok) {
      
        fetchTodayIntakes();
        fetchActiveCourses();
      }
    } catch (error) {
      console.error('Error marking intake as skipped:', error);
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

  const formatTime = (dateString: string) => {
    return dayjs.utc(dateString).format('HH:mm');
  };

  const calculateTotalDoses = (course: Course) => {
    const startDate = dayjs.utc(course.startDate);
    const endDate = dayjs.utc(course.endDate);
    
    const daysDiff = endDate.diff(startDate, 'day') + 1;
    
    let totalDoses = 0;
    
    switch (course.intakeFrequency) {
      case 'Daily':
        totalDoses = daysDiff * course.timesADay;
        break;
      case 'Weekly':
        totalDoses = Math.ceil(daysDiff / 7) * course.timesADay;
        break;
      case 'Monthly':
        totalDoses = Math.ceil(daysDiff / 30) * course.timesADay;
        break;
      default:
        totalDoses = daysDiff * course.timesADay;
    }
    
    return totalDoses;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Card 
        title={<span style={{ fontSize: isMobile ? '14px' : '16px' }}>Прогресс по активным курсам</span>} 
        style={{ marginBottom: '20px' }}
        size={isMobile ? 'small' : 'default'}
      >
        {activeCourses.length > 0 ? (
          <List
            dataSource={activeCourses}
            renderItem={(course) => {
              const totalDoses = calculateTotalDoses(course);
              const completedDoses = course.takenDosesCount + course.skippedDosesCount;
              const progressPercent = totalDoses > 0 ? Math.round((completedDoses / totalDoses) * 100) : 0;
              const takenPercent = totalDoses > 0 ? Math.round((course.takenDosesCount / totalDoses) * 100) : 0;
              const skippedPercent = totalDoses > 0 ? Math.round((course.skippedDosesCount / totalDoses) * 100) : 0;
              
              return (
                <List.Item>
                  <div style={{ width: '100%' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      marginBottom: '8px',
                      flexDirection: isMobile ? 'column' : 'row'
                    }}>
                      <Text strong style={{ fontSize: isMobile ? '13px' : '14px', wordBreak: 'break-word' }}>{course.name}</Text>
                      <Button 
                        type="link" 
                        onClick={() => router.push(`/courses/${course.id}`)}
                        size={isMobile ? 'small' : 'middle'}
                        style={{ padding: isMobile ? '0' : undefined, height: isMobile ? 'auto' : undefined }}
                      >
                        Подробнее
                      </Button>
                    </div>
                    <Text type="secondary" style={{ fontSize: isMobile ? '12px' : '14px', wordBreak: 'break-word' }}>{course.medicineName}</Text>
                    <div style={{ marginTop: '8px' }}>
                      <Progress
                        success={{ percent: takenPercent }}
                        trailColor={theme === 'dark' ? '#303030' : '#f5f5f5'}
                        percent={progressPercent}
                        strokeColor={theme === 'dark' ? '#d89614' : '#faad14'}
                        format={() => `${completedDoses}/${totalDoses} (${progressPercent}%)`}
                        size={isMobile ? 'small' : 'default'}
                      />
                    </div>
                    <div style={{ marginTop: '4px', fontSize: isMobile ? '10px' : '12px' }}>
                      <Text type="secondary">
                        Принято: {course.takenDosesCount} | Пропущено: {course.skippedDosesCount}
                      </Text>
                    </div>
                  </div>
                </List.Item>
              );
            }}
          />
        ) : (
          <Empty description="У вас нет активных курсов" />
        )}
      </Card>

      <Card 
        title={<span style={{ fontSize: isMobile ? '14px' : '16px' }}>Приёмы на сегодня</span>}
        size={isMobile ? 'small' : 'default'}
      >
        {todayIntakes.length > 0 ? (
          <List
            itemLayout={isMobile ? "vertical" : "horizontal"}
            dataSource={todayIntakes}
            renderItem={(intake) => (
              <List.Item
                actions={
                  intake.status === IntakeStatus.Scheduled
                    ? [
                        <Button 
                          key="take" 
                          type="primary" 
                          icon={<CheckCircleOutlined />} 
                          onClick={() => handleMarkAsTaken(intake.id)}
                          size={isMobile ? 'small' : 'middle'}
                        >
                          Принять
                        </Button>,
                        <Button 
                          key="skip" 
                          danger 
                          icon={<CloseCircleOutlined />} 
                          onClick={() => handleMarkAsSkipped(intake.id)}
                          size={isMobile ? 'small' : 'middle'}
                        >
                          Пропустить
                        </Button>
                      ]
                    : undefined
                }
              >
                <List.Item.Meta
                  title={
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: '8px' }}>
                      <span style={{ fontSize: isMobile ? '13px' : '14px', wordBreak: 'break-word' }}>{intake.medicineName}</span>
                      <Tag color={getStatusColor(intake.status)} style={{ fontSize: isMobile ? '10px' : '12px', margin: isMobile ? '4px 0' : undefined }}>
                        {getStatusLabel(intake.status)}
                      </Tag>
                    </div>
                  }
                  description={
                    <div style={{ fontSize: isMobile ? '11px' : '12px' }}>
                      <div>Курс: <span style={{ wordBreak: 'break-word' }}>{intake.courseName}</span></div>
                      <div>
                        <CalendarOutlined /> {formatTime(intake.scheduledTime)}
                        {intake.actualTime && <span> (Принято в {formatTime(intake.actualTime)})</span>}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="На сегодня нет запланированных приемов" />
        )}
      </Card>
    </div>
  );
};

export default Dashboard; 