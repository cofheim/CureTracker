'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Typography, Card, Space, Tag, Button, Spin, Select, DatePicker, Row, Col, App, Input } from 'antd';
import { ArrowLeftOutlined, HistoryOutlined, FilterOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { API_BASE_URL } from '../../lib/apiConfig';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { useTheme } from '../../lib/ThemeContext';
import ThemeWrapper from '../components/ThemeWrapper';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Search } = Input;

dayjs.locale('ru');

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
  const { theme } = useTheme();

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

    if (searchText) {
      const lowerSearchText = searchText.toLowerCase();
      filtered = filtered.filter(log => 
        log.description.toLowerCase().includes(lowerSearchText) ||
        (log.medicineName && log.medicineName.toLowerCase().includes(lowerSearchText)) ||
        (log.courseName && log.courseName.toLowerCase().includes(lowerSearchText))
      );
    }

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
    if (log.medicineId && log.medicineName) {
      return (
        <Tag color="blue">
          <a onClick={() => router.push(`/medicines/${log.medicineId}`)} style={{ color: 'inherit', textDecoration: 'underline', cursor: 'pointer' }}>
            Лекарство: {log.medicineName}
          </a>
        </Tag>
      );
    } else if (log.courseId && log.courseName) {
      return (
        <Tag color="green">
          <a onClick={() => router.push(`/courses/${log.courseId}`)} style={{ color: 'inherit', textDecoration: 'underline', cursor: 'pointer' }}>
            Курс: {log.courseName}
          </a>
        </Tag>
      );
    } else if (log.intakeId) {
      return (
        <Tag color="orange">
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

  const backgroundColor = theme === 'dark' ? 'var(--secondary-color)' : '#f0f8ff';

  return (
    <div style={{ background: backgroundColor, minHeight: '100vh' }}>
      <Space direction="vertical" size="large" style={{ width: '100%', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.push('/')}
          >
            Вернуться на главную
          </Button>
          <Title level={2} style={{ margin: 0, color: 'var(--primary-color)' }}>
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
                placeholder="Выберите тип"
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
              <Text strong>Период:</Text>
              <RangePicker 
                style={{ width: '100%', marginTop: '8px' }}
                value={dateRange as any}
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null])}
                format="DD.MM.YYYY"
              />
            </Col>
            
            <Col xs={24} sm={12} md={8} lg={6}>
              <Text strong>Поиск:</Text>
              <Search
                placeholder="Введите текст для поиска"
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: '100%', marginTop: '8px' }}
              />
            </Col>
            
            <Col xs={24} sm={12} md={8} lg={6} style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
              <Button onClick={resetFilters} style={{ marginTop: '8px' }}>
                Сбросить фильтры
              </Button>
            </Col>
          </Row>
        </Card>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <Card>
            <Table 
              columns={columns} 
              dataSource={filteredLogs}
              rowKey="id"
              pagination={{
                current: page,
                pageSize: pageSize,
                total: totalLogs,
                onChange: (newPage) => setPage(newPage),
                onShowSizeChange: (_, newSize) => setPageSize(newSize),
                showSizeChanger: true,
                showTotal: (total) => `Всего: ${total} записей`,
              }}
            />
          </Card>
        )}
      </Space>
    </div>
  );
};

export default function ActivityPageWithTheme() {
  return (
    <ThemeWrapper>
      <ActivityPage />
    </ThemeWrapper>
  );
} 