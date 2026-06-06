
import React, { useState } from 'react';
import { Table, Button, Space, Tag, Card, Select, Modal, Form, Input, message, Timeline, Descriptions, Row, Col, Statistic } from 'antd';
import { PlusOutlined, ToolOutlined, WarningOutlined, CheckOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { RepairTicket } from '@/types';
import { mockRepairTickets, mockBuses } from '@/services/mock/data';

const { TextArea } = Input;

const Repair: React.FC = () => {
  const [data, setData] = useState<RepairTicket[]>(mockRepairTickets);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RepairTicket | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [form] = Form.useForm();

  const faultTypeMap: Record<string, { color: string; text: string }> = {
    engine: { color: 'red', text: '发动机' },
    electric: { color: 'blue', text: '电气系统' },
    brake: { color: 'orange', text: '制动系统' },
    tire: { color: 'green', text: '轮胎' },
    body: { color: 'purple', text: '车身' },
    other: { color: 'default', text: '其他' },
  };

  const severityMap: Record<string, { color: string; text: string }> = {
    minor: { color: 'blue', text: '轻微' },
    major: { color: 'orange', text: '较重' },
    critical: { color: 'red', text: '严重' },
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    new: { color: 'red', text: '待分配' },
    assigned: { color: 'blue', text: '已分配' },
    in_progress: { color: 'orange', text: '维修中' },
    waiting_parts: { color: 'purple', text: '待物料' },
    completed: { color: 'green', text: '已完成' },
    escalated: { color: 'red', text: '已升级' },
  };

  const columns: ColumnsType<RepairTicket> = [
    {
      title: '工单编号',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '车辆',
      dataIndex: 'busId',
      key: 'busId',
      render: (id) => mockBuses.find(b => b.id === id)?.plateNumber || '-',
    },
    {
      title: '故障类型',
      dataIndex: 'faultType',
      key: 'faultType',
      render: (type) => <Tag color={faultTypeMap[type]?.color}>{faultTypeMap[type]?.text}</Tag>,
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (sev) => <Tag color={severityMap[sev]?.color}>{severityMap[sev]?.text}</Tag>,
    },
    {
      title: '故障描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Space>
          <Tag color={statusMap[status]?.color}>{statusMap[status]?.text}</Tag>
          {status === 'in_progress' && dayjs().diff(dayjs(selectedRecord?.createdAt || data[0].createdAt), 'hour') > 48 && (
            <Tag color="red" icon={<WarningOutlined />}>超时预警</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '报修时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm'),
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
            <Button type="text" size="small" icon={<ToolOutlined />} className="!text-blue-500" onClick={() => handleAssign(record)}>
              分配班组
            </Button>
          )}
          {record.status === 'in_progress' && (
            <Button type="text" size="small" icon={<CheckOutlined />} className="!text-green-500" onClick={() => handleComplete(record)}>
              完成维修
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleAssign = (record: RepairTicket) => {
    const newData = data.map(item => 
      item.id === record.id ? { ...item, status: 'in_progress' as const, startedAt: dayjs().format(), assignedTeamId: 'team1' } : item
    );
    setData(newData);
    message.success('已分配维修班组，物料领用单已生成');
  };

  const handleComplete = (record: RepairTicket) => {
    const newData = data.map(item => 
      item.id === record.id ? { ...item, status: 'completed' as const, completedAt: dayjs().format() } : item
    );
    setData(newData);
    message.success('维修完成，车辆状态已更新');
  };

  const handleSubmit = () => {
    form.validateFields().then(values => {
      const newTicket: RepairTicket = {
        id: `repair${Date.now()}`,
        busId: values.busId,
        reporterId: 'd1',
        faultType: values.faultType,
        description: values.description,
        severity: values.severity,
        status: 'new',
        materialList: [],
        createdAt: dayjs().format(),
      };
      setData([newTicket, ...data]);
      setIsModalVisible(false);
      form.resetFields();
      message.success('报修已提交，系统已推送至对应维修班组');
    });
  };

  const filteredData = data.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    return true;
  });

  const pendingCount = data.filter(d => d.status === 'new' || d.status === 'assigned').length;
  const inProgressCount = data.filter(d => d.status === 'in_progress').length;
  const completedCount = data.filter(d => d.status === 'completed').length;
  const escalatedCount = data.filter(d => d.status === 'escalated').length;

  return (
    <div className="space-y-6">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="待处理工单"
              value={pendingCount}
              prefix={<ClockCircleOutlined className="text-orange-500" />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="维修中"
              value={inProgressCount}
              valueStyle={{ color: '#3b82f6' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已完成"
              value={completedCount}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已升级"
              value={escalatedCount}
              valueStyle={{ color: escalatedCount > 0 ? '#ef4444' : '#6b7280' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <Space wrap>
            <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 140 }}>
              <Select.Option value="all">全部状态</Select.Option>
              <Select.Option value="new">待分配</Select.Option>
              <Select.Option value="in_progress">维修中</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
              <Select.Option value="escalated">已升级</Select.Option>
            </Select>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
            一键报修
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="一键报修"
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        okText="提交报修"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="busId" label="选择车辆" rules={[{ required: true, message: '请选择车辆' }]}>
            <Select placeholder="请选择故障车辆">
              {mockBuses.map(bus => (
                <Select.Option key={bus.id} value={bus.id}>{bus.plateNumber} - {bus.model}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="faultType" label="故障类型" rules={[{ required: true, message: '请选择故障类型' }]}>
            <Select placeholder="请选择故障类型">
              {Object.entries(faultTypeMap).map(([key, val]) => (
                <Select.Option key={key} value={key}>{val.text}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="severity" label="严重程度" rules={[{ required: true, message: '请选择严重程度' }]}>
            <Select placeholder="请选择严重程度">
              {Object.entries(severityMap).map(([key, val]) => (
                <Select.Option key={key} value={key}>{val.text}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="故障描述" rules={[{ required: true, message: '请描述故障情况' }]}>
            <TextArea rows={4} placeholder="请详细描述故障现象" />
          </Form.Item>
          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
            <CheckOutlined className="mr-2" />
            系统将根据故障类型自动推送至对应维修班组，并生成物料领用单。超过48小时未修好将自动升级到设备部长。
          </div>
        </Form>
      </Modal>

      <Modal
        title="工单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>,
        ]}
        width={700}
      >
        {selectedRecord && (
          <div className="space-y-6">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="工单编号">{selectedRecord.id}</Descriptions.Item>
              <Descriptions.Item label="车辆">
                {mockBuses.find(b => b.id === selectedRecord.busId)?.plateNumber}
              </Descriptions.Item>
              <Descriptions.Item label="故障类型">
                <Tag color={faultTypeMap[selectedRecord.faultType]?.color}>
                  {faultTypeMap[selectedRecord.faultType]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="严重程度">
                <Tag color={severityMap[selectedRecord.severity]?.color}>
                  {severityMap[selectedRecord.severity]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[selectedRecord.status]?.color}>
                  {statusMap[selectedRecord.status]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="报修时间">
                {dayjs(selectedRecord.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            <div>
              <div className="text-sm text-slate-500 mb-2">故障描述</div>
              <div className="bg-slate-50 rounded-lg p-3">{selectedRecord.description}</div>
            </div>

            {selectedRecord.materialList.length > 0 && (
              <div>
                <div className="text-sm text-slate-500 mb-2">物料领用单</div>
                <Table
                  size="small"
                  columns={[
                    { title: '物料名称', dataIndex: 'name', key: 'name' },
                    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
                    { title: '单位', dataIndex: 'unit', key: 'unit', width: 80 },
                    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (s) => s === 'issued' ? <Tag color="green">已出库</Tag> : <Tag color="orange">待出库</Tag> },
                  ]}
                  dataSource={selectedRecord.materialList}
                  rowKey="id"
                  pagination={false}
                />
              </div>
            )}

            <div>
              <div className="text-sm text-slate-500 mb-3">处理进度</div>
              <Timeline
                items={[
                  { color: 'green', children: `报修提交 - ${dayjs(selectedRecord.createdAt).format('YYYY-MM-DD HH:mm')}` },
                  selectedRecord.startedAt
                    ? { color: 'blue', children: `维修开始 - ${dayjs(selectedRecord.startedAt).format('YYYY-MM-DD HH:mm')}` }
                    : { color: 'gray', children: '待分配维修班组' },
                  selectedRecord.escalatedAt
                    ? { color: 'red', children: `已升级设备部长 - ${dayjs(selectedRecord.escalatedAt).format('YYYY-MM-DD HH:mm')}` }
                    : dayjs().diff(dayjs(selectedRecord.createdAt), 'hour') > 48
                    ? { color: 'red', children: '超时预警，即将升级' }
                    : { color: 'gray', children: '维修进行中（48小时内完成）' },
                  selectedRecord.completedAt
                    ? { color: 'green', children: `维修完成 - ${dayjs(selectedRecord.completedAt).format('YYYY-MM-DD HH:mm')}` }
                    : { color: 'gray', children: '待完成' },
                ]}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Repair;
