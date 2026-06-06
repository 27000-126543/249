
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, Row, Col, Statistic, Tag, Button, Space, Select, Modal, Form, message, Progress } from 'antd';
import { ThunderboltOutlined, CheckCircleOutlined, LockOutlined, ClockCircleOutlined, CarOutlined, BulbOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ChargingPile, PileStatus } from '@/types';
import { mockChargingPiles, mockBuses } from '@/services/mock/data';
import { checkAndReleaseExpiredLocks, lockChargingPile, recommendChargingPile } from '@/utils/businessAlgorithms';

const Charging: React.FC = () => {
  const [piles, setPiles] = useState<ChargingPile[]>(mockChargingPiles);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedPile, setSelectedPile] = useState<ChargingPile | null>(null);
  const [recommendModalVisible, setRecommendModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [recommendForm] = Form.useForm();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [, forceUpdate] = useState({});

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setPiles(prev => checkAndReleaseExpiredLocks(prev));
      forceUpdate({});
    }, 30000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const statusMap: Record<string, { color: string; text: string; bgColor: string }> = {
    idle: { color: 'green', text: '空闲', bgColor: 'bg-green-500' },
    occupied: { color: 'blue', text: '充电中', bgColor: 'bg-blue-500' },
    locked: { color: 'orange', text: '已锁定', bgColor: 'bg-orange-500' },
    faulty: { color: 'red', text: '故障', bgColor: 'bg-red-500' },
  };

  const filteredPiles = useMemo(() => {
    return piles.filter(p => {
      if (typeFilter !== 'all' && p.type !== typeFilter) return false;
      return true;
    });
  }, [piles, typeFilter]);

  const handleLock = (pile: ChargingPile) => {
    const result = lockChargingPile(piles, pile.id, 'manual');
    if (result.success) {
      setPiles(result.piles);
      message.success('桩位已锁定，15分钟内有效，请及时插枪充电');
    } else {
      message.error(result.message || '锁定失败');
    }
  };

  const handleRelease = (pile: ChargingPile) => {
    const newPiles: ChargingPile[] = piles.map(p =>
      p.id === pile.id ? { ...p, status: 'idle' as PileStatus, lockedBy: undefined, lockedUntil: undefined } : p
    );
    setPiles(newPiles);
    message.success('桩位已释放');
  };

  const handleAssign = () => {
    form.validateFields().then(values => {
      if (selectedPile) {
        const newPiles: ChargingPile[] = piles.map(p =>
          p.id === selectedPile.id
            ? { ...p, status: 'occupied' as PileStatus, currentBusId: values.busId, lockedBy: undefined, lockedUntil: undefined }
            : p
        );
        setPiles(newPiles);
        setAssignModalVisible(false);
        form.resetFields();
        message.success('车辆分配成功，开始充电');
      }
    });
  };

  const handleSmartRecommend = () => {
    recommendForm.validateFields().then(values => {
      const bus = mockBuses.find(b => b.id === values.busId);
      if (!bus) return;

      const recommended = recommendChargingPile(piles, bus.type as any, bus.batteryLevel || 50);
      if (recommended) {
        const result = lockChargingPile(piles, recommended.id, bus.id);
        if (result.success) {
          setPiles(result.piles);
          setRecommendModalVisible(false);
          recommendForm.resetFields();
          message.success(`已为您推荐并锁定 ${recommended.name}，请在15分钟内插枪充电`);
        }
      } else {
        message.warning('暂无空闲充电桩，请稍后再试');
      }
    });
  };

  const getRemainingLockMinutes = (pile: ChargingPile) => {
    if (pile.status !== 'locked' || !pile.lockedUntil) return 0;
    const remaining = dayjs(pile.lockedUntil).diff(dayjs(), 'minute');
    return Math.max(0, remaining);
  };

  const idleFastPiles = piles.filter(p => p.status === 'idle' && p.type === 'fast').length;
  const idleSlowPiles = piles.filter(p => p.status === 'idle' && p.type === 'slow').length;
  const chargingPiles = piles.filter(p => p.status === 'occupied').length;
  const faultyPiles = piles.filter(p => p.status === 'faulty').length;
  const lockedPiles = piles.filter(p => p.status === 'locked').length;

  return (
    <div className="space-y-6">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="gradient-card">
            <Statistic
              title="快充桩空闲"
              value={idleFastPiles}
              suffix={`/ ${piles.filter(p => p.type === 'fast').length}`}
              prefix={<ThunderboltOutlined className="text-blue-400" />}
              valueStyle={{ color: '#60a5fa' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="gradient-card">
            <Statistic
              title="慢充桩空闲"
              value={idleSlowPiles}
              suffix={`/ ${piles.filter(p => p.type === 'slow').length}`}
              valueStyle={{ color: '#34d399' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="gradient-card">
            <Statistic
              title="充电中 / 锁定"
              value={chargingPiles}
              suffix={`/ ${lockedPiles}`}
              valueStyle={{ color: '#fbbf24' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="gradient-card">
            <Statistic
              title="故障桩"
              value={faultyPiles}
              valueStyle={{ color: faultyPiles > 0 ? '#f87171' : '#9ca3af' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="充电桩状态实时监控"
        extra={
          <Space>
            <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 140 }}>
              <Select.Option value="all">全部类型</Select.Option>
              <Select.Option value="fast">快充桩</Select.Option>
              <Select.Option value="slow">慢充桩</Select.Option>
            </Select>
            <Button type="primary" icon={<BulbOutlined />} onClick={() => setRecommendModalVisible(true)}>
              智能分配桩位
            </Button>
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          {filteredPiles.map(pile => {
            const currentBus = mockBuses.find(b => b.id === pile.currentBusId);
            const remainingMinutes = getRemainingLockMinutes(pile);
            const lockProgress = pile.status === 'locked' ? ((15 - remainingMinutes) / 15) * 100 : 0;

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
                      <div className="flex items-center gap-2 text-sm text-blue-700 mb-2">
                        <CarOutlined />
                        <span>{currentBus.plateNumber} 充电中</span>
                      </div>
                      <Progress percent={currentBus.batteryLevel || 0} size="small" strokeColor="#3b82f6" />
                      <div className="text-xs text-blue-600 mt-1">预计充满还需 {Math.ceil((100 - (currentBus.batteryLevel || 0)) * 0.8)} 分钟</div>
                    </div>
                  )}

                  {pile.status === 'locked' && (
                    <div className="bg-orange-50 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-orange-700 mb-2">
                        <LockOutlined />
                        <span>锁定中，剩余 {remainingMinutes} 分钟</span>
                      </div>
                      <Progress percent={lockProgress} size="small" strokeColor="#f97316" status="active" />
                      <div className="text-xs text-orange-600 mt-1">
                        <ClockCircleOutlined className="mr-1" />
                        超时将自动释放
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
                          const newPiles: ChargingPile[] = piles.map(p => p.id === pile.id ? { ...p, status: 'idle' as PileStatus, currentBusId: undefined } : p);
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

      <Modal
        title="智能推荐桩位"
        open={recommendModalVisible}
        onOk={handleSmartRecommend}
        onCancel={() => setRecommendModalVisible(false)}
        okText="智能分配"
      >
        <Form form={recommendForm} layout="vertical">
          <Form.Item name="busId" label="选择归场车辆" rules={[{ required: true, message: '请选择车辆' }]}>
            <Select placeholder="请选择需要充电的车辆">
              {mockBuses.filter(b => b.status === 'idle' && b.type === 'electric').map(bus => (
                <Select.Option key={bus.id} value={bus.id}>
                  {bus.plateNumber} - {bus.model} (电量: {bus.batteryLevel}%)
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700 space-y-1">
            <div><CheckCircleOutlined className="mr-2" />低电量车辆优先分配快充桩</div>
            <div><CheckCircleOutlined className="mr-2" />自动锁定桩位15分钟</div>
            <div><CheckCircleOutlined className="mr-2" />超时未插枪自动释放</div>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Charging;
