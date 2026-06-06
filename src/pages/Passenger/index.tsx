
import React, { useState, useMemo } from 'react';
import { Card, Row, Col, Select, DatePicker, Tag, Space, List, Button, message, Statistic } from 'antd';
import { RiseOutlined, FallOutlined, BulbOutlined, TeamOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { mockRoutes } from '@/services/mock/data';
import { calculatePassengerHeatmap, generatePeakAdjustmentSuggestions, type StationPassengerData, type PeakAdjustmentSuggestion } from '@/utils/businessAlgorithms';

const Passenger: React.FC = () => {
  const [selectedRoute, setSelectedRoute] = useState<string>('r1');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().subtract(6, 'day'), dayjs()]);

  const route = mockRoutes.find(r => r.id === selectedRoute) || mockRoutes[0];

  const heatmapData = useMemo(() => {
    return calculatePassengerHeatmap(route, { start: dateRange[0], end: dateRange[1] }, 1.0);
  }, [selectedRoute, dateRange, route]);

  const suggestions = useMemo(() => {
    return generatePeakAdjustmentSuggestions(heatmapData);
  }, [heatmapData]);

  const totalPassengers = heatmapData.reduce((sum, d) => sum + d.boardings, 0);
  const avgPerStation = Math.round(totalPassengers / heatmapData.length);
  const peakStation = heatmapData.reduce((max, d) => d.boardings > max.boardings ? d : max, heatmapData[0]);
  const growthRate = 8.5;

  const heatmapChartOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderColor: 'transparent',
      textStyle: { color: '#fff' },
      formatter: (params: any) => {
        const data = params[0];
        const station = heatmapData[data.dataIndex];
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">${station?.stationName}</div>
            <div>上车客流: ${station?.boardings} 人次</div>
            <div>下车客流: ${station?.alightings} 人次</div>
            <div>高峰客流: ${station?.peakBoardings} 人次</div>
          </div>
        `;
      },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: heatmapData.map(d => d.stationName),
      axisLabel: { rotate: 45, color: '#94a3b8', fontSize: 11 },
      axisLine: { lineStyle: { color: '#334155' } },
    },
    yAxis: {
      type: 'value',
      name: '客流量（人次）',
      axisLabel: { color: '#94a3b8' },
      axisLine: { lineStyle: { color: '#334155' } },
      splitLine: { lineStyle: { color: '#1e293b' } },
    },
    series: [{
      type: 'bar',
      data: heatmapData.map(d => {
        const isHigh = d.boardings > avgPerStation * 1.3;
        const isLow = d.boardings < avgPerStation * 0.7;
        return {
          value: d.boardings,
          itemStyle: {
            color: isHigh
              ? { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#ef4444' }, { offset: 1, color: '#f97316' }] }
              : isLow
              ? { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#22c55e' }, { offset: 1, color: '#10b981' }] }
              : { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#3b82f6' }, { offset: 1, color: '#06b6d4' }] },
          },
        };
      }),
      barWidth: 28,
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
      data: Array.from({ length: 19 }, (_, i) => `${i + 5}:00`),
      axisLabel: { color: '#94a3b8' },
      axisLine: { lineStyle: { color: '#334155' } },
    },
    yAxis: {
      type: 'value',
      name: '客流/小时',
      axisLabel: { color: '#94a3b8' },
      axisLine: { lineStyle: { color: '#334155' } },
      splitLine: { lineStyle: { color: '#1e293b' } },
    },
    series: [
      {
        name: '上周',
        type: 'line',
        smooth: true,
        data: heatmapData.length > 0 ? heatmapData[0].timeDistribution.map(v => Math.round(v * 0.92)) : [],
        lineStyle: { color: '#64748b', width: 2, type: 'dashed' },
        itemStyle: { color: '#64748b' },
      },
      {
        name: '本周',
        type: 'line',
        smooth: true,
        data: heatmapData.length > 0 ? heatmapData[0].timeDistribution : [],
        lineStyle: { width: 3, color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#3b82f6' }, { offset: 1, color: '#06b6d4' }] } },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(59, 130, 246, 0.4)' }, { offset: 1, color: 'rgba(59, 130, 246, 0.02)' }] } },
        itemStyle: { color: '#3b82f6' },
      },
    ],
  };

  const maxBoardings = Math.max(...heatmapData.map(d => d.boardings), 1);

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
          <DatePicker.RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
            style={{ width: 280 }}
          />
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card className="gradient-card">
            <Statistic
              title="总客流量"
              value={totalPassengers}
              suffix="人次"
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#60a5fa' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="gradient-card">
            <Statistic
              title="站点平均客流"
              value={avgPerStation}
              suffix="人次"
              valueStyle={{ color: '#34d399' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="gradient-card">
            <Statistic
              title="客流最高站点"
              value={peakStation?.stationName || '-'}
              valueStyle={{ color: '#fbbf24', fontSize: 16 }}
              suffix={<Tag color="red">{peakStation?.boardings}人次</Tag>}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="gradient-card">
            <Statistic
              title="同比上周"
              value={growthRate}
              suffix="%"
              prefix={growthRate >= 0 ? <ArrowUpOutlined className="text-green-500" /> : <ArrowDownOutlined className="text-red-500" />}
              valueStyle={{ color: growthRate >= 0 ? '#34d399' : '#f87171' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={`${route.name} 站点客流热力分布`}
            className="!bg-slate-900 !border-slate-800"
            styles={{ header: { borderBottom: '1px solid #1e293b' } }}
          >
            <ReactECharts option={heatmapChartOption} style={{ height: 380 }} theme="dark" />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="站点客流排名 TOP 6">
            <List
              dataSource={[...heatmapData].sort((a, b) => b.boardings - a.boardings).slice(0, 6)}
              renderItem={(item, index) => (
                <List.Item className="!px-0">
                  <div className="flex items-center gap-3 w-full">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index < 3 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.stationName}</div>
                      <div className="w-full bg-slate-100 rounded-full h-2 mt-1">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                          style={{ width: `${(item.boardings / maxBoardings) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-800">{item.boardings}</div>
                      <div className="text-xs text-slate-500">人次</div>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="时段客流趋势对比"
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
            <Tag color="blue">基于客流热力分析生成</Tag>
          </Space>
        }
        extra={<Button type="primary" onClick={() => message.success('已应用调整建议并生成新的行车计划')}>一键应用建议</Button>}
      >
        <Row gutter={[16, 16]}>
          {suggestions.map((s: PeakAdjustmentSuggestion, i: number) => (
            <Col xs={24} md={8} key={i}>
              <Card size="small" className="h-full hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
                <div className="flex items-start gap-3">
                  <div className="text-2xl mt-1">
                    {s.suggestedInterval < s.currentInterval ? <RiseOutlined className="text-orange-500" /> : <FallOutlined className="text-blue-500" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800 mb-1">
                      {s.timePeriod} {s.suggestedInterval < s.currentInterval ? '加密班次' : '优化班次'}
                    </h4>
                    <p className="text-xs text-slate-500 mb-2">
                      发车间隔: {s.currentInterval}分钟 → <span className="font-bold text-blue-600">{s.suggestedInterval}分钟</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      预计客流: {s.passengerVolume}人次，满载率: {s.expectedLoadFactor}%
                    </p>
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
