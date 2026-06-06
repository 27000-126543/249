
import React, { useState } from 'react';
import { Card, Form, Select, DatePicker, InputNumber, Button, Space, Row, Col, Statistic, Progress, Tag, message, Steps } from 'antd';
import { ArrowLeftOutlined, ThunderboltOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { mockRoutes, mockBuses } from '@/services/mock/data';
import { calculateScheduleRecommendation, type ScheduleRecommendation } from '@/utils/businessAlgorithms';
import type { Route } from '@/types';

const { Step } = Steps;
const { Option } = Select;

const timeSlotConfig: Record<string, { start: number; end: number; label: string }> = {
  morning: { start: 6, end: 9, label: '早高峰' },
  noon: { start: 9, end: 16, label: '午间' },
  evening: { start: 16, end: 19, label: '晚高峰' },
  night: { start: 19, end: 22, label: '夜间' },
  all: { start: 6, end: 22, label: '全天' },
};

const busTypes = [
  { value: 'electric', label: '纯电动', capacity: 80 },
  { value: 'hybrid', label: '混合动力', capacity: 75 },
  { value: 'diesel', label: '燃油', capacity: 70 },
];

const ScheduleCreate: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [current, setCurrent] = useState(0);
  const [recommendation, setRecommendation] = useState<ScheduleRecommendation | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(false);

  const timeSlots = [
    { value: 'morning', label: '早高峰 (06:00-09:00)' },
    { value: 'noon', label: '午间 (09:00-16:00)' },
    { value: 'evening', label: '晚高峰 (16:00-19:00)' },
    { value: 'night', label: '夜间 (19:00-22:00)' },
    { value: 'all', label: '全天 (06:00-22:00)' },
  ];

  const handleRouteChange = (routeId: string) => {
    const route = mockRoutes.find(r => r.id === routeId);
    setSelectedRoute(route || null);
  };

  const calculateRecommendation = () => {
    form.validateFields().then(values => {
      if (!selectedRoute) {
        message.error('请先选择线路');
        return;
      }

      setLoading(true);
      setTimeout(() => {
        const slotConfig = timeSlotConfig[values.timeSlot];
        const startTime = dayjs(values.date).hour(slotConfig.start).minute(0);
        const endTime = dayjs(values.date).hour(slotConfig.end).minute(0);

        const result = calculateScheduleRecommendation({
          routeId: values.routeId,
          startTime,
          endTime,
          intervalMinutes: values.intervalMinutes,
          busType: values.busType,
          route: selectedRoute,
          buses: mockBuses,
          trafficCondition: 'moderate',
        });

        setRecommendation(result);
        setLoading(false);
        setCurrent(1);
      }, 800);
    });
  };

  const handleSubmit = () => {
    message.success('行车计划创建成功！已自动生成驾驶员排班表');
    setTimeout(() => navigate('/schedule'), 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/schedule')}>
          返回列表
        </Button>
        <h2 className="text-xl font-bold text-slate-800">创建行车计划</h2>
      </div>

      <Steps current={current} className="mb-6">
        <Step title="基础信息" description="选择线路和参数" />
        <Step title="智能推荐" description="系统计算最优方案" />
        <Step title="确认发布" description="确认并发布计划" />
      </Steps>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="计划参数设置">
            <Form form={form} layout="vertical" initialValues={{ intervalMinutes: 10, date: dayjs() }}>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="routeId" label="选择线路" rules={[{ required: true, message: '请选择线路' }]}>
                    <Select placeholder="请选择线路" onChange={handleRouteChange}>
                      {mockRoutes.map(route => (
                        <Option key={route.id} value={route.id}>
                          {route.name} - 全程{route.distance}公里 / {route.duration}分钟
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="date" label="运营日期" rules={[{ required: true, message: '请选择日期' }]}>
                    <DatePicker style={{ width: '100%' }} disabledDate={(d) => d && d < dayjs().startOf('day')} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="timeSlot" label="运营时段" rules={[{ required: true, message: '请选择时段' }]}>
                    <Select placeholder="请选择时段" options={timeSlots} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="busType" label="车型选择" rules={[{ required: true, message: '请选择车型' }]}>
                    <Select placeholder="请选择车型">
                      {busTypes.map(bus => (
                        <Option key={bus.value} value={bus.value}>
                          {bus.label} (额定载客 {bus.capacity} 人)
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="intervalMinutes" label="发车间隔（分钟）" rules={[{ required: true, message: '请输入发车间隔' }]}>
                    <InputNumber min={3} max={30} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              {current === 0 && (
                <Form.Item>
                  <Button type="primary" size="large" loading={loading} onClick={calculateRecommendation}>
                    <ThunderboltOutlined /> 智能推荐发车方案
                  </Button>
                </Form.Item>
              )}
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          {recommendation && (
            <Card title="智能推荐结果" className="sticky top-6">
              <div className="space-y-6">
                <Row gutter={[12, 12]}>
                  <Col span={12}>
                    <Statistic title="推荐配车数" value={recommendation.busCount} suffix="辆" valueStyle={{ color: '#3b82f6' }} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="总班次" value={recommendation.totalTrips * 2} suffix="班" valueStyle={{ color: '#8b5cf6' }} />
                  </Col>
                </Row>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-600">预计满载率</span>
                    <span className="font-medium text-blue-600">{recommendation.estimatedLoadFactor}%</span>
                  </div>
                  <Progress percent={recommendation.estimatedLoadFactor} strokeColor="#3b82f6" />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-600">预计准点率</span>
                    <span className="font-medium text-emerald-600">{recommendation.estimatedOnTimeRate}%</span>
                  </div>
                  <Progress percent={recommendation.estimatedOnTimeRate} strokeColor="#10b981" />
                </div>

                <div>
                  <div className="text-slate-600 mb-2">推荐发车时刻（部分）</div>
                  <div className="flex flex-wrap gap-2">
                    {recommendation.departureTimes.slice(0, 8).map((time, i) => (
                      <Tag key={i} color="blue">{time}</Tag>
                    ))}
                    {recommendation.departureTimes.length > 8 && <Tag>...</Tag>}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <div className="text-sm text-blue-700">
                    <CheckCircleOutlined className="mr-2" />
                    基于历史客流和实时交通数据分析，此方案可满足约95%的出行需求
                  </div>
                </div>

                {current >= 1 && (
                  <Space className="w-full">
                    <Button onClick={() => setCurrent(0)}>返回修改</Button>
                    <Button type="primary" size="large" className="flex-1" onClick={handleSubmit}>
                      确认并发布计划
                    </Button>
                  </Space>
                )}
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default ScheduleCreate;
