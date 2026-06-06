
import React, { useState } from 'react';
import { Table, Button, Space, Tag, Card, Select, Modal, message, Descriptions } from 'antd';
import { CheckOutlined, ExclamationCircleOutlined, CarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { AlertEvent } from '@/types';
import { mockAlertEvents, mockBuses, mockRoutes } from '@/services/mock/data';

const Alerts: React.FC = () => {
  const [data, setData] = useState<AlertEvent[]>(mockAlertEvents);
  const [selectedRecord, setSelectedRecord] = useState<AlertEvent | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const alertTypeMap: Record<string, { color: string; text: string }> = {
    traffic_jam: { color: 'orange', text: '交通拥堵' },
    route_deviation: { color: 'red', text: '路线偏离' },
    overtime_stop: { color: 'blue', text: '超时停留' },
    speeding: { color: 'purple', text: '超速' },
    emergency: { color: 'red', text: '紧急事件' },
  };

  const severityMap: Record<string, { color: string; text: string }> = {
    low: { color: 'blue', text: '低' },
    medium: { color: 'orange', text: '中' },
    high: { color: 'red', text: '高' },
    critical: { color: 'red', text: '紧急' },
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    new: { color: 'red', text: '未处理' },
    acknowledged: { color: 'orange', text: '已确认' },
    resolved: { color: 'green', text: '已解决' },
  };

  const columns: ColumnsType<AlertEvent> = [
    {
      title: '告警类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color={alertTypeMap[type]?.color}>{alertTypeMap[type]?.text}</Tag>,
    },
    {
      title: '车辆',
      dataIndex: 'busId',
      key: 'busId',
      render: (id) => {
        const bus = mockBuses.find(b => b.id === id);
        return bus ? (
          <Space>
            <CarOutlined className="text-blue-500" />
            <span>{bus.plateNumber}</span>
          </Space>
        ) : id;
      },
    },
    {
      title: '线路',
      dataIndex: 'routeId',
      key: 'routeId',
      render: (id) => mockRoutes.find(r => r.id === id)?.name || '-',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (sev) => <Tag color={severityMap[sev]?.color}>{severityMap[sev]?.text}</Tag>,
    },
    {
      title: '发生时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.text}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => {
            setSelectedRecord(record);
            setDetailVisible(true);
          }}>详情</Button>
          {record.status === 'new' && (
            <Button type="text" size="small" icon={<CheckOutlined />} className="!text-green-500" onClick={() => handleAcknowledge(record)}>
              确认
            </Button>
          )}
          {record.status === 'acknowledged' && (
            <Button type="text" size="small" icon={<CheckOutlined />} className="!text-green-500" onClick={() => handleResolve(record)}>
              解决
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleAcknowledge = (record: AlertEvent) => {
    const newData = data.map(item => item.id === record.id ? { ...item, status: 'acknowledged' as const } : item);
    setData(newData);
    message.success('已确认告警');
  };

  const handleResolve = (record: AlertEvent) => {
    const newData = data.map(item => item.id === record.id ? { ...item, status: 'resolved' as const } : item);
    setData(newData);
    message.success('告警已解决');
  };

  const filteredData = data.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <Space wrap>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 140 }}
            >
              <Select.Option value="all">全部状态</Select.Option>
              <Select.Option value="new">未处理</Select.Option>
              <Select.Option value="acknowledged">已确认</Select.Option>
              <Select.Option value="resolved">已解决</Select.Option>
            </Select>
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: 140 }}
            >
              <Select.Option value="all">全部类型</Select.Option>
              {Object.entries(alertTypeMap).map(([key, val]) => (
                <Select.Option key={key} value={key}>{val.text}</Select.Option>
              ))}
            </Select>
          </Space>
          <Space>
            <Button onClick={() => message.info('已推送最近应急车辆')}>
              <ExclamationCircleOutlined /> 批量推送应急车辆
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="告警详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>,
          selectedRecord?.status === 'new' && (
            <Button key="ack" type="primary" onClick={() => {
              handleAcknowledge(selectedRecord);
              setDetailVisible(false);
            }}>确认告警</Button>
          ),
          selectedRecord?.status === 'acknowledged' && (
            <Button key="resolve" type="primary" onClick={() => {
              handleResolve(selectedRecord);
              setDetailVisible(false);
            }}>标记已解决</Button>
          ),
        ]}
        width={600}
      >
        {selectedRecord && (
          <div className="space-y-4">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="告警类型">
                <Tag color={alertTypeMap[selectedRecord.type]?.color}>{alertTypeMap[selectedRecord.type]?.text}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="严重程度">
                <Tag color={severityMap[selectedRecord.severity]?.color}>{severityMap[selectedRecord.severity]?.text}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="车辆">
                {mockBuses.find(b => b.id === selectedRecord.busId)?.plateNumber || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="线路">
                {mockRoutes.find(r => r.id === selectedRecord.routeId)?.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="发生时间">
                {dayjs(selectedRecord.timestamp).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="位置">
                {selectedRecord.lng.toFixed(6)}, {selectedRecord.lat.toFixed(6)}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[selectedRecord.status]?.color}>{statusMap[selectedRecord.status]?.text}</Tag>
              </Descriptions.Item>
            </Descriptions>
            <div>
              <div className="text-sm text-slate-500 mb-2">详细描述</div>
              <div className="bg-slate-50 rounded-lg p-3">{selectedRecord.description}</div>
            </div>
            {selectedRecord.nearestBusIds && selectedRecord.nearestBusIds.length > 0 && (
              <div>
                <div className="text-sm text-slate-500 mb-2">附近可调度应急车辆</div>
                <Space wrap>
                  {selectedRecord.nearestBusIds.map(id => {
                    const bus = mockBuses.find(b => b.id === id);
                    return bus ? <Tag key={id} color="blue">{bus.plateNumber}</Tag> : null;
                  })}
                </Space>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Alerts;
