import React, { useState, useEffect } from 'react';
import { Badge, Modal, Card, Typography, Button, Tooltip, Row, Col, Select, DatePicker, Space, Empty } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { Medicine } from '@/app/models/Medicine';
import { getMedicineTypeLabel } from '@/utils/enumLocalization';
import { MedicineName } from './MedicineName';

const { Text, Title } = Typography;
const { Option } = Select;

interface MedicineCalendarProps {
  medicines: Medicine[];
  handleTakeDose: (medicineId: string, intakeTime: Date) => void;
  handleOpen: (medicine: Medicine) => void;
  handleSkipDose?: (medicineId: string, intakeTime: Date) => void;
}

export const MedicineCalendar: React.FC<MedicineCalendarProps> = ({
  medicines,
  handleTakeDose,
  handleOpen,
  handleSkipDose
}) => {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [calendarDays, setCalendarDays] = useState<Dayjs[]>([]);
  const [startDay, setStartDay] = useState<Dayjs>(dayjs());
  
  // Фиксированная высота ячейки
  const cellHeight = 120;

  // Генерируем 28 дней (4 недели), начиная с сегодняшнего дня
  useEffect(() => {
    const days: Dayjs[] = [];
    for (let i = 0; i < 28; i++) {
      days.push(startDay.add(i, 'day'));
    }
    setCalendarDays(days);
  }, [startDay]);

  // Функция для получения запланированных приемов на конкретный день
  const getIntakesForDate = (date: Dayjs) => {
    const intakes: { 
      medicine: Medicine; 
      time: Date;
      status: 'planned' | 'taken' | 'missed' | 'skipped';
      plannedTime: string;
    }[] = [];

    medicines.forEach(medicine => {
      // Проверяем, активен ли курс лекарства на эту дату
      const medStartDate = dayjs(medicine.startDate);
      const medEndDate = dayjs(medicine.endDate);
      
      if (date >= medStartDate && date <= medEndDate) {
        // Курс активен на эту дату, добавляем все приемы
        medicine.timesOfTaking.forEach(timeStr => {
          const time = new Date(timeStr);
          const intakeDate = date.toDate();
          intakeDate.setHours(time.getHours(), time.getMinutes(), 0, 0);
          
          // Определяем статус приема
          let status: 'planned' | 'taken' | 'missed' | 'skipped' = 'planned';
          
          // Если это сегодня, используем статус из todaysIntakes
          if (dayjs().isSame(date, 'day') && medicine.todaysIntakes) {
            const todayIntake = medicine.todaysIntakes.find(
              intake => new Date(intake.time).getHours() === time.getHours() && 
                        new Date(intake.time).getMinutes() === time.getMinutes()
            );
            if (todayIntake) {
              status = todayIntake.status;
            }
          } 
          // Если дата в прошлом, считаем пропущенным
          else if (date.isBefore(dayjs(), 'day')) {
            status = 'missed';
          }
          
          const hours = time.getHours().toString().padStart(2, '0');
          const minutes = time.getMinutes().toString().padStart(2, '0');
          const plannedTimeStr = `${hours}:${minutes}`;
          
          intakes.push({ 
            medicine, 
            time: intakeDate,
            status,
            plannedTime: plannedTimeStr
          });
        });
      }
    });

    // Сортируем по времени
    intakes.sort((a, b) => a.time.getTime() - b.time.getTime());
    
    return intakes;
  };

  // Функция для отображения дня
  const renderDay = (date: Dayjs) => {
    const intakes = getIntakesForDate(date);
    const isToday = date.isSame(dayjs(), 'day');
    
    return (
      <div 
        className={`calendar-day ${isToday ? 'today' : ''}`}
        onClick={() => handleSelect(date)}
        style={{ 
          padding: '8px',
          border: '1px solid #f0f0f0',
          borderRadius: '4px',
          height: `${cellHeight}px`,
          position: 'relative',
          cursor: 'pointer',
          backgroundColor: isToday ? '#e6f7ff' : 'white',
          overflow: 'hidden'
        }}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: '8px',
          fontWeight: isToday ? 'bold' : 'normal'
        }}>
          <span>{date.format('D')}</span>
          <span>{date.format('ddd')}</span>
        </div>
        
        <ul style={{ 
          margin: 0, 
          padding: 0, 
          listStyle: 'none',
          overflow: 'hidden',
          maxHeight: `${cellHeight - 45}px`
        }}>
          {intakes.slice(0, 3).map((item, index) => {
            let badgeStatus: "success" | "processing" | "error" | "warning" | "default" = "default";
            
            switch(item.status) {
              case 'taken':
                badgeStatus = 'success';
                break;
              case 'planned':
                badgeStatus = 'processing';
                break;
              case 'missed':
                badgeStatus = 'error';
                break;
              case 'skipped':
                badgeStatus = 'warning';
                break;
            }
            
            return (
              <li key={index} style={{ marginBottom: '3px', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <Tooltip title={`${item.medicine.name} - ${item.plannedTime}`}>
                  <Badge status={badgeStatus} text={`${item.plannedTime} ${item.medicine.name.substr(0, 8)}${item.medicine.name.length > 8 ? '...' : ''}`} />
                </Tooltip>
              </li>
            );
          })}
          {intakes.length > 3 && (
            <li style={{ fontSize: '12px', textAlign: 'right' }}>
              +{intakes.length - 3} еще...
            </li>
          )}
        </ul>
      </div>
    );
  };

  const handleSelect = (date: Dayjs) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const navigatePrevious = () => {
    setStartDay(startDay.subtract(7, 'day'));
  };

  const navigateNext = () => {
    setStartDay(startDay.add(7, 'day'));
  };

  const goToToday = () => {
    setStartDay(dayjs());
  };
  
  // Обработчик изменения даты через DatePicker
  const handleDateChange = (date: Dayjs | null) => {
    if (date) {
      setStartDay(date);
    }
  };

  return (
    <div>
      {medicines.length === 0 ? (
        <div style={{ 
          textAlign: 'center',
          padding: '50px 0',
          width: '100%',
          backgroundColor: 'white',
          borderRadius: '8px'
        }}>
          <Empty 
            description="Нет лекарств, соответствующих заданным фильтрам" 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <Button onClick={goToToday}>Сегодня</Button>
              <Button onClick={navigatePrevious} style={{ marginLeft: '8px' }}>← Назад</Button>
              <Button onClick={navigateNext} style={{ marginLeft: '8px' }}>Вперед →</Button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Text strong style={{ marginRight: '8px' }}>Перейти к:</Text>
              <DatePicker 
                value={startDay}
                onChange={handleDateChange}
                allowClear={false}
                format="DD MMMM YYYY"
                style={{ width: '180px' }}
              />
            </div>
          </div>
          
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px'
          }}>
            <div style={{ marginBottom: '16px', textAlign: 'center' }}>
              <Title level={4}>{startDay.format('MMMM YYYY')}</Title>
            </div>
            <Row gutter={[8, 8]}>
              {calendarDays.map((day, index) => (
                <Col span={6} key={index}>
                  {renderDay(day)}
                </Col>
              ))}
            </Row>
          </div>
        </>
      )}
      
      <Modal
        title={`Приемы лекарств на ${selectedDate.format('DD MMMM YYYY')}`}
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        width={700}
      >
        <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
          {getIntakesForDate(selectedDate).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Title level={4}>Нет запланированных приемов на этот день</Title>
            </div>
          ) : (
            getIntakesForDate(selectedDate).map((intake, index) => (
              <Card 
                key={index} 
                style={{ marginBottom: '10px' }}
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <MedicineName name={intake.medicine.name} />
                    <Text strong>{intake.plannedTime}</Text>
                  </div>
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Text type="secondary">
                    <strong>Тип:</strong> {getMedicineTypeLabel(intake.medicine.type)}
                  </Text>
                  <Text type="secondary">
                    <strong>Дозировка:</strong> {intake.medicine.dosagePerTake} мг
                  </Text>
                  {intake.medicine.description && (
                    <Text>
                      <strong>Описание:</strong> {intake.medicine.description}
                    </Text>
                  )}
                  
                  <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                    {intake.status === 'planned' && dayjs().isSame(selectedDate, 'day') ? (
                      <Space>
                        <Button 
                          type="primary" 
                          onClick={() => handleTakeDose(intake.medicine.id, intake.time)}
                          disabled={(intake.medicine.takenDosesCount || 0) >= (intake.medicine.totalDosesInCourse || 0)}
                          title={(intake.medicine.takenDosesCount || 0) >= (intake.medicine.totalDosesInCourse || 0) ? 
                            "Курс лекарства завершен" : ""}
                        >
                          Отметить как принятое
                        </Button>
                        {handleSkipDose && (
                          <Button 
                            danger
                            onClick={() => handleSkipDose(intake.medicine.id, intake.time)}
                            disabled={(intake.medicine.takenDosesCount || 0) >= (intake.medicine.totalDosesInCourse || 0)}
                            title={(intake.medicine.takenDosesCount || 0) >= (intake.medicine.totalDosesInCourse || 0) ? 
                              "Курс лекарства завершен" : ""}
                          >
                            Пропустить
                          </Button>
                        )}
                      </Space>
                    ) : intake.status === 'taken' ? (
                      <Text type="success">Принято ✓</Text>
                    ) : intake.status === 'missed' ? (
                      <Text type="danger">Пропущено</Text>
                    ) : intake.status === 'skipped' ? (
                      <Text type="warning">Пропущено намеренно</Text>
                    ) : (
                      <Text type="warning">Запланировано</Text>
                    )}
                    
                    <Button onClick={() => handleOpen(intake.medicine)}>
                      Редактировать лекарство
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </Modal>

      <style jsx global>{`
        .calendar-day:hover {
          background-color: #f9f9f9 !important;
        }
        .today {
          border-color: #1890ff !important;
          box-shadow: 0 0 0 1px #1890ff;
        }
      `}</style>
    </div>
  );
}; 