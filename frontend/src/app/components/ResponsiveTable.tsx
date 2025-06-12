'use client';

import React from 'react';
import { Table, Card, List, Grid, Empty } from 'antd';
import type { TableProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import styles from './ResponsiveTable.module.css';

const { useBreakpoint } = Grid;

interface ResponsiveTableProps<T extends object> extends TableProps<T> {
    renderItem?: (item: T) => React.ReactNode;
}

const ResponsiveTable = <T extends object>({
    columns,
    dataSource,
    renderItem,
    loading,
    ...rest
}: ResponsiveTableProps<T>) => {
    const screens = useBreakpoint();
    const isMobile = screens.md === false;

    if (isMobile) {
        if (!dataSource || dataSource.length === 0) {
            return <Empty description="Нет данных" />;
        }

        return (
            <List
                loading={loading}
                grid={{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 }}
                dataSource={dataSource ? [...dataSource] : []}
                renderItem={(item) => (
                    <List.Item>
                        {renderItem ? (
                            renderItem(item)
                        ) : (
                            <Card className={styles.card}>
                                {columns?.map((column) => {
                                    const col = column as ColumnsType<T>[number];
                                    
                                    if ('children' in col) {
                                        return null;
                                    }

                                    const dataIndex = col.dataIndex as keyof T;

                                    // Handle custom render
                                    if ('render' in col && typeof col.render === 'function') {
                                        let value = col.render(item[dataIndex], item, 0);
                                        
                                        if (typeof value === 'object' && value !== null && 'children' in value) {
                                            value = value.children;
                                        }

                                        // Avoid rendering empty/nullish action columns
                                        if (value === null || value === undefined) return null;

                                        return (
                                            <div key={col.key?.toString() || (dataIndex as string)} className={styles.cardRow}>
                                                <strong>{col.title as React.ReactNode}:</strong>
                                                <span>{value as React.ReactNode}</span>
                                            </div>
                                        );
                                    }

                                    // Handle nested dataIndex
                                    let value: any = item;
                                    if (Array.isArray(dataIndex)) {
                                        value = dataIndex.reduce((acc, cur) => acc && acc[cur], item);
                                    } else {
                                        value = item[dataIndex];
                                    }

                                    return (
                                        <div key={col.key?.toString() || (dataIndex as string)} className={styles.cardRow}>
                                            <strong>{col.title as React.ReactNode}:</strong>
                                            <span>{value as React.ReactNode}</span>
                                        </div>
                                    );
                                })}
                            </Card>
                        )}
                    </List.Item>
                )}
            />
        );
    }

    return <Table columns={columns} dataSource={dataSource} loading={loading} {...rest} />;
};

export default ResponsiveTable; 