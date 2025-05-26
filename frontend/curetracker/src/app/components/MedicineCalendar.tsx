import React, { useState } from 'react';
import { Calendar, Badge, Modal, Card, Typography, Button, Tooltip } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { Medicine } from '@/app/models/Medicine';
import { getMedicineTypeLabel } from '@/utils/enumLocalization';
import { MedicineName } from './MedicineName';
import type { CalendarProps } from 'antd';

const { Text, Title } = Typography;

interface MedicineCalendarProps {
  medicines: Medicine[];
  handleTakeDose: (medicineId: string, intakeTime: Date) => void;
  handleOpen: (medicine: Medicine) => void;
}

export const MedicineCalendar: React.FC<MedicineCalendarProps> = ({
  medicines,
  handleTakeDose,
  handleOpen
}) => {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Функция для получения запланированных приемов на конкретный день
  const getIntakesForDate = (date: Dayjs) => {
    const intakes: { 
      medicine: Medicine; 
      time: Date;
      status: 'planned' | 'taken' | 'missed';
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
          let status: 'planned' | 'taken' | 'missed' = 'planned';
          
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

  // Функция для отображения событий в ячейке дня
  const renderIntakesCell = (date: Dayjs) => {
    const intakes = getIntakesForDate(date);
    
    return (
      <ul className="events" style={{ 
        margin: 0, 
        padding: 0, 
        listStyle: 'none',
        maxHeight: '100px',
        overflow: 'hidden'
      }}>
        {intakes.map((item, index) => {
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
          }
          
          return (
            <li key={index} style={{ marginBottom: '3px' }}>
              <Tooltip title={`${item.medicine.name} - ${item.plannedTime}`}>
                <Badge status={badgeStatus} text={`${item.plannedTime} ${item.medicine.name.substr(0, 8)}${item.medicine.name.length > 8 ? '...' : ''}`} />
              </Tooltip>
            </li>
          );
        })}
        {intakes.length > 3 && <li>...</li>}
      </ul>
    );
  };

  // Новый обработчик cellRender для Calendar в Ant Design v5+
  const cellRender: CalendarProps<Dayjs>['cellRender'] = (current, info) => {
    if (info.type === 'date') {
      return renderIntakesCell(current);
    }
    return null;
  };

  const handleSelect = (date: Dayjs) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <Calendar 
        cellRender={cellRender}
        onSelect={handleSelect}
        style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}
      />
      
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
                      <Button 
                        type="primary" 
                        onClick={() => handleTakeDose(intake.medicine.id, intake.time)}
                      >
                        Отметить как принятое
                      </Button>
                    ) : intake.status === 'taken' ? (
                      <Text type="success">Принято ✓</Text>
                    ) : intake.status === 'missed' ? (
                      <Text type="danger">Пропущено</Text>
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
    </div>
  );
}; 