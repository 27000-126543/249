
import React, { useState } from 'react';
import { Card, Table, Tag, Button, Space, Select, Badge, Modal, Form, DatePicker, message } from 'antd';
import { SwapOutlined, CalendarOutlined, PlusOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { RosterEntry } from '@/types';
import { mockRosterEntries, mockDrivers } from '@/services/mock/data';

const Roster: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<RosterEntry[]>(mockRosterEntries);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const shiftTypeMap: Record<string, { color: string; text: string }> = {
    morning: { color: 'blue', text: '早班 (06:00-14:00)' },
    middle: { color: 'green', text: '中班 (10:00-18:00)' },
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
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: (d) => dayjs(d).format('YYYY-MM-DD'),
    },
    {
      title: '班次类型',
      dataIndex: 'shiftType',
      key: 'shiftType',
      render: (type) => <Tag color={shiftTypeMap[type]?.color}>{shiftTypeMap[type]?.text}</Tag>,
    },
    {
      title: '工作时长',
      dataIndex: 'workHours',
      key: 'workHours',
      render: (hours) => `${hours} 小时`,
    },
    {
      title: '班次数量',
      dataIndex: 'tripIds',
      key: 'tripIds',
      render: (ids) => `${ids.length} 班`,
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => {
        const driver = mockDrivers.find(d => d.id === record.driverId);
        if (record.shiftType === 'rest' || record.shiftType === 'leave') {
          return <Badge status="default" text="休息中" />;
        }
        return driver?.status === 'on' ? <Badge status="success" text="在岗" /> : <Badge status="warning" text="未在岗" />;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
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
    form.validateFields().then(() => {
      setIsModalVisible(false);
      message.success('排班表生成成功！已根据驾驶员技能和工时合规自动分配');
    });
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => selectedDate.startOf('week').add(i, 'day'));

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

      <Card title="本周排班概览" extra={<CalendarOutlined className="text-blue-500" />}>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, i) => (
            <div key={i} className={`p-3 rounded-lg text-center ${day.isSame(dayjs(), 'day') ? 'bg-blue-50 border-2 border-blue-500' : 'bg-slate-50'}`}>
              <div className="text-sm text-slate-500 mb-2">{day.format('MM-DD')}</div>
              <div className="text-xs text-slate-600 mb-3">{['周日', '周一', '周二', '周三', '周四', '周五', '周六'][day.day()]}</div>
              <div className="space-y-1">
                {['早班', '中班', '晚班'].map((shift, j) => (
                  <div key={j} className="text-xs bg-white rounded px-2 py-1">
                    {Math.floor(Math.random() * 5) + 3} 人
                  </div>
                ))}
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
      >
        <Form form={form} layout="vertical">
          <Form.Item name="week" label="选择周次" rules={[{ required: true }]}>
            <DatePicker picker="week" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="routeId" label="线路" rules={[{ required: true }]}>
            <Select placeholder="请选择线路">
              <Select.Option value="r1">1路</Select.Option>
              <Select.Option value="r2">2路</Select.Option>
            </Select>
          </Form.Item>
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
            <CheckOutlined className="mr-2" />
            系统将根据驾驶员技能匹配、工时合规（连续工作不超过8小时）、工作量均衡等原则自动生成排班表
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Roster;
