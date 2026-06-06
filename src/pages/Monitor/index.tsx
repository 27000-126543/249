
import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Space, Select, Button, Badge, Modal, List, message } from 'antd';
import { CarOutlined, AlertOutlined, EnvironmentOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { Bus, AlertEvent } from '@/types';
import { mockBuses, mockAlertEvents, mockRoutes } from '@/services/mock/data';

const Monitor: React.FC = () => {
  const navigate = useNavigate();
  const [buses, setBuses] = useState<Bus[]>(mockBuses);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [routeFilter, setRouteFilter] = useState<string>('all');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setBuses(prev => prev.map(bus => {
        if (bus.status === 'running' && bus.currentLng && bus.currentLat) {
          return {
            ...bus,
            currentLng: bus.currentLng + (Math.random() - 0.5) * 0.002,
            currentLat: bus.currentLat + (Math.random() - 0.5) * 0.002,
          };
        }
        return bus;
      }));
    }, 3000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const statusMap: Record<string, { color: string; text: string }> = {
    running: { color: 'green', text: '运行中' },
    idle: { color: 'default', text: '空闲' },
    charging: { color: 'orange', text: '充电中' },
    repair: { color: 'red', text: '维修中' },
    maintenance: { color: 'purple', text: '保养中' },
  };

  const busTypeMap: Record<string, string> = {
    electric: '纯电动',
    hybrid: '混合动力',
    fuel: '燃油',
  };

  const columns: ColumnsType<Bus> = [
    {
      title: '车牌号',
      dataIndex: 'plateNumber',
      key: 'plateNumber',
      render: (text, record) => (
        <Space>
          <CarOutlined className="text-blue-500" />
          <span className="font-medium">{text}</span>
          {record.status === 'running' && <Badge status="processing" />}
        </Space>
      ),
    },
    {
      title: '车型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => busTypeMap[type],
    },
    {
      title: '当前线路',
      dataIndex: 'currentRouteId',
      key: 'currentRouteId',
      render: (id) => id ? mockRoutes.find(r => r.id === id)?.name : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={statusMap[status].color}>{statusMap[status].text}</Tag>,
    },
    {
      title: '电量/状态',
      key: 'battery',
      render: (_, record) => {
        if (record.type === 'electric' && record.batteryLevel !== undefined) {
          return (
            <Space>
              <span className={record.batteryLevel < 30 ? 'text-red-500' : 'text-slate-600'}>
                {record.batteryLevel}%
              </span>
              {record.batteryLevel < 30 && <ExclamationCircleOutlined className="text-red-500" />}
            </Space>
          );
        }
        return '-';
      },
    },
    {
      title: '位置',
      key: 'location',
      render: (_, record) => {
        if (record.currentLng && record.currentLat) {
          return (
            <span className="text-slate-500 text-sm">
              {record.currentLng.toFixed(4)}, {record.currentLat.toFixed(4)}
            </span>
          );
        }
        return '-';
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => setSelectedBus(record)}>
          查看详情
        </Button>
      ),
    },
  ];

  const filteredBuses = buses.filter(bus => {
    if (routeFilter === 'all') return true;
    return bus.currentRouteId === routeFilter;
  });

  const runningBuses = buses.filter(b => b.status === 'running');
  const activeAlerts = mockAlertEvents.filter(a => a.status === 'new');

  return (
    <div className="space-y-6">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="在途车辆"
              value={runningBuses.length}
              suffix={`/ ${buses.length}`}
              prefix={<CarOutlined className="text-blue-500" />}
              valueStyle={{ color: '#3b82f6' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="在线线路"
              value={mockRoutes.filter(r => buses.some(b => b.currentRouteId === r.id)).length}
              suffix={`/ ${mockRoutes.length}`}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="待处理告警"
              value={activeAlerts.length}
              prefix={<AlertOutlined />}
              valueStyle={{ color: activeAlerts.length > 0 ? '#ef4444' : '#6b7280' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="充电中车辆"
              value={buses.filter(b => b.status === 'charging').length}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title="实时车辆位置"
            extra={
              <Space>
                <Select
                  value={routeFilter}
                  onChange={setRouteFilter}
                  style={{ width: 140 }}
                >
                  <Select.Option value="all">全部线路</Select.Option>
                  {mockRoutes.map(r => (
                    <Select.Option key={r.id} value={r.id}>{r.name}</Select.Option>
                  ))}
                </Select>
                <Button onClick={() => navigate('/monitor/alerts')}>
                  <Badge count={activeAlerts.length} size="small">异常预警</Badge>
                </Button>
              </Space>
            }
          >
            <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg h-96 overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className="absolute w-full h-px bg-slate-400" style={{ top: `${i * 5}%` }} />
                ))}
                {[...Array(20)].map((_, i) => (
                  <div key={i} className="absolute h-full w-px bg-slate-400" style={{ left: `${i * 5}%` }} />
                ))}
              </div>
              {filteredBuses.filter(b => b.status === 'running' && b.currentLng && b.currentLat).map((bus, i) => (
                <div
                  key={bus.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-1000"
                  style={{
                    left: `${((bus.currentLng! - 116.4) / 0.15) * 100}%`,
                    top: `${((bus.currentLat! - 39.9) / 0.1) * 100}%`,
                  }}
                  onClick={() => setSelectedBus(bus)}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg ${
                    mockAlertEvents.some(a => a.busId === bus.id && a.status === 'new')
                      ? 'bg-red-500 animate-pulse'
                      : 'bg-blue-500'
                  }`}>
                    <CarOutlined />
                  </div>
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium bg-white px-2 py-0.5 rounded shadow">
                    {bus.plateNumber}
                  </div>
                </div>
              ))}
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg p-3 shadow">
                <div className="text-sm font-medium mb-2">图例</div>
                <div className="flex gap-4 text-xs">
                  <Space><div className="w-3 h-3 rounded-full bg-blue-500" />正常运行</Space>
                  <Space><div className="w-3 h-3 rounded-full bg-red-500" />异常告警</Space>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="最新告警" extra={<Button type="link" onClick={() => navigate('/monitor/alerts')}>查看全部</Button>}>
            <List
              dataSource={mockAlertEvents.slice(0, 5)}
              renderItem={(item) => (
                <List.Item className="!px-0">
                  <List.Item.Meta
                    avatar={
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        item.severity === 'high' || item.severity === 'critical' ? 'bg-red-100' : 'bg-orange-100'
                      }`}>
                        <AlertOutlined className={item.severity === 'high' || item.severity === 'critical' ? 'text-red-500' : 'text-orange-500'} />
                      </div>
                    }
                    title={
                      <Space>
                        <span>{item.description}</span>
                        {item.status === 'new' && <Badge status="error" text="新" />}
                      </Space>
                    }
                    description={
                      <Space size="middle" className="text-xs">
                        <span>{dayjs(item.timestamp).fromNow()}</span>
                        <span>车辆: {item.busId}</span>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card title="车辆列表">
        <Table
          columns={columns}
          dataSource={filteredBuses}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="车辆详情"
        open={!!selectedBus}
        onCancel={() => setSelectedBus(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedBus(null)}>关闭</Button>,
          selectedBus && mockAlertEvents.some(a => a.busId === selectedBus.id && a.status === 'new') && (
            <Button key="alert" type="primary" danger onClick={() => {
              message.info('已推送最近应急车辆前往支援');
              setSelectedBus(null);
            }}>
              推送应急车辆
            </Button>
          ),
        ]}
      >
        {selectedBus && (
          <div className="space-y-4">
            <Row gutter={16}>
              <Col span={12}>
                <div className="text-sm text-slate-500">车牌号</div>
                <div className="font-medium text-lg">{selectedBus.plateNumber}</div>
              </Col>
              <Col span={12}>
                <div className="text-sm text-slate-500">状态</div>
                <Tag color={statusMap[selectedBus.status].color}>{statusMap[selectedBus.status].text}</Tag>
              </Col>
              <Col span={12}>
                <div className="text-sm text-slate-500">车型</div>
                <div>{selectedBus.model}</div>
              </Col>
              <Col span={12}>
                <div className="text-sm text-slate-500">动力类型</div>
                <div>{busTypeMap[selectedBus.type]}</div>
              </Col>
              <Col span={12}>
                <div className="text-sm text-slate-500">额定载客</div>
                <div>{selectedBus.capacity} 人</div>
              </Col>
              {selectedBus.type === 'electric' && (
                <Col span={12}>
                  <div className="text-sm text-slate-500">当前电量</div>
                  <div className={selectedBus.batteryLevel && selectedBus.batteryLevel < 30 ? 'text-red-500 font-medium' : ''}>
                    {selectedBus.batteryLevel}%
                  </div>
                </Col>
              )}
              <Col span={12}>
                <div className="text-sm text-slate-500">当前线路</div>
                <div>{selectedBus.currentRouteId ? mockRoutes.find(r => r.id === selectedBus.currentRouteId)?.name : '无'}</div>
              </Col>
              {selectedBus.currentLng && selectedBus.currentLat && (
                <Col span={12}>
                  <div className="text-sm text-slate-500">当前位置</div>
                  <div className="flex items-center gap-1">
                    <EnvironmentOutlined className="text-blue-500" />
                    <span className="text-sm">{selectedBus.currentLng.toFixed(4)}, {selectedBus.currentLat.toFixed(4)}</span>
                  </div>
                </Col>
              )}
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Monitor;
