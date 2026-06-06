
import React, { useState } from 'react';
import { Card, Row, Col, Select, Slider, Tag, Space, List, Button, message } from 'antd';
import { RiseOutlined, FallOutlined, BulbOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { mockRoutes, getPassengerHeatmapData } from '@/services/mock/data';
import type { PassengerData } from '@/types';

const Passenger: React.FC = () => {
  const [selectedRoute, setSelectedRoute] = useState<string>('r1');
  const [selectedHour, setSelectedHour] = useState<number>(8);
  const heatmapData = getPassengerHeatmapData();

  const routeStations = mockRoutes.find(r => r.id === selectedRoute)?.stations || [];
  
  const filteredData = heatmapData.filter(d => 
    d.routeId === selectedRoute && d.hour === selectedHour
  );

  const maxPassengers = Math.max(...filteredData.map(d => d.passengerCount), 1);

  const heatmapChartOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderColor: 'transparent',
      textStyle: { color: '#fff' },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: routeStations.map(s => s.name),
      axisLabel: { rotate: 45, color: '#94a3b8' },
      axisLine: { lineStyle: { color: '#334155' } },
    },
    yAxis: {
      type: 'value',
      name: '客流量',
      axisLabel: { color: '#94a3b8' },
      axisLine: { lineStyle: { color: '#334155' } },
      splitLine: { lineStyle: { color: '#1e293b' } },
    },
    series: [{
      type: 'bar',
      data: routeStations.map(station => {
        const data = filteredData.find(d => d.stationId === station.id);
        return {
          value: data?.passengerCount || 0,
          itemStyle: {
            color: data?.isPeak 
              ? { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#ef4444' }, { offset: 1, color: '#f97316' }] }
              : { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#3b82f6' }, { offset: 1, color: '#06b6d4' }] },
          },
        };
      }),
      barWidth: 24,
      itemStyle: { borderRadius: [6, 6, 0, 0] },
    }],
  };

  const trendChartOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderColor: 'transparent',
      textStyle: { color: '#fff' },
    },
    legend: {
      data: ['上周', '本周'],
      textStyle: { color: '#94a3b8' },
      top: 0,
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 40, containLabel: true },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 17 }, (_, i) => `${i + 6}:00`),
      axisLabel: { color: '#94a3b8' },
      axisLine: { lineStyle: { color: '#334155' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#94a3b8' },
      axisLine: { lineStyle: { color: '#334155' } },
      splitLine: { lineStyle: { color: '#1e293b' } },
    },
    series: [
      {
        name: '上周',
        type: 'line',
        smooth: true,
        data: Array.from({ length: 17 }, (_, i) => {
          const h = i + 6;
          let base = 200;
          if (h >= 7 && h <= 9) base = 750;
          else if (h >= 17 && h <= 19) base = 700;
          return base + Math.floor(Math.random() * 150 - 75);
        }),
        lineStyle: { color: '#64748b', width: 2, type: 'dashed' },
        itemStyle: { color: '#64748b' },
      },
      {
        name: '本周',
        type: 'line',
        smooth: true,
        data: Array.from({ length: 17 }, (_, i) => {
          const h = i + 6;
          let base = 220;
          if (h >= 7 && h <= 9) base = 820;
          else if (h >= 17 && h <= 19) base = 760;
          return base + Math.floor(Math.random() * 150 - 75);
        }),
        lineStyle: { width: 3, color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#3b82f6' }, { offset: 1, color: '#06b6d4' }] } },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(59, 130, 246, 0.4)' }, { offset: 1, color: 'rgba(59, 130, 246, 0.02)' }] } },
        itemStyle: { color: '#3b82f6' },
      },
    ],
  };

  const suggestions = [
    { type: 'increase', title: '早高峰加密班次', desc: '建议7:30-8:30期间将1路发车间隔从8分钟缩短至6分钟，预计可降低满载率15%', icon: <RiseOutlined className="text-orange-500" /> },
    { type: 'increase', title: '晚高峰加车', desc: '建议17:00-18:30期间2路增加2台运营车辆，缓解大客流压力', icon: <RiseOutlined className="text-orange-500" /> },
    { type: 'decrease', title: '午间减班', desc: '建议12:00-14:00期间3路发车间隔调整为15分钟，减少空驶', icon: <FallOutlined className="text-blue-500" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Space wrap>
          <Select
            value={selectedRoute}
            onChange={setSelectedRoute}
            style={{ width: 180 }}
            options={mockRoutes.map(r => ({ label: r.name, value: r.id }))}
          />
          <div className="flex items-center gap-3">
            <span className="text-slate-600">选择时段：</span>
            <Slider
              min={6}
              max={22}
              value={selectedHour}
              onChange={setSelectedHour}
              marks={{ 6: '6:00', 9: '9:00', 12: '12:00', 17: '17:00', 22: '22:00' }}
              style={{ width: 400 }}
            />
            <Tag color={selectedHour >= 7 && selectedHour <= 9 || selectedHour >= 17 && selectedHour <= 19 ? 'red' : 'blue'}>
              {selectedHour >= 7 && selectedHour <= 9 || selectedHour >= 17 && selectedHour <= 19 ? '高峰时段' : '平峰时段'}
            </Tag>
          </div>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={`${mockRoutes.find(r => r.id === selectedRoute)?.name} 站点客流热力`}
            className="!bg-slate-900 !border-slate-800"
            styles={{ header: { borderBottom: '1px solid #1e293b' } }}
          >
            <ReactECharts option={heatmapChartOption} style={{ height: 350 }} theme="dark" />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="站点客流排名">
            <List
              dataSource={[...filteredData].sort((a, b) => b.passengerCount - a.passengerCount).slice(0, 6)}
              renderItem={(item, index) => {
                const station = routeStations.find(s => s.id === item.stationId);
                return (
                  <List.Item className="!px-0">
                    <div className="flex items-center gap-3 w-full">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index < 3 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{station?.name}</div>
                        <div className="w-full bg-slate-100 rounded-full h-2 mt-1">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                            style={{ width: `${(item.passengerCount / maxPassengers) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-800">{item.passengerCount}</div>
                        <div className="text-xs text-slate-500">人次</div>
                      </div>
                    </div>
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="客流时段对比趋势"
        className="!bg-slate-900 !border-slate-800"
        styles={{ header: { borderBottom: '1px solid #1e293b' } }}
      >
        <ReactECharts option={trendChartOption} style={{ height: 320 }} theme="dark" />
      </Card>

      <Card
        title={
          <Space>
            <BulbOutlined className="text-amber-500" />
            <span>智能调度建议</span>
          </Space>
        }
        extra={<Button type="primary" onClick={() => message.success('已应用调整建议并生成新的行车计划')}>一键应用建议</Button>}
      >
        <Row gutter={[16, 16]}>
          {suggestions.map((s, i) => (
            <Col xs={24} md={8} key={i}>
              <Card size="small" className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="text-2xl mt-1">{s.icon}</div>
                  <div>
                    <h4 className="font-medium text-slate-800 mb-1">{s.title}</h4>
                    <p className="text-sm text-slate-500">{s.desc}</p>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
};

export default Passenger;
