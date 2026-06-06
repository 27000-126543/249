
import React, { useState } from 'react';
import { Table, Button, Space, Tag, Card, Modal, Form, Select, DatePicker, Input, message, Timeline, Badge } from 'antd';
import { PlusOutlined, CheckOutlined, CloseOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { SwapRequest, SwapRequestStatus } from '@/types';
import { mockSwapRequests, mockDrivers } from '@/services/mock/data';

const { TextArea } = Input;

const SwapRequests: React.FC = () => {
  const [data, setData] = useState<SwapRequest[]>(mockSwapRequests);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SwapRequest | null>(null);
  const [form] = Form.useForm();

  const statusMap: Record<string, { color: string; text: string }> = {
    pending: { color: 'orange', text: '待线路长审批' },
    leader_approved: { color: 'blue', text: '待分公司经理审批' },
    manager_approved: { color: 'green', text: '已通过' },
    rejected: { color: 'red', text: '已拒绝' },
    auto_approved: { color: 'purple', text: '超时自动通过' },
  };

  const columns: ColumnsType<SwapRequest> = [
    {
      title: '申请人',
      dataIndex: 'requesterId',
      key: 'requesterId',
      render: (id) => mockDrivers.find(d => d.id === id)?.name || '-',
    },
    {
      title: '调班日期',
      dataIndex: 'date',
      key: 'date',
      render: (d) => dayjs(d).format('YYYY-MM-DD'),
    },
    {
      title: '代班人',
      dataIndex: 'targetDriverId',
      key: 'targetDriverId',
      render: (id) => id ? mockDrivers.find(d => d.id === id)?.name || '-' : '待定',
    },
    {
      title: '申请原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d) => dayjs(d).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Space>
          <Tag color={statusMap[status].color}>{statusMap[status].text}</Tag>
          {status === 'pending' && (
            <Badge status="processing" text="24小时内处理" />
          )}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => {
            setSelectedRequest(record);
            setDetailModalVisible(true);
          }}>详情</Button>
          {record.status === 'pending' && (
            <>
              <Button type="text" size="small" icon={<CheckOutlined />} className="!text-green-500" onClick={() => handleApprove(record, 'leader')}>
                通过
              </Button>
              <Button type="text" size="small" danger icon={<CloseOutlined />} onClick={() => handleReject(record)}>
                拒绝
              </Button>
            </>
          )}
          {record.status === 'leader_approved' && (
            <>
              <Button type="text" size="small" icon={<CheckOutlined />} className="!text-green-500" onClick={() => handleApprove(record, 'manager')}>
                通过
              </Button>
              <Button type="text" size="small" danger icon={<CloseOutlined />} onClick={() => handleReject(record)}>
                拒绝
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const handleApprove = (record: SwapRequest, level: 'leader' | 'manager') => {
    const newData: SwapRequest[] = data.map(item => {
      if (item.id === record.id) {
        return {
          ...item,
          status: (level === 'leader' ? 'leader_approved' : 'manager_approved') as SwapRequestStatus,
          leaderApprovedAt: level === 'leader' ? dayjs().format() : item.leaderApprovedAt,
          managerApprovedAt: level === 'manager' ? dayjs().format() : item.managerApprovedAt,
        };
      }
      return item;
    });
    setData(newData);
    message.success('审批成功');
  };

  const handleReject = (record: SwapRequest) => {
    const newData = data.map(item => {
      if (item.id === record.id) {
        return { ...item, status: 'rejected' as const };
      }
      return item;
    });
    setData(newData);
    message.success('已拒绝申请');
  };

  const handleSubmit = () => {
    form.validateFields().then(values => {
      const newRequest: SwapRequest = {
        id: `swap${Date.now()}`,
        requesterId: 'd1',
        targetDriverId: values.targetDriverId,
        date: values.date.format('YYYY-MM-DD'),
        reason: values.reason,
        status: 'pending',
        createdAt: dayjs().format(),
      };
      setData([newRequest, ...data]);
      setIsModalVisible(false);
      form.resetFields();
      message.success('调班申请提交成功，等待审批');
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Space>
          <Select defaultValue="all" style={{ width: 140 }}>
            <Select.Option value="all">全部状态</Select.Option>
            <Select.Option value="pending">待审批</Select.Option>
            <Select.Option value="approved">已通过</Select.Option>
            <Select.Option value="rejected">已拒绝</Select.Option>
          </Select>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
          提交调班申请
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="提交调班申请"
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        okText="提交申请"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="date" label="调班日期" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker style={{ width: '100%' }} disabledDate={(d) => d && d < dayjs().startOf('day')} />
          </Form.Item>
          <Form.Item name="targetDriverId" label="选择代班人（可选）">
            <Select placeholder="选择代班驾驶员">
              {mockDrivers.map(d => (
                <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="reason" label="申请原因" rules={[{ required: true, message: '请输入原因' }]}>
            <TextArea rows={4} placeholder="请详细说明调班原因" />
          </Form.Item>
          <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-700">
            <ClockCircleOutlined className="mr-2" />
            提示：申请需经线路长和分公司经理两级审批，超过24小时未处理将自动通过
          </div>
        </Form>
      </Modal>

      <Modal
        title="调班申请详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>
        ]}
      >
        {selectedRequest && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-500">申请人</div>
                <div className="font-medium">{mockDrivers.find(d => d.id === selectedRequest.requesterId)?.name}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">调班日期</div>
                <div className="font-medium">{dayjs(selectedRequest.date).format('YYYY-MM-DD')}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">代班人</div>
                <div className="font-medium">{selectedRequest.targetDriverId ? mockDrivers.find(d => d.id === selectedRequest.targetDriverId)?.name : '待定'}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">当前状态</div>
                <Tag color={statusMap[selectedRequest.status].color}>{statusMap[selectedRequest.status].text}</Tag>
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-500 mb-2">申请原因</div>
              <div className="bg-slate-50 rounded-lg p-3">{selectedRequest.reason}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500 mb-3">审批流程</div>
              <Timeline
                items={[
                  { color: 'green', children: `申请提交 - ${dayjs(selectedRequest.createdAt).format('YYYY-MM-DD HH:mm')}` },
                  selectedRequest.leaderApprovedAt || selectedRequest.status !== 'pending'
                    ? { color: 'green', children: `线路长审批${selectedRequest.status === 'rejected' ? '拒绝' : '通过'} - ${dayjs(selectedRequest.leaderApprovedAt || selectedRequest.createdAt).format('YYYY-MM-DD HH:mm')}` }
                    : { color: 'blue', children: '待线路长审批（24小时内自动通过）' },
                  selectedRequest.managerApprovedAt || (selectedRequest.status as string) === 'manager_approved'
                    ? { color: 'green', children: `分公司经理审批通过 - ${dayjs(selectedRequest.managerApprovedAt || selectedRequest.createdAt).format('YYYY-MM-DD HH:mm')}` }
                    : (selectedRequest.status as string) === 'leader_approved' || (selectedRequest.status as string) === 'auto_approved'
                    ? { color: 'blue', children: '待分公司经理审批（24小时内自动通过）' }
                    : { children: '待分公司经理审批' },
                ]}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SwapRequests;
