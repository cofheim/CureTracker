'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Typography, Card, Space, Tag, Button, Spin, Select, DatePicker, Row, Col, App, Input } from 'antd';
import { ArrowLeftOutlined, HistoryOutlined, FilterOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { API_BASE_URL } from '../../lib/apiConfig';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Search } = Input;

// Локализация dayjs
dayjs.locale('ru');

// Интерфейсы для типизации данных
interface ActionLog {
  id: string;
  description: string;
  timestamp: string;
  medicineId: string | null;
  medicineName: string | null;
  courseId: string | null;
  courseName: string | null;
  intakeId: string | null;
}

const ActivityPage: React.FC = () => {
  const router = useRouter();
  const { message } = App.useApp();
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalLogs, setTotalLogs] = useState<number>(0);
  const [entityType, setEntityType] = useState<string | null>(null);
  const [entityId, setEntityId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [filteredLogs, setFilteredLogs] = useState<ActionLog[]>([]);

  useEffect(() => {
    fetchLogs();
  }, [page, pageSize]);

  useEffect(() => {
    applyFilters();
  }, [logs, entityType, entityId, searchText, dateRange]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/api/ActionLogs?Page=${page}&PageSize=${pageSize}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data);
        // Если бы у нас был заголовок с общим количеством логов, мы бы установили его здесь
        // setTotalLogs(response.headers.get('X-Total-Count') || data.length);
        setTotalLogs(data.length);
      } else if (response.status === 401) {
        router.push('/auth');
      } else {
        message.error('Не удалось загрузить журнал действий');
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      message.error('Произошла ошибка при загрузке журнала действий');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // Фильтр по типу сущности
    if (entityType && entityId) {
      switch (entityType) {
        case 'medicine':
          filtered = filtered.filter(log => log.medicineId === entityId);
          break;
        case 'course':
          filtered = filtered.filter(log => log.courseId === entityId);
          break;
        case 'intake':
          filtered = filtered.filter(log => log.intakeId === entityId);
          break;
      }
    } else if (entityType) {
      // Фильтр только по типу без конкретного ID
      switch (entityType) {
        case 'medicine':
          filtered = filtered.filter(log => log.medicineId !== null);
          break;
        case 'course':
          filtered = filtered.filter(log => log.courseId !== null);
          break;
        case 'intake':
          filtered = filtered.filter(log => log.intakeId !== null);
          break;
      }
    }

    // Фильтр по тексту
    if (searchText) {
      const lowerSearchText = searchText.toLowerCase();
      filtered = filtered.filter(log => 
        log.description.toLowerCase().includes(lowerSearchText) ||
        (log.medicineName && log.medicineName.toLowerCase().includes(lowerSearchText)) ||
        (log.courseName && log.courseName.toLowerCase().includes(lowerSearchText))
      );
    }

    // Фильтр по дате
    if (dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf('day');
      const endDate = dateRange[1].endOf('day');
      
      filtered = filtered.filter(log => {
        const logDate = dayjs(log.timestamp);
        return logDate.isAfter(startDate) && logDate.isBefore(endDate);
      });
    }

    setFilteredLogs(filtered);
  };

  const resetFilters = () => {
    setEntityType(null);
    setEntityId(null);
    setSearchText('');
    setDateRange([null, null]);
    setPage(1);
  };

  const handleEntityTypeChange = (value: string) => {
    setEntityType(value);
    setEntityId(null);
    setPage(1);
  };

  const formatTimestamp = (timestamp: string) => {
    return dayjs(timestamp).format('DD.MM.YYYY HH:mm:ss');
  };

  const getEntityTag = (log: ActionLog) => {
    if (log.medicineId) {
      return (
        <Tag color="blue" onClick={() => {
          setEntityType('medicine');
          setEntityId(log.medicineId!);
        }}>
          Лекарство: {log.medicineName || log.medicineId}
        </Tag>
      );
    } else if (log.courseId) {
      return (
        <Tag color="green" onClick={() => {
          setEntityType('course');
          setEntityId(log.courseId!);
        }}>
          Курс: {log.courseName || log.courseId}
        </Tag>
      );
    } else if (log.intakeId) {
      return (
        <Tag color="orange" onClick={() => {
          setEntityType('intake');
          setEntityId(log.intakeId!);
        }}>
          Прием: {log.intakeId}
        </Tag>
      );
    }
    return <Tag color="default">Система</Tag>;
  };

  const columns = [
    {
      title: 'Дата и время',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: string) => formatTimestamp(timestamp),
      sorter: (a: ActionLog, b: ActionLog) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      defaultSortOrder: 'descend' as 'descend',
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Связанная сущность',
      key: 'entity',
      render: (log: ActionLog) => getEntityTag(log),
      filters: [
        { text: 'Лекарства', value: 'medicine' },
        { text: 'Курсы', value: 'course' },
        { text: 'Приемы', value: 'intake' },
        { text: 'Система', value: 'system' }
      ],
      onFilter: (value: any, record: ActionLog) => {
        if (value === 'medicine') return record.medicineId !== null;
        if (value === 'course') return record.courseId !== null;
        if (value === 'intake') return record.intakeId !== null;
        if (value === 'system') return !record.medicineId && !record.courseId && !record.intakeId;
        return true;
      }
    },
  ];

  return (
    <div style={{ background: '#f0f8ff', minHeight: '100vh' }}>
      <Space direction="vertical" size="large" style={{ width: '100%', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.push('/')}
          >
            Вернуться на главную
          </Button>
          <Title level={2} style={{ margin: 0 }}>
            <HistoryOutlined /> История действий
          </Title>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchLogs}
          >
            Обновить
          </Button>
        </div>
        
        <Card title={<div><FilterOutlined /> Фильтры</div>}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8} lg={6}>
              <Text strong>Тип сущности:</Text>
              <Select
                style={{ width: '100%', marginTop: '8px' }}
                placeholder="Выберите тип сущности"
                allowClear
                value={entityType}
                onChange={handleEntityTypeChange}
              >
                <Option value="medicine">Лекарства</Option>
                <Option value="course">Курсы</Option>
                <Option value="intake">Приемы</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Text strong>Поиск по тексту:</Text>
              <Search
                style={{ marginTop: '8px' }}
                placeholder="Введите текст для поиска"
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </Col>
            <Col xs={24} sm={12} md={8} lg={8}>
              <Text strong>Период:</Text>
              <RangePicker 
                style={{ width: '100%', marginTop: '8px' }}
                value={dateRange}
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null])}
                format="DD.MM.YYYY"
              />
            </Col>
            <Col xs={24} sm={12} md={24} lg={4} style={{ display: 'flex', alignItems: 'flex-end' }}>
              <Button 
                type="primary" 
                onClick={resetFilters} 
                style={{ marginTop: '8px' }}
              >
                Сбросить фильтры
              </Button>
            </Col>
          </Row>
        </Card>
        
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <Card>
            <Table
              columns={columns}
              dataSource={filteredLogs.map(log => ({ ...log, key: log.id }))}
              pagination={{
                current: page,
                pageSize: pageSize,
                total: filteredLogs.length,
                onChange: (page, pageSize) => {
                  setPage(page);
                  setPageSize(pageSize || 10);
                },
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50', '100'],
              }}
              locale={{ emptyText: 'Нет данных' }}
            />
          </Card>
        )}
      </Space>
    </div>
  );
};

export default ActivityPage; 