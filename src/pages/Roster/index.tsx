
import React, { useState } from 'react';
import { Card, Table, Tag, Button, Space, Select, Badge, Modal, Form, DatePicker, message, Statistic, Row, Col } from 'antd';
import { SwapOutlined, CalendarOutlined, PlusOutlined, CheckOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { RosterEntry, SchedulePlan } from '@/types';
import { mockRosterEntries, mockDrivers, mockRoutes, mockSchedulePlans } from '@/services/mock/data';
import { generateSmartRoster } from '@/utils/businessAlgorithms';

const Roster: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<RosterEntry[]>(mockRosterEntries);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form] = Form.useForm();

  const shiftTypeMap: Record<string, { color: string; text: string }> = {
    morning: { color: 'blue', text: '早班 (06:00-14:00)' },
    mid: { color: 'green', text: '中班 (10:00-18:00)' },
    evening: { color: 'purple', text: '晚班 (14:00-22:00)' },
    rest: { color: 'default', text: '休息' },
    leave: { color: 'red', text: '请假' },
  };

  const columns: ColumnsType<RosterEntry> = [
    {
      title: '驾驶员',
      dataIndex: 'driverId',
      key: 'driverId',
      render: (id) => {
        const driver = mockDrivers.find(d => d.id === id);
        return driver ? (
          <Space>
            <span className="font-medium">{driver.name}</span>
            <Tag color="blue">{driver.employeeNo}</Tag>
          </Space>
        ) : '-';
      },
    },
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
      title: '发车时间',
      dataIndex: 'departureTime',
      key: 'departureTime',
    },
    {
      title: '班次类型',
      dataIndex: 'shiftType',
      key: 'shiftType',
      render: (type) => <Tag color={shiftTypeMap[type]?.color}>{shiftTypeMap[type]?.text}</Tag>,
    },
    {
      title: '状态',
      key: 'status',
      dataIndex: 'status',
      render: (status) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          scheduled: { color: 'blue', text: '已排班' },
          completed: { color: 'green', text: '已完成' },
          cancelled: { color: 'red', text: '已取消' },
        };
        return <Badge status={statusMap[status]?.color as any} text={statusMap[status]?.text} />;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space size="small">
          <Button type="link" size="small" icon={<SwapOutlined />} onClick={() => navigate('/roster/swap')}>
            调班
          </Button>
        </Space>
      ),
    },
  ];

  const handleGenerateRoster = () => {
    setIsModalVisible(true);
  };

  const handleGenerateConfirm = () => {
    form.validateFields().then(values => {
      setGenerating(true);
      setTimeout(() => {
        const route = mockRoutes.find(r => r.id === values.routeId);
        const weekStart = dayjs(values.week).startOf('week');
        const plan = mockSchedulePlans.find(p => p.routeId === values.routeId) || mockSchedulePlans[0];

        if (!route || !plan) {
          message.error('未找到对应线路或计划');
          setGenerating(false);
          return;
        }

        const generatedRoster = generateSmartRoster({
          drivers: mockDrivers,
          schedulePlan: plan as SchedulePlan,
          route,
          weekStartDate: weekStart,
        });

        setData(generatedRoster);
        setIsModalVisible(false);
        setGenerating(false);
        message.success(`排班表生成成功！共生成 ${generatedRoster.length} 条排班记录`);
      }, 1500);
    });
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => selectedDate.startOf('week').add(i, 'day'));

  const getShiftCount = (day: dayjs.Dayjs, shiftType: string) => {
    return data.filter(d => dayjs(d.date).isSame(day, 'day') && d.shiftType === shiftType).length;
  };

  const stats = {
    totalDrivers: mockDrivers.filter(d => d.status === 'on').length,
    todayOnDuty: data.filter(d => dayjs(d.date).isSame(dayjs(), 'day') && d.shiftType !== 'rest').length,
    totalShifts: data.filter(d => dayjs(d.date).isSame(selectedDate, 'week')).length,
    avgHours: data.length > 0 ? Math.round(data.reduce((sum) => sum + 8, 0) / mockDrivers.length) : 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Space>
          <DatePicker
            value={selectedDate}
            onChange={(date) => date && setSelectedDate(date)}
            picker="week"
            style={{ width: 200 }}
          />
          <Select defaultValue="all" style={{ width: 140 }}>
            <Select.Option value="all">全部分公司</Select.Option>
            <Select.Option value="b1">城东分公司</Select.Option>
          </Select>
          <Select defaultValue="all" style={{ width: 140 }}>
            <Select.Option value="all">全部线路</Select.Option>
            <Select.Option value="r1">1路</Select.Option>
          </Select>
        </Space>
        <Space>
          <Button onClick={() => navigate('/roster/swap')}>调班申请</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleGenerateRoster}>
            生成排班表
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="在岗驾驶员"
              value={stats.todayOnDuty}
              suffix={`/ ${stats.totalDrivers}`}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#3b82f6' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="本周总班次"
              value={stats.totalShifts}
              suffix="班"
              valueStyle={{ color: '#8b5cf6' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="人均周工时"
              value={stats.avgHours}
              suffix="小时"
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="工时合规率"
              value={98.5}
              suffix="%"
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="本周排班概览" extra={<CalendarOutlined className="text-blue-500" />}>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, i) => (
            <div key={i} className={`p-3 rounded-lg text-center ${day.isSame(dayjs(), 'day') ? 'bg-blue-50 border-2 border-blue-500' : 'bg-slate-50'}`}>
              <div className="text-sm text-slate-500 mb-2">{day.format('MM-DD')}</div>
              <div className="text-xs text-slate-600 mb-3">{['周日', '周一', '周二', '周三', '周四', '周五', '周六'][day.day()]}</div>
              <div className="space-y-1">
                <div className="text-xs bg-blue-100 text-blue-700 rounded px-2 py-1">
                  早班 {getShiftCount(day, 'morning')} 人
                </div>
                <div className="text-xs bg-green-100 text-green-700 rounded px-2 py-1">
                  中班 {getShiftCount(day, 'mid')} 人
                </div>
                <div className="text-xs bg-purple-100 text-purple-700 rounded px-2 py-1">
                  晚班 {getShiftCount(day, 'evening')} 人
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="排班明细">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="智能生成排班表"
        open={isModalVisible}
        onOk={handleGenerateConfirm}
        onCancel={() => setIsModalVisible(false)}
        okText="确认生成"
        confirmLoading={generating}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="week" label="选择周次" rules={[{ required: true, message: '请选择周次' }]}>
            <DatePicker picker="week" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="routeId" label="线路" rules={[{ required: true, message: '请选择线路' }]}>
            <Select placeholder="请选择线路">
              {mockRoutes.map(route => (
                <Select.Option key={route.id} value={route.id}>{route.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700 space-y-2">
            <div><CheckOutlined className="mr-2" />驾驶员技能与线路资质自动匹配</div>
            <div><CheckOutlined className="mr-2" />每日工作时长合规（单日不超过8小时，每周不超过44小时）</div>
            <div><CheckOutlined className="mr-2" />连续工作不超过5天，强制休息间隔不少于12小时</div>
            <div><CheckOutlined className="mr-2" />工作量均衡分配，避免疲劳驾驶</div>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Roster;
