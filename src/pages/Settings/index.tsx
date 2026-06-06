
import React, { useState } from 'react';
import { Card, Tabs, Table, Button, Space, Switch, Form, Input, Select, Modal, message, InputNumber, Tag } from 'antd';
import { UserOutlined, SettingOutlined, SafetyOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { User } from '@/types';
import { mockUsers, mockBranches } from '@/services/mock/data';
import { getRoleName } from '@/utils/permission';

const { TabPane } = Tabs;

const Settings: React.FC = () => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [paramModalVisible, setParamModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [paramForm] = Form.useForm();
  const [dispatchParams, setDispatchParams] = useState({
    peakInterval: 6,
    normalInterval: 12,
    maxWorkHours: 8,
    autoApproveHours: 24,
    repairEscalateHours: 48,
    chargingLockMinutes: 15,
  });

  const userColumns: ColumnsType<User> = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <UserOutlined className="text-blue-500" />
          </div>
          <span className="font-medium">{text}</span>
        </Space>
      ),
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => <Tag color={role === 'admin' ? 'purple' : role === 'manager' ? 'blue' : role === 'leader' ? 'green' : 'orange'}>{getRoleName(role)}</Tag>,
    },
    {
      title: '所属分公司',
      dataIndex: 'branchId',
      key: 'branchId',
      render: (id) => mockBranches.find(b => b.id === id)?.name || '-',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>
          {record.role !== 'admin' && (
            <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => {
              setUsers(users.filter(u => u.id !== record.id));
              message.success('用户已删除');
            }}>删除</Button>
          )}
        </Space>
      ),
    },
  ];

  const handleAddUser = () => {
    form.validateFields().then(values => {
      const newUser: User = {
        id: `u${Date.now()}`,
        ...values,
      };
      setUsers([...users, newUser]);
      setUserModalVisible(false);
      form.resetFields();
      message.success('用户添加成功');
    });
  };

  const handleSaveParams = () => {
    paramForm.validateFields().then(values => {
      setDispatchParams(values);
      setParamModalVisible(false);
      message.success('调度参数已保存');
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <Tabs defaultActiveKey="1">
          <TabPane tab={
            <span className="flex items-center gap-2">
              <UserOutlined />
              用户管理
            </span>
          } key="1">
            <div className="flex justify-end mb-4">
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setUserModalVisible(true)}>
                添加用户
              </Button>
            </div>
            <Table
              columns={userColumns}
              dataSource={users}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          <TabPane tab={
            <span className="flex items-center gap-2">
              <SettingOutlined />
              调度参数
            </span>
          } key="2">
            <div className="flex justify-end mb-4">
              <Button type="primary" onClick={() => {
                paramForm.setFieldsValue(dispatchParams);
                setParamModalVisible(true);
              }}>
                编辑参数
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card size="small">
                <div className="text-sm text-slate-500 mb-1">高峰时段发车间隔</div>
                <div className="text-xl font-bold text-slate-800">{dispatchParams.peakInterval} 分钟</div>
              </Card>
              <Card size="small">
                <div className="text-sm text-slate-500 mb-1">平峰时段发车间隔</div>
                <div className="text-xl font-bold text-slate-800">{dispatchParams.normalInterval} 分钟</div>
              </Card>
              <Card size="small">
                <div className="text-sm text-slate-500 mb-1">驾驶员最大连续工作时长</div>
                <div className="text-xl font-bold text-slate-800">{dispatchParams.maxWorkHours} 小时</div>
              </Card>
              <Card size="small">
                <div className="text-sm text-slate-500 mb-1">调班审批超时时间</div>
                <div className="text-xl font-bold text-slate-800">{dispatchParams.autoApproveHours} 小时</div>
                <div className="text-xs text-slate-400 mt-1">超时自动通过</div>
              </Card>
              <Card size="small">
                <div className="text-sm text-slate-500 mb-1">维修升级超时时间</div>
                <div className="text-xl font-bold text-slate-800">{dispatchParams.repairEscalateHours} 小时</div>
                <div className="text-xs text-slate-400 mt-1">超时升级设备部长</div>
              </Card>
              <Card size="small">
                <div className="text-sm text-slate-500 mb-1">充电桩锁定时长</div>
                <div className="text-xl font-bold text-slate-800">{dispatchParams.chargingLockMinutes} 分钟</div>
                <div className="text-xs text-slate-400 mt-1">超时自动释放</div>
              </Card>
            </div>
          </TabPane>

          <TabPane tab={
            <span className="flex items-center gap-2">
              <SafetyOutlined />
              审批规则
            </span>
          } key="3">
            <div className="space-y-4">
              <Card size="small" title="调班审批规则">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>两级审批（线路长 → 分公司经理）</span>
                    <Switch checked disabled />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>超时自动通过</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>超时时间</span>
                    <span className="text-blue-500 font-medium">24 小时</span>
                  </div>
                </div>
              </Card>
              <Card size="small" title="维修升级规则">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>超时自动升级到设备部长</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>升级时间</span>
                    <span className="text-orange-500 font-medium">48 小时</span>
                  </div>
                </div>
              </Card>
              <Card size="small" title="告警通知规则">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>车辆偏离路线弹窗提醒</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>长时间堵车自动检测</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>自动推送最近应急车辆</span>
                    <Switch defaultChecked />
                  </div>
                </div>
              </Card>
            </div>
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="添加用户"
        open={userModalVisible}
        onOk={handleAddUser}
        onCancel={() => setUserModalVisible(false)}
        okText="确认添加"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
            <Select placeholder="请选择角色">
              <Select.Option value="driver">驾驶员</Select.Option>
              <Select.Option value="leader">线路长</Select.Option>
              <Select.Option value="manager">分公司经理</Select.Option>
              <Select.Option value="admin">集团管理员</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="branchId" label="所属分公司" rules={[{ required: true, message: '请选择分公司' }]}>
            <Select placeholder="请选择分公司">
              {mockBranches.map(b => (
                <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input placeholder="请输入手机号" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑调度参数"
        open={paramModalVisible}
        onOk={handleSaveParams}
        onCancel={() => setParamModalVisible(false)}
        okText="保存"
      >
        <Form form={paramForm} layout="vertical">
          <Form.Item name="peakInterval" label="高峰时段发车间隔（分钟）">
            <InputNumber min={3} max={20} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="normalInterval" label="平峰时段发车间隔（分钟）">
            <InputNumber min={5} max={30} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="maxWorkHours" label="驾驶员最大连续工作时长（小时）">
            <InputNumber min={4} max={12} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="autoApproveHours" label="调班审批超时自动通过时间（小时）">
            <InputNumber min={1} max={72} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="repairEscalateHours" label="维修超时升级时间（小时）">
            <InputNumber min={12} max={120} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="chargingLockMinutes" label="充电桩锁定时长（分钟）">
            <InputNumber min={5} max={60} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Settings;
