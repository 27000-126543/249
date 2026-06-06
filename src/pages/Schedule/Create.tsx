
import React, { useState } from 'react';
import { Card, Form, Select, DatePicker, InputNumber, Button, Space, Row, Col, Statistic, Progress, Tag, message, Steps } from 'antd';
import { ArrowLeftOutlined, ThunderboltOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { mockRoutes } from '@/services/mock/data';

const { Step } = Steps;
const { Option } = Select;

const ScheduleCreate: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [current, setCurrent] = useState(0);
  const [recommendation, setRecommendation] = useState<{
    busCount: number;
    estimatedLoadRate: number;
    estimatedOnTimeRate: number;
    departureTimes: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const busTypes = [
    { value: 'electric', label: '纯电动', capacity: 80 },
    { value: 'hybrid', label: '混合动力', capacity: 75 },
    { value: 'fuel', label: '燃油', capacity: 70 },
  ];

  const timeSlots = [
    { value: 'morning', label: '早高峰 (06:00-09:00)' },
    { value: 'noon', label: '午间 (09:00-16:00)' },
    { value: 'evening', label: '晚高峰 (16:00-19:00)' },
    { value: 'night', label: '夜间 (19:00-22:00)' },
    { value: 'all', label: '全天 (06:00-22:00)' },
  ];

  const calculateRecommendation = () => {
    setLoading(true);
    setTimeout(() => {
      const interval = form.getFieldValue('intervalMinutes') || 10;
      const timeSlot = form.getFieldValue('timeSlot');
      let duration = 180;
      if (timeSlot === 'all') duration = 960;
      else if (timeSlot === 'noon') duration = 420;
      else if (timeSlot === 'night') duration = 180;

      const trips = Math.ceil(duration / interval);
      const busCount = Math.ceil(trips / 8);
      const loadFactor = 0.6 + Math.random() * 0.25;
      const onTimeFactor = 0.9 + Math.random() * 0.08;

      const startTime = timeSlot === 'morning' ? 6 : timeSlot === 'evening' ? 16 : timeSlot === 'night' ? 19 : timeSlot === 'all' ? 6 : 9;
      const departureTimes = Array.from({ length: Math.min(trips, 12) }, (_, i) => 
        dayjs().hour(startTime).minute(i * interval).format('HH:mm')
      );

      setRecommendation({
        busCount,
        estimatedLoadRate: Math.round(loadFactor * 100),
        estimatedOnTimeRate: Math.round(onTimeFactor * 100),
        departureTimes,
      });
      setLoading(false);
      setCurrent(1);
    }, 1000);
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
                    <Select placeholder="请选择线路">
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
                    <Statistic title="总班次" value={recommendation.departureTimes.length * 2} suffix="班" valueStyle={{ color: '#8b5cf6' }} />
                  </Col>
                </Row>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-600">预计满载率</span>
                    <span className="font-medium text-blue-600">{recommendation.estimatedLoadRate}%</span>
                  </div>
                  <Progress percent={recommendation.estimatedLoadRate} strokeColor="#3b82f6" />
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
                    {recommendation.departureTimes.map((time, i) => (
                      <Tag key={i} color="blue">{time}</Tag>
                    ))}
                    <Tag>...</Tag>
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
