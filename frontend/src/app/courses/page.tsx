'use client';

import React, { useState, useEffect, Key } from 'react';
import { Button, Modal, Form, Input, DatePicker, Select, Typography, Space, Spin, Popconfirm, Tag, TimePicker, InputNumber, App, Card, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CalendarOutlined, MedicineBoxOutlined, ReloadOutlined, FilterOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../lib/apiConfig';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useTheme } from '../../lib/ThemeContext';
import ResponsiveTable from '../components/ResponsiveTable';
import { usePageTitle } from '../../lib/contexts/PageTitleContext';

dayjs.extend(utc);

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Search } = Input;

interface Course {
  id: string;
  name: string;
  description: string;
  timesADay: number;
  timesOfTaking: string[]; 
  startDate: string;
  endDate: string;
  status: CourseStatus;
  intakeFrequency: IntakeFrequency;
  takenDosesCount: number;
  skippedDosesCount: number;
  medicineId: string;
  medicineName: string;
}

interface Medicine {
  id: string;
  name: string;
  description: string;
  dosagePerTake: number;
  storageConditions: string;
  type: string;
}

enum CourseStatus {
  Planned = 'Planned',
  Active = 'Active',
  Completed = 'Completed'
}

enum IntakeFrequency {
  Daily = 'Daily',
  Weekly = 'Weekly',
  Monthly = 'Monthly'
}

const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [form] = Form.useForm();
  const router = useRouter();
  const { message, modal } = App.useApp();
  const { theme } = useTheme();
  const { setTitle } = usePageTitle();

  const [searchText, setSearchText] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<CourseStatus | null>(null);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);

  useEffect(() => {
    setTitle('Курсы лечения');
  }, [setTitle]);

  useEffect(() => {
    fetchCourses();
    fetchMedicines();
  }, []);

  useEffect(() => {
    applyCourseFilters();
  }, [courses, searchText, statusFilter]);

  const applyCourseFilters = () => {
    let tempFilteredCourses = [...courses];

    if (searchText) {
      const lowerSearchText = searchText.toLowerCase();
      tempFilteredCourses = tempFilteredCourses.filter(course =>
        course.name.toLowerCase().includes(lowerSearchText) ||
        (course.medicineName && course.medicineName.toLowerCase().includes(lowerSearchText))
      );
    }

    if (statusFilter) {
      tempFilteredCourses = tempFilteredCourses.filter(course => course.status === statusFilter);
    }

    setFilteredCourses(tempFilteredCourses);
  };

  const resetCourseFilters = () => {
    setSearchText('');
    setStatusFilter(null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleStatusFilterChange = (value: CourseStatus | null) => {
    setStatusFilter(value);
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/Courses`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      } else if (response.status === 401) {
        router.push('/auth');
      } else {
        message.error('Не удалось загрузить список курсов');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      message.error('Произошла ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/Medicine`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setMedicines(data);
      } else if (response.status !== 401) {
        message.error('Не удалось загрузить список лекарств');
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
      message.error('Произошла ошибка при загрузке списка лекарств');
    }
  };

  const handleSubmit = async (values: any) => {
    if (medicines.length === 0) {
      message.warning('Сначала добавьте хотя бы одно лекарство');
      router.push('/medicines');
      return;
    }

    setLoading(true);
    try {
      const timesOfTaking = values.timesOfTaking.map((time: any) => {
        return time.format('HH:mm:ss');
      });

      const startDate = dayjs.utc(values.dateRange[0]).startOf('day').toISOString();
      const endDate = dayjs.utc(values.dateRange[1]).startOf('day').toISOString();

      const payload = {
        name: values.name,
        description: values.description || '',
        timesADay: values.timesOfTaking.length,
        timesOfTaking: timesOfTaking,
        startDate: startDate,
        endDate: endDate,
        medicineId: values.medicineId,
        intakeFrequency: values.intakeFrequency || IntakeFrequency.Daily
      };

      console.log('Отправляемые данные:', payload);

      const url = editingCourse 
        ? `${API_BASE_URL}/api/Courses/${editingCourse.id}` 
        : `${API_BASE_URL}/api/Courses`;
      
      const method = editingCourse ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      const responseText = await response.text();
      console.log('Ответ сервера:', responseText);
      
      let errorData;
      
      try {
        errorData = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.error('Не удалось распарсить ответ как JSON:', responseText);
        errorData = { message: responseText || 'Неизвестная ошибка' };
      }
      
      if (response.ok) {
        message.success(
          editingCourse 
            ? 'Курс успешно обновлен' 
            : 'Курс успешно добавлен'
        );
        setModalVisible(false);
        form.resetFields();
        fetchCourses();
      } else {
        if (errorData.errors) {
          const errorMessages = Object.entries(errorData.errors)
            .map(([field, errors]) => `${field}: ${(errors as string[]).join(', ')}`)
            .join('\n');
          
          message.error(`Ошибка валидации: ${errorMessages}`);
          console.error('Validation errors:', errorData.errors);
        } else {
          message.error(errorData.message || errorData.title || 'Не удалось сохранить курс');
          console.error('Error response:', errorData);
        }
      }
    } catch (error) {
      console.error('Error saving course:', error);
      message.error('Произошла ошибка при сохранении данных');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/Courses/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        message.success('Курс успешно удален');
        fetchCourses();
      } else {
        const responseText = await response.text();
        console.error('Ошибка при удалении курса:', responseText);
        
        let errorMessage = 'Не удалось удалить курс';
        
        if (responseText && responseText.trim() !== '') {
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorData.title || errorMessage;
          } catch (parseError) {
            console.error('Ошибка при парсинге JSON:', parseError);
            errorMessage = responseText || errorMessage;
          }
        }
        
        message.error(errorMessage);
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      message.error('Произошла ошибка при удалении данных');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: CourseStatus) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/Courses/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
        credentials: 'include',
      });

      if (response.ok) {
        message.success('Статус курса успешно изменен');
        fetchCourses();
      } else {
        const errorData = await response.json();
        message.error(errorData.message || 'Не удалось изменить статус курса');
      }
    } catch (error) {
      console.error('Error updating course status:', error);
      message.error('Произошла ошибка при изменении статуса');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    
    const timesOfTaking = course.timesOfTaking.map((timeStr: any) => {
      let hours = 0;
      let minutes = 0;
      
      try {
        if (typeof timeStr === 'string') {
          if (timeStr.includes('T')) {
            const date = new Date(timeStr);
            hours = date.getHours();
            minutes = date.getMinutes();
          } else {
            const parts = timeStr.split(':');
            hours = parseInt(parts[0], 10);
            minutes = parseInt(parts[1], 10);
          }
        } else if (timeStr instanceof Date) {
          hours = timeStr.getHours();
          minutes = timeStr.getMinutes();
        }
      } catch (e) {
        console.error('Ошибка при парсинге времени:', timeStr, e);
      }
      
      return dayjs().hour(hours).minute(minutes);
    });
    
    form.setFieldsValue({
      name: course.name,
      description: course.description,
      timesOfTaking: timesOfTaking,
      dateRange: [dayjs(course.startDate), dayjs(course.endDate)],
      medicineId: course.medicineId,
      intakeFrequency: course.intakeFrequency
    });
    
    setModalVisible(true);
  };

  const handleAdd = () => {
    if (medicines.length === 0) {
      modal.confirm({
        title: 'Нет доступных лекарств',
        content: 'Для создания курса необходимо сначала добавить хотя бы одно лекарство. Хотите перейти на страницу добавления лекарств?',
        okText: 'Да, перейти',
        cancelText: 'Нет',
        onOk: () => router.push('/medicines')
      });
      return;
    }
    
    setEditingCourse(null);
    form.resetFields();
    
    form.setFieldsValue({
      timesOfTaking: [dayjs().hour(9).minute(0)], 
      dateRange: [dayjs(), dayjs().add(7, 'day')], 
      intakeFrequency: IntakeFrequency.Daily,
      medicineId: medicines[0]?.id 
    });
    
    setModalVisible(true);
  };

  const getStatusColor = (status: CourseStatus) => {
    switch (status) {
      case CourseStatus.Active:
        return 'green';
      case CourseStatus.Planned:
        return 'blue';
      case CourseStatus.Completed:
        return 'purple';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: CourseStatus) => {
    switch (status) {
      case CourseStatus.Active:
        return 'Активный';
      case CourseStatus.Planned:
        return 'Запланирован';
      case CourseStatus.Completed:
        return 'Завершен';
      default:
        return status;
    }
  };

  const getFrequencyLabel = (frequency: IntakeFrequency) => {
    switch (frequency) {
      case IntakeFrequency.Daily:
        return 'Ежедневно';
      case IntakeFrequency.Weekly:
        return 'Еженедельно';
      case IntakeFrequency.Monthly:
        return 'Ежемесячно';
      default:
        return frequency;
    }
  };

  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Лекарство',
      dataIndex: 'medicineName',
      key: 'medicineName',
    },
    {
      title: 'Период',
      key: 'period',
      render: (_: any, course: Course) => `${dayjs.utc(course.startDate).format('DD.MM.YYYY')} - ${dayjs.utc(course.endDate).format('DD.MM.YYYY')}`,
      sorter: (a: Course, b: Course) => dayjs(a.startDate).unix() - dayjs(b.startDate).unix(),
    },
    {
      title: 'Приемов в день',
      dataIndex: 'timesADay',
      key: 'timesADay',
    },
    {
      title: 'Частота',
      dataIndex: 'intakeFrequency',
      key: 'intakeFrequency',
      render: (frequency: IntakeFrequency) => getFrequencyLabel(frequency),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: CourseStatus) => <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>,
      sorter: (a: Course, b: Course) => a.status.localeCompare(b.status),
      filters: Object.values(CourseStatus).map(status => ({ text: getStatusLabel(status), value: status })),
      onFilter: (value: Key | boolean, record: Course) => record.status === value,
      filteredValue: statusFilter ? [statusFilter] : null,
    },
    {
      title: 'Принято / Пропущено',
      dataIndex: 'doses',
      key: 'doses',
      render: (_: any, course: Course) => `${course.takenDosesCount} / ${course.skippedDosesCount}`,
      sorter: (a: Course, b: Course) => (a.takenDosesCount + a.skippedDosesCount) - (b.takenDosesCount + b.skippedDosesCount),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: Course) => (
        <Space size="middle" wrap>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            Редактировать
          </Button>
          
          <Button
            type="primary"
            onClick={() => router.push(`/courses/${record.id}`)}
          >
            Приемы
          </Button>
          
          {record.status === CourseStatus.Planned && (
            <Button 
              type="primary" 
              style={{ backgroundColor: 'green' }}
              onClick={() => handleStatusChange(record.id, CourseStatus.Active)}
            >
              Начать
            </Button>
          )}
          
          {record.status === CourseStatus.Active && (
            <Button 
              type="primary" 
              style={{ backgroundColor: 'purple' }}
              onClick={() => handleStatusChange(record.id, CourseStatus.Completed)}
            >
              Завершить
            </Button>
          )}
          
          <Popconfirm
            title="Удалить курс?"
            description="Вы уверены, что хотите удалить этот курс?"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button type="primary" danger icon={<DeleteOutlined />}>
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const backgroundColor = theme === 'dark' ? 'var(--secondary-color)' : '#f0f2f5';

  return (
    <div style={{ height: '100%' }}>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '20px' }}>
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAdd}
            >
              Добавить курс
            </Button>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchCourses}
            >
              Обновить
            </Button>
          </Space>
        </div>
        
        {/* Панель фильтров */}
        <Card style={{ marginBottom: '20px' }}>
          <Row gutter={[16, 16]} align="bottom">
            <Col xs={24} sm={12} md={10}>
              <Text>Поиск по названию:</Text>
              <Input.Search
                placeholder="Введите текст для поиска"
                allowClear
                value={searchText}
                onChange={handleSearchChange}
                onSearch={(value) => setSearchText(value)}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Text>Фильтр по статусу:</Text>
              <Select
                allowClear
                placeholder="Все статусы"
                value={statusFilter}
                onChange={handleStatusFilterChange}
                style={{ width: '100%' }}
              >
                <Option value={CourseStatus.Planned}>{getStatusLabel(CourseStatus.Planned)}</Option>
                <Option value={CourseStatus.Active}>{getStatusLabel(CourseStatus.Active)}</Option>
                <Option value={CourseStatus.Completed}>{getStatusLabel(CourseStatus.Completed)}</Option>
              </Select>
            </Col>
            <Col xs={24} sm={24} md={6}>
              <Button 
                icon={<FilterOutlined />} 
                onClick={resetCourseFilters} 
                style={{ width: '100%' }}
              >
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
          <ResponsiveTable<Course>
            columns={columns} 
            dataSource={filteredCourses} 
            rowKey="id" 
            pagination={{ pageSize: 10 }}
          />
        )}
      </div>

      {/* Модальное окно для создания/редактирования курса */}
      <Modal
        title={editingCourse ? 'Редактировать курс' : 'Добавить новый курс'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Название курса"
            rules={[{ required: true, message: 'Пожалуйста, введите название курса' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Описание"
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          
          <Form.Item
            name="medicineId"
            label="Лекарство"
            rules={[{ required: true, message: 'Пожалуйста, выберите лекарство' }]}
          >
            <Select>
              {medicines.map(medicine => (
                <Option key={medicine.id} value={medicine.id}>{medicine.name}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="dateRange"
            label="Период приема"
            rules={[{ required: true, message: 'Пожалуйста, выберите период приема' }]}
          >
            <RangePicker 
              style={{ width: '100%' }}
              format="DD.MM.YYYY"
            />
          </Form.Item>
          
          <Form.Item
            name="intakeFrequency"
            label="Частота приема"
            rules={[{ required: true, message: 'Пожалуйста, выберите частоту приема' }]}
          >
            <Select>
              <Option value={IntakeFrequency.Daily}>Ежедневно</Option>
              <Option value={IntakeFrequency.Weekly}>Еженедельно</Option>
              <Option value={IntakeFrequency.Monthly}>Ежемесячно</Option>
            </Select>
          </Form.Item>
          
          <Form.List
            name="timesOfTaking"
            rules={[
              {
                validator: async (_, times) => {
                  if (!times || times.length === 0) {
                    return Promise.reject(new Error('Добавьте хотя бы одно время приема'));
                  }
                },
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <Text>Время приема</Text>
                  <Button
                    type="dashed"
                    onClick={() => add(dayjs('12:00:00', 'HH:mm:ss'))}
                    icon={<PlusOutlined />}
                  >
                    Добавить время
                  </Button>
                </div>
                {fields.map((field, index) => (
                  <Form.Item
                    required={false}
                    key={field.key}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Form.Item
                        {...field}
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                          {
                            required: true,
                            message: 'Пожалуйста, укажите время приема',
                          },
                        ]}
                        noStyle
                      >
                        <TimePicker format="HH:mm" style={{ width: '100%' }} />
                      </Form.Item>
                      {fields.length > 1 ? (
                        <Button
                          type="text"
                          danger
                          className="dynamic-delete-button"
                          onClick={() => remove(field.name)}
                          style={{ marginLeft: '8px' }}
                        >
                          Удалить
                        </Button>
                      ) : null}
                    </div>
                  </Form.Item>
                ))}
                <Form.ErrorList errors={errors} />
              </>
            )}
          </Form.List>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingCourse ? 'Сохранить' : 'Добавить'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>Отмена</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CoursesPage; 