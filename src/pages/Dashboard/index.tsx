
import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Statistic, Progress, List, Tag, Space } from 'antd';
import {
  CarOutlined,
  TeamOutlined,
  UserOutlined,
  ThunderboltOutlined,
  AlertOutlined,
  ArrowUpOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import type { DashboardStats, HourlyPassenger, RouteOnTimeData } from '@/types';
import {
  getDashboardStats,
  getHourlyPassengers,
  getRouteOnTimeData,
  mockAlertEvents,
} from '@/services/mock/data';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>(getDashboardStats());
  const [hourlyData, setHourlyData] = useState<HourlyPassenger[]>(getHourlyPassengers());
  const [routeData, setRouteData] = useState<RouteOnTimeData[]>(getRouteOnTimeData());
  const [currentTime, setCurrentTime] = useState(dayjs().format('YYYY-MM-DD HH:mm:ss'));
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setStats(getDashboardStats());
      setHourlyData(getHourlyPassengers());
      setCurrentTime(dayjs().format('YYYY-MM-DD HH:mm:ss'));
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const passengerChartOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderColor: 'transparent',
      textStyle: { color: '#fff' },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: hourlyData.map(d => `${d.hour}:00`),
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8' },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#1e293b' } },
    },
    series: [
      {
        name: '客流量',
        type: 'line',
        smooth: true,
        data: hourlyData.map(d => d.count),
        lineStyle: { width: 3, color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#3b82f6' },
            { offset: 1, color: '#06b6d4' },
          ],
        }},
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.4)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.02)' },
            ],
          },
        },
        itemStyle: { color: '#3b82f6' },
      },
    ],
  };

  const onTimeChartOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderColor: 'transparent',
      textStyle: { color: '#fff' },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: routeData.map(d => d.routeName),
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8' },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8', formatter: '{value}%' },
      splitLine: { lineStyle: { color: '#1e293b' } },
    },
    series: [
      {
        name: '准点率',
        type: 'bar',
        data: routeData.map(d => d.onTimeRate),
        barWidth: 32,
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#10b981' },
              { offset: 1, color: '#059669' },
            ],
          },
        },
      },
    ],
  };

  const busStatusData = [
    { value: stats.runningBuses, name: '运行中', itemStyle: { color: '#3b82f6' } },
    { value: 2, name: '充电中', itemStyle: { color: '#f59e0b' } },
    { value: 1, name: '维修中', itemStyle: { color: '#ef4444' } },
    { value: 1, name: '空闲', itemStyle: { color: '#6b7280' } },
    { value: 1, name: '保养中', itemStyle: { color: '#8b5cf6' } },
  ];

  const busStatusOption = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderColor: 'transparent',
      textStyle: { color: '#fff' },
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: '#94a3b8' },
    },
    series: [
      {
        name: '车辆状态',
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#0f172a',
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 16, fontWeight: 'bold', color: '#fff' },
        },
        labelLine: { show: false },
        data: busStatusData,
      },
    ],
  };

  const alertTypeColor: Record<string, string> = {
    traffic_jam: 'orange',
    route_deviation: 'red',
    overtime_stop: 'blue',
    speeding: 'purple',
    emergency: 'red',
  };

  const alertTypeName: Record<string, string> = {
    traffic_jam: '交通拥堵',
    route_deviation: '路线偏离',
    overtime_stop: '超时停留',
    speeding: '超速',
    emergency: '紧急事件',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-slate-800">运营数据大屏</h1>
        <div className="flex items-center gap-2 text-slate-500">
          <ClockCircleOutlined />
          <span className="font-mono">{currentTime}</span>
          <Tag color="green" className="animate-pulse">实时更新中</Tag>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card className="!bg-gradient-to-br !from-blue-500 !to-blue-600 !text-white !border-0 shadow-lg shadow-blue-500/20">
            <Statistic
              title={<span className="text-white/80">在途车辆</span>}
              value={stats.runningBuses}
              suffix={<span className="text-lg">/ {stats.totalBuses}</span>}
              prefix={<CarOutlined />}
              valueStyle={{ color: 'white' }}
            />
            <div className="mt-2 text-sm text-white/70">较昨日 <ArrowUpOutlined /> 3.2%</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card className="!bg-gradient-to-br !from-emerald-500 !to-emerald-600 !text-white !border-0 shadow-lg shadow-emerald-500/20">
            <Statistic
              title={<span className="text-white/80">线路准点率</span>}
              value={stats.onTimeRate.toFixed(1)}
              suffix="%"
              prefix={<TeamOutlined />}
              valueStyle={{ color: 'white' }}
            />
            <div className="mt-2 text-sm text-white/70">较昨日 <ArrowUpOutlined /> 1.5%</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card className="!bg-gradient-to-br !from-violet-500 !to-violet-600 !text-white !border-0 shadow-lg shadow-violet-500/20">
            <Statistic
              title={<span className="text-white/80">今日客流</span>}
              value={stats.todayPassengers}
              prefix={<UserOutlined />}
              valueStyle={{ color: 'white' }}
            />
            <div className="mt-2 text-sm text-white/70">较昨日 <ArrowUpOutlined /> 5.8%</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card className="!bg-gradient-to-br !from-amber-500 !to-amber-600 !text-white !border-0 shadow-lg shadow-amber-500/20">
            <Statistic
              title={<span className="text-white/80">充电桩占用率</span>}
              value={stats.chargingPileUsage}
              suffix="%"
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: 'white' }}
            />
            <div className="mt-2 text-sm text-white/70">空闲 4 / 共 6 个</div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={<span className="text-slate-800 font-medium">今日客流走势</span>}
            className="!bg-slate-900 !border-slate-800"
            styles={{ header: { borderBottom: '1px solid #1e293b' } }}
          >
            <ReactECharts option={passengerChartOption} style={{ height: 300 }} theme="dark" />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={<span className="text-slate-800 font-medium">驾驶员出勤</span>}
            className="h-full"
          >
            <div className="space-y-6 py-2">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-600">出勤率</span>
                  <span className="font-medium text-emerald-600">{stats.driverAttendance.toFixed(1)}%</span>
                </div>
                <Progress percent={Math.round(stats.driverAttendance)} strokeColor="#10b981" size="small" />
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-emerald-600">15</div>
                  <div className="text-sm text-slate-500">在岗</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-amber-600">2</div>
                  <div className="text-sm text-slate-500">休假</div>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={<span className="text-slate-800 font-medium">各线路准点率</span>}
            className="!bg-slate-900 !border-slate-800"
            styles={{ header: { borderBottom: '1px solid #1e293b' } }}
          >
            <ReactECharts option={onTimeChartOption} style={{ height: 280 }} theme="dark" />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <span className="text-slate-800 font-medium">车辆状态分布</span>
                <Tag color="red" icon={<AlertOutlined />} className="animate-pulse">
                  {stats.activeAlerts} 个待处理
                </Tag>
              </Space>
            }
            className="!bg-slate-900 !border-slate-800"
            styles={{ header: { borderBottom: '1px solid #1e293b' } }}
          >
            <ReactECharts option={busStatusOption} style={{ height: 280 }} theme="dark" />
          </Card>
        </Col>
      </Row>

      <Card
        title={<span className="text-slate-800 font-medium">实时异常预警</span>}
        extra={<Tag color="red">{mockAlertEvents.filter(a => a.status === 'new').length} 条新告警</Tag>}
      >
        <List
          dataSource={mockAlertEvents.slice(0, 5)}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Tag color={item.severity === 'high' || item.severity === 'critical' ? 'red' : item.severity === 'medium' ? 'orange' : 'blue'} key="severity">
                  {item.severity === 'critical' ? '紧急' : item.severity === 'high' ? '高' : item.severity === 'medium' ? '中' : '低'}
                </Tag>,
              ]}
            >
              <List.Item.Meta
                avatar={<Tag color={alertTypeColor[item.type]} className="!text-base !px-3">{alertTypeName[item.type]}</Tag>}
                title={item.description}
                description={
                  <Space size="middle">
                    <span className="text-slate-500">车辆：{item.busId}</span>
                    <span className="text-slate-500">{dayjs(item.timestamp).fromNow()}</span>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
