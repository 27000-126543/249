
import React, { useState } from 'react';
import { Card, Row, Col, Form, Select, DatePicker, Button, Space, Table, Tag, message } from 'antd';
import { DownloadOutlined, FileTextOutlined, BarChartOutlined, RiseOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { mockRoutes, mockBranches } from '@/services/mock/data';

const { RangePicker } = DatePicker;

interface ReportData {
  id: string;
  routeName: string;
  branchName: string;
  totalTrips: number;
  onTimeRate: number;
  totalPassengers: number;
  revenue: number;
  cost: number;
  efficiency: number;
}

const Reports: React.FC = () => {
  const [form] = Form.useForm();
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [generated, setGenerated] = useState(false);

  const mockReportData: ReportData[] = mockRoutes.map((route, i) => ({
    id: route.id,
    routeName: route.name,
    branchName: mockBranches.find(b => b.id === route.branchId)?.name || '-',
    totalTrips: 120 + Math.floor(Math.random() * 60),
    onTimeRate: 90 + Math.random() * 8,
    totalPassengers: 25000 + Math.floor(Math.random() * 15000),
    revenue: 150000 + Math.floor(Math.random() * 80000),
    cost: 100000 + Math.floor(Math.random() * 50000),
    efficiency: 40 + Math.random() * 30,
  }));

  const columns: ColumnsType<ReportData> = [
    {
      title: '线路',
      dataIndex: 'routeName',
      key: 'routeName',
      fixed: 'left',
      width: 80,
    },
    {
      title: '分公司',
      dataIndex: 'branchName',
      key: 'branchName',
      width: 100,
    },
    {
      title: '总班次',
      dataIndex: 'totalTrips',
      key: 'totalTrips',
      width: 80,
    },
    {
      title: '准点率',
      dataIndex: 'onTimeRate',
      key: 'onTimeRate',
      width: 100,
      render: (v) => <span className={v >= 95 ? 'text-green-600' : v >= 90 ? 'text-blue-600' : 'text-orange-600'}>{v.toFixed(1)}%</span>,
    },
    {
      title: '总客流量',
      dataIndex: 'totalPassengers',
      key: 'totalPassengers',
      width: 100,
      render: (v) => v.toLocaleString(),
    },
    {
      title: '营收(元)',
      dataIndex: 'revenue',
      key: 'revenue',
      width: 120,
      render: (v) => `¥${v.toLocaleString()}`,
    },
    {
      title: '成本(元)',
      dataIndex: 'cost',
      key: 'cost',
      width: 120,
      render: (v) => `¥${v.toLocaleString()}`,
    },
    {
      title: '运营效率',
      dataIndex: 'efficiency',
      key: 'efficiency',
      width: 100,
      render: (v) => <Tag color={v >= 60 ? 'green' : v >= 40 ? 'blue' : 'orange'}>{v.toFixed(1)}%</Tag>,
    },
  ];

  const handleGenerate = () => {
    setReportData(mockReportData);
    setGenerated(true);
    message.success('报告生成成功');
  };

  const handleExport = () => {
    message.success('报告已导出为Excel文件');
  };

  const efficiencyChartOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderColor: 'transparent',
      textStyle: { color: '#fff' },
    },
    legend: {
      data: ['客流量', '营收'],
      textStyle: { color: '#94a3b8' },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: mockReportData.map(d => d.routeName),
      axisLabel: { color: '#94a3b8' },
      axisLine: { lineStyle: { color: '#334155' } },
    },
    yAxis: [
      {
        type: 'value',
        name: '客流量',
        axisLabel: { color: '#94a3b8' },
        axisLine: { lineStyle: { color: '#334155' } },
        splitLine: { lineStyle: { color: '#1e293b' } },
      },
      {
        type: 'value',
        name: '营收(万)',
        axisLabel: { color: '#94a3b8' },
        axisLine: { lineStyle: { color: '#334155' } },
      },
    ],
    series: [
      {
        name: '客流量',
        type: 'bar',
        data: mockReportData.map(d => d.totalPassengers),
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#3b82f6' }, { offset: 1, color: '#06b6d4' }] },
        },
      },
      {
        name: '营收',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: mockReportData.map(d => d.revenue / 10000),
        lineStyle: { width: 3, color: '#f59e0b' },
        itemStyle: { color: '#f59e0b' },
      },
    ],
  };

  const costChartOption = {
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
        type: 'pie',
        radius: ['45%', '75%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#0f172a',
          borderWidth: 2,
        },
        label: { show: false },
        data: [
          { value: 35, name: '人工成本', itemStyle: { color: '#3b82f6' } },
          { value: 25, name: '能源成本', itemStyle: { color: '#10b981' } },
          { value: 20, name: '维修保养', itemStyle: { color: '#f59e0b' } },
          { value: 12, name: '车辆折旧', itemStyle: { color: '#8b5cf6' } },
          { value: 8, name: '其他', itemStyle: { color: '#6b7280' } },
        ],
      },
    ],
  };

  return (
    <div className="space-y-6">
      <Card title="生成运营报告">
        <Form form={form} layout="inline" initialValues={{ branch: 'all', route: 'all' }}>
          <Form.Item name="branch" label="分公司">
            <Select style={{ width: 160 }}>
              <Select.Option value="all">全部分公司</Select.Option>
              {mockBranches.map(b => (
                <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="route" label="线路">
            <Select style={{ width: 140 }}>
              <Select.Option value="all">全部线路</Select.Option>
              {mockRoutes.map(r => (
                <Select.Option key={r.id} value={r.id}>{r.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="dateRange" label="日期范围">
            <RangePicker
              defaultValue={[dayjs().subtract(1, 'month'), dayjs()]}
              style={{ width: 260 }}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<BarChartOutlined />} onClick={handleGenerate}>
                生成报告
              </Button>
              <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={!generated}>
                导出Excel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {generated && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card size="small">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <FileTextOutlined className="text-xl text-blue-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-800">
                      {reportData.reduce((sum, d) => sum + d.totalTrips, 0)}
                    </div>
                    <div className="text-sm text-slate-500">总班次</div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <RiseOutlined className="text-xl text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-800">
                      {(reportData.reduce((sum, d) => sum + d.totalPassengers, 0)).toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-500">总客流量</div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                    <BarChartOutlined className="text-xl text-amber-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-800">
                      ¥{(reportData.reduce((sum, d) => sum + d.revenue, 0)).toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-500">总营收</div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <FileTextOutlined className="text-xl text-purple-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-800">
                      {(reportData.reduce((sum, d) => sum + d.onTimeRate, 0) / reportData.length).toFixed(1)}%
                    </div>
                    <div className="text-sm text-slate-500">平均准点率</div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card
                title="线路客流与营收对比"
                className="!bg-slate-900 !border-slate-800"
                styles={{ header: { borderBottom: '1px solid #1e293b' } }}
              >
                <ReactECharts option={efficiencyChartOption} style={{ height: 320 }} theme="dark" />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card
                title="成本构成分析"
                className="!bg-slate-900 !border-slate-800"
                styles={{ header: { borderBottom: '1px solid #1e293b' } }}
              >
                <ReactECharts option={costChartOption} style={{ height: 320 }} theme="dark" />
              </Card>
            </Col>
          </Row>

          <Card title="线路运营明细">
            <Table
              columns={columns}
              dataSource={reportData}
              rowKey="id"
              scroll={{ x: 900 }}
              pagination={{ pageSize: 10 }}
              summary={(pageData) => {
                let totalTrips = 0, totalPassengers = 0, totalRevenue = 0, totalCost = 0;
                pageData.forEach(d => {
                  totalTrips += d.totalTrips;
                  totalPassengers += d.totalPassengers;
                  totalRevenue += d.revenue;
                  totalCost += d.cost;
                });
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={2}>合计</Table.Summary.Cell>
                      <Table.Summary.Cell index={2}>{totalTrips}</Table.Summary.Cell>
                      <Table.Summary.Cell index={3}>-</Table.Summary.Cell>
                      <Table.Summary.Cell index={4}>{totalPassengers.toLocaleString()}</Table.Summary.Cell>
                      <Table.Summary.Cell index={5}>¥{totalRevenue.toLocaleString()}</Table.Summary.Cell>
                      <Table.Summary.Cell index={6}>¥{totalCost.toLocaleString()}</Table.Summary.Cell>
                      <Table.Summary.Cell index={7}>-</Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default Reports;
