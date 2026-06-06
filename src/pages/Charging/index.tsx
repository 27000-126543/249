
import React, { useState } from 'react';
import { Card, Row, Col, Statistic, Tag, Button, Space, Select, Modal, Form, message, Progress } from 'antd';
import { ThunderboltOutlined, CheckCircleOutlined, LockOutlined, ClockCircleOutlined, CarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ChargingPile } from '@/types';
import { mockChargingPiles, mockBuses } from '@/services/mock/data';

const Charging: React.FC = () => {
  const [piles, setPiles] = useState<ChargingPile[]>(mockChargingPiles);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedPile, setSelectedPile] = useState<ChargingPile | null>(null);
  const [form] = Form.useForm();

  const statusMap: Record<string, { color: string; text: string; bgColor: string }> = {
    idle: { color: 'green', text: '空闲', bgColor: 'bg-green-500' },
    occupied: { color: 'blue', text: '使用中', bgColor: 'bg-blue-500' },
    locked: { color: 'orange', text: '已锁定', bgColor: 'bg-orange-500' },
    faulty: { color: 'red', text: '故障', bgColor: 'bg-red-500' },
  };

  const filteredPiles = piles.filter(p => {
    if (typeFilter !== 'all' && p.type !== typeFilter) return false;
    return true;
  });

  const handleLock = (pile: ChargingPile) => {
    const newPiles = piles.map(p => 
      p.id === pile.id 
        ? { ...p, status: 'locked' as const, lockedUntil: dayjs().add(15, 'minute').format(), lockedBy: 'system' }
        : p
    );
    setPiles(newPiles);
    message.success(`桩位已锁定15分钟，请在${dayjs().add(15, 'minute').format('HH:mm')}前插枪充电`);
  };

  const handleRelease = (pile: ChargingPile) => {
    const newPiles = piles.map(p => 
      p.id === pile.id ? { ...p, status: 'idle' as const, lockedBy: undefined, lockedUntil: undefined } : p
    );
    setPiles(newPiles);
    message.success('桩位已释放');
  };

  const handleAssign = () => {
    form.validateFields().then(values => {
      if (selectedPile) {
        const newPiles = piles.map(p => 
          p.id === selectedPile.id 
            ? { ...p, status: 'occupied' as const, currentBusId: values.busId, lockedBy: undefined, lockedUntil: undefined }
            : p
        );
        setPiles(newPiles);
        setAssignModalVisible(false);
        form.resetFields();
        message.success('车辆分配成功，开始充电');
      }
    });
  };

  const idleFastPiles = piles.filter(p => p.status === 'idle' && p.type === 'fast').length;
  const idleSlowPiles = piles.filter(p => p.status === 'idle' && p.type === 'slow').length;
  const occupiedPiles = piles.filter(p => p.status === 'occupied').length;
  const faultyPiles = piles.filter(p => p.status === 'faulty').length;

  return (
    <div className="space-y-6">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="快充桩空闲"
              value={idleFastPiles}
              suffix={`/ ${piles.filter(p => p.type === 'fast').length}`}
              prefix={<ThunderboltOutlined className="text-blue-500" />}
              valueStyle={{ color: '#3b82f6' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="慢充桩空闲"
              value={idleSlowPiles}
              suffix={`/ ${piles.filter(p => p.type === 'slow').length}`}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="充电中"
              value={occupiedPiles}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="故障桩"
              value={faultyPiles}
              valueStyle={{ color: faultyPiles > 0 ? '#ef4444' : '#6b7280' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="充电桩状态"
        extra={
          <Space>
            <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 140 }}>
              <Select.Option value="all">全部类型</Select.Option>
              <Select.Option value="fast">快充桩</Select.Option>
              <Select.Option value="slow">慢充桩</Select.Option>
            </Select>
            <Button type="primary" onClick={() => message.success('已为归场车辆推荐最优桩位')}>
              智能分配桩位
            </Button>
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          {filteredPiles.map(pile => {
            const currentBus = mockBuses.find(b => b.id === pile.currentBusId);
            return (
              <Col xs={24} sm={12} lg={8} key={pile.id}>
                <Card 
                  size="small" 
                  className={`hover:shadow-lg transition-all cursor-pointer ${pile.status === 'faulty' ? 'opacity-60' : ''}`}
                  styles={{ body: { padding: 16 } }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">{pile.name}</h4>
                      <div className="text-sm text-slate-500">{pile.location}</div>
                    </div>
                    <Tag color={statusMap[pile.status].color} className="!mt-0">
                      {statusMap[pile.status].text}
                    </Tag>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${pile.type === 'fast' ? 'bg-blue-100' : 'bg-emerald-100'}`}>
                      <ThunderboltOutlined className={`text-xl ${pile.type === 'fast' ? 'text-blue-500' : 'text-emerald-500'}`} />
                    </div>
                    <div>
                      <div className="font-medium">
                        {pile.type === 'fast' ? '直流快充' : '交流慢充'}
                      </div>
                      <div className="text-sm text-slate-500">功率 {pile.power}kW</div>
                    </div>
                  </div>

                  {pile.status === 'occupied' && currentBus && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-blue-700">
                        <CarOutlined />
                        <span>{currentBus.plateNumber} 充电中</span>
                      </div>
                      <Progress percent={currentBus.batteryLevel || 0} size="small" strokeColor="#3b82f6" className="mt-2" />
                    </div>
                  )}

                  {pile.status === 'locked' && pile.lockedUntil && (
                    <div className="bg-orange-50 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-orange-700">
                        <LockOutlined />
                        <span>锁定至 {dayjs(pile.lockedUntil).format('HH:mm')}</span>
                      </div>
                      <div className="text-xs text-orange-600 mt-1">
                        剩余 {Math.max(0, dayjs(pile.lockedUntil).diff(dayjs(), 'minute'))} 分钟
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {pile.status === 'idle' && (
                      <>
                        <Button 
                          type="primary" 
                          size="small" 
                          block
                          icon={<LockOutlined />}
                          onClick={() => handleLock(pile)}
                        >
                          锁定桩位
                        </Button>
                        <Button 
                          size="small" 
                          block
                          onClick={() => {
                            setSelectedPile(pile);
                            setAssignModalVisible(true);
                          }}
                        >
                          分配车辆
                        </Button>
                      </>
                    )}
                    {pile.status === 'locked' && (
                      <Button 
                        size="small" 
                        block
                        danger
                        onClick={() => handleRelease(pile)}
                      >
                        释放桩位
                      </Button>
                    )}
                    {pile.status === 'occupied' && (
                      <Button 
                        size="small" 
                        block
                        type="primary"
                        ghost
                        onClick={() => {
                          const newPiles = piles.map(p => p.id === pile.id ? { ...p, status: 'idle' as const, currentBusId: undefined } : p);
                          setPiles(newPiles);
                          message.success('充电完成，桩位已释放');
                        }}
                      >
                        结束充电
                      </Button>
                    )}
                    {pile.status === 'faulty' && (
                      <Button 
                        size="small" 
                        block
                        type="primary"
                        danger
                        ghost
                        onClick={() => message.info('已报修，维修人员将尽快处理')}
                      >
                        报修
                      </Button>
                    )}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>

      <Modal
        title="分配车辆充电"
        open={assignModalVisible}
        onOk={handleAssign}
        onCancel={() => setAssignModalVisible(false)}
        okText="确认分配"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="busId" label="选择车辆" rules={[{ required: true, message: '请选择车辆' }]}>
            <Select placeholder="请选择归场车辆">
              {mockBuses.filter(b => b.status === 'idle').map(bus => (
                <Select.Option key={bus.id} value={bus.id}>
                  {bus.plateNumber} - {bus.model} (电量: {bus.batteryLevel}%)
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <div className="bg-green-50 rounded-lg p-3 text-sm text-green-700">
            <CheckCircleOutlined className="mr-2" />
            预计充满时间：约45分钟
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Charging;
