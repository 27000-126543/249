
import React, { useState } from 'react';
import { Table, Button, Space, Tag, Select, DatePicker, Card, Row, Col, Statistic, Progress } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SendOutlined, CarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { SchedulePlan } from '@/types';
import { mockSchedulePlans, mockRoutes } from '@/services/mock/data';

const { RangePicker } = DatePicker;

const Schedule: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<SchedulePlan[]>(mockSchedulePlans);
  const [routeFilter, setRouteFilter] = useState<string>();
  const [statusFilter, setStatusFilter] = useState<string>();

  const statusMap: Record<string, { color: string; text: string }> = {
    draft: { color: 'default', text: '草稿' },
    published: { color: 'blue', text: '已发布' },
    executing: { color: 'green', text: '执行中' },
    completed: { color: 'purple', text: '已完成' },
    cancelled: { color: 'red', text: '已作废' },
  };

  const timeSlotMap: Record<string, string> = {
    morning: '早高峰',
    noon: '午间',
    evening: '晚高峰',
    night: '夜间',
    all: '全天',
  };

  const columns: ColumnsType<SchedulePlan> = [
    {
      title: '线路',
      dataIndex: 'routeId',
      key: 'routeId',
      render: (id) => mockRoutes.find(r => r.id === id)?.name || '-',
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: (d) => dayjs(d).format('YYYY-MM-DD'),
    },
    {
      title: '时段',
      dataIndex: 'timeSlot',
      key: 'timeSlot',
      render: (slot) => timeSlotMap[slot],
    },
    {
      title: '运营时间',
      key: 'time',
      render: (_, record) => `${record.startTime} - ${record.endTime}`,
    },
    {
      title: '发车间隔',
      dataIndex: 'intervalMinutes',
      key: 'intervalMinutes',
      render: (min) => `${min} 分钟`,
    },
    {
      title: '配车数',
      dataIndex: 'busCount',
      key: 'busCount',
      render: (count) => `${count} 辆`,
    },
    {
      title: '预计满载率',
      key: 'loadRate',
      render: (_, record) => (
        <Progress percent={record.estimatedLoadRate} size="small" strokeColor="#3b82f6" />
      ),
    },
    {
      title: '预计准点率',
      key: 'onTimeRate',
      render: (_, record) => (
        <span className="text-emerald-600 font-medium">{record.estimatedOnTimeRate}%</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusMap[status].color}>{statusMap[status].text}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d) => dayjs(d).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>
          {record.status === 'draft' && (
            <Button type="link" size="small" icon={<SendOutlined />} className="!text-blue-500">发布</Button>
          )}
          {record.status === 'draft' && (
            <Button type="text" size="small" danger icon={<DeleteOutlined />}>作废</Button>
          )}
        </Space>
      ),
    },
  ];

  const filteredData = data.filter(item => {
    if (routeFilter && item.routeId !== routeFilter) return false;
    if (statusFilter && item.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="今日执行中计划"
              value={data.filter(d => d.status === 'executing').length}
              prefix={<CarOutlined className="text-blue-500" />}
              valueStyle={{ color: '#3b82f6' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已发布计划"
              value={data.filter(d => d.status === 'published').length}
              prefix={<ClockCircleOutlined className="text-emerald-500" />}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="草稿计划"
              value={data.filter(d => d.status === 'draft').length}
              valueStyle={{ color: '#6b7280' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="今日总班次"
              value={data.reduce((sum, d) => sum + d.trips.length, 0)}
              suffix="班"
              valueStyle={{ color: '#8b5cf6' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <Space wrap>
            <Select
              placeholder="选择线路"
              style={{ width: 160 }}
              allowClear
              value={routeFilter}
              onChange={setRouteFilter}
              options={mockRoutes.map(r => ({ label: r.name, value: r.id }))}
            />
            <Select
              placeholder="计划状态"
              style={{ width: 140 }}
              allowClear
              value={statusFilter}
              onChange={setStatusFilter}
              options={Object.entries(statusMap).map(([key, val]) => ({ label: val.text, value: key }))}
            />
            <RangePicker />
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/schedule/create')}>
            新建计划
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default Schedule;
