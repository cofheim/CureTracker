import React from 'react';
import { Input, Select, DatePicker, Space, Button, Row, Col, Card } from 'antd';
import { SearchOutlined, FilterOutlined, ClearOutlined } from '@ant-design/icons';
import { Status } from '@/services/medicines';
import { getStatusLabel } from '@/utils/enumLocalization';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

export interface MedicineFilters {
  searchQuery: string;
  status: Status | null;
  dateRange: [Dayjs | null, Dayjs | null] | null;
}

interface MedicineFiltersProps {
  filters: MedicineFilters;
  onFiltersChange: (filters: MedicineFilters) => void;
  onResetFilters: () => void;
}

export const MedicineFilters: React.FC<MedicineFiltersProps> = ({
  filters,
  onFiltersChange,
  onResetFilters
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, searchQuery: e.target.value });
  };

  const handleStatusChange = (value: Status | null) => {
    onFiltersChange({ ...filters, status: value });
  };

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    onFiltersChange({ ...filters, dateRange: dates });
  };

  return (
    <Card style={{ marginBottom: '20px' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={8} lg={8} xl={8}>
          <Input
            placeholder="Поиск по названию или описанию"
            value={filters.searchQuery}
            onChange={handleSearchChange}
            prefix={<SearchOutlined />}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={7} lg={7} xl={7}>
          <Select
            placeholder="Статус лекарства"
            style={{ width: '100%' }}
            value={filters.status}
            onChange={handleStatusChange}
            allowClear
          >
            {Object.values(Status).map((status) => (
              <Option key={status} value={status}>
                {getStatusLabel(status)}
              </Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={12} md={7} lg={7} xl={7}>
          <RangePicker
            style={{ width: '100%' }}
            placeholder={['Дата начала', 'Дата окончания']}
            value={filters.dateRange}
            onChange={handleDateRangeChange}
            allowClear
          />
        </Col>
        <Col xs={24} sm={24} md={2} lg={2} xl={2}>
          <Button
            type="default"
            icon={<ClearOutlined />}
            onClick={onResetFilters}
            style={{ width: '100%' }}
          >
            Сбросить
          </Button>
        </Col>
      </Row>
    </Card>
  );
}; 