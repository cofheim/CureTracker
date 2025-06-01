import React, { useEffect, useState } from 'react';
import { List, Typography, Card, Tag, Spin, Empty } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import { API_BASE_URL } from '../../lib/apiConfig';
import dayjs from 'dayjs';
import { useTheme } from '../../lib/ThemeContext';

const { Title, Text } = Typography;

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

interface EntityActivityLogProps {
  entityType: 'medicine' | 'course' | 'intake';
  entityId: string;
  title?: string;
}

const EntityActivityLog: React.FC<EntityActivityLogProps> = ({ entityType, entityId, title }) => {
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { theme } = useTheme();

  useEffect(() => {
    if (entityId) {
      fetchEntityLogs();
    }
  }, [entityType, entityId]);

  const fetchEntityLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/ActionLogs/${entityType}/${entityId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      } else {
        console.error('Failed to fetch logs:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching entity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return dayjs(timestamp).format('DD.MM.YYYY HH:mm:ss');
  };

  return (
    <Card 
      title={
        <div>
          <HistoryOutlined style={{ marginRight: '8px', color: 'var(--primary-color)' }} />
          {title || 'История действий'}
        </div>
      }
      style={{ marginTop: '20px' }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin />
        </div>
      ) : logs.length > 0 ? (
        <List
          dataSource={logs}
          renderItem={(log) => (
            <List.Item>
              <List.Item.Meta
                title={log.description}
                description={
                  <Text type="secondary">
                    {formatTimestamp(log.timestamp)}
                  </Text>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty description="Нет данных о действиях" />
      )}
    </Card>
  );
};

export default EntityActivityLog; 