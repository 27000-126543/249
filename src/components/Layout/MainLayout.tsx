
import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  ScheduleOutlined,
  TeamOutlined,
  CarOutlined,
  LineChartOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  FileTextOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/store';
import { getRoleName } from '@/utils/permission';
import type { MenuProps } from 'antd';
import { mockAlertEvents } from '@/services/mock/data';

const { Header, Sider, Content } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout, sidebarCollapsed, toggleSidebar } = useAppStore();
  const [selectedKey, setSelectedKey] = useState('/dashboard');

  useEffect(() => {
    setSelectedKey(location.pathname);
  }, [location.pathname]);

  const menuItems: MenuItem[] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '首页大屏',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: '/schedule',
      icon: <ScheduleOutlined />,
      label: '行车计划',
      onClick: () => navigate('/schedule'),
    },
    {
      key: '/roster',
      icon: <TeamOutlined />,
      label: '排班管理',
      children: [
        { key: '/roster', label: '排班日历', onClick: () => navigate('/roster') },
        { key: '/roster/swap', label: '调班申请', onClick: () => navigate('/roster/swap') },
      ],
    },
    {
      key: '/monitor',
      icon: <CarOutlined />,
      label: '车辆监控',
      children: [
        { key: '/monitor', label: '实时监控', onClick: () => navigate('/monitor') },
        { key: '/monitor/alerts', label: '异常预警', onClick: () => navigate('/monitor/alerts') },
      ],
    },
    {
      key: '/passenger',
      icon: <LineChartOutlined />,
      label: '客流分析',
      onClick: () => navigate('/passenger'),
    },
    {
      key: '/charging',
      icon: <ThunderboltOutlined />,
      label: '充电桩管理',
      onClick: () => navigate('/charging'),
    },
    {
      key: '/repair',
      icon: <ToolOutlined />,
      label: '故障报修',
      onClick: () => navigate('/repair'),
    },
    {
      key: '/reports',
      icon: <FileTextOutlined />,
      label: '报表中心',
      onClick: () => navigate('/reports'),
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
      onClick: () => navigate('/settings'),
    },
  ];

  const userMenuItems: MenuProps['items'] = [
    {
      key: '1',
      label: '个人信息',
      icon: <UserOutlined />,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  const newAlertCount = mockAlertEvents.filter(a => a.status === 'new').length;

  return (
    <Layout className="min-h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={sidebarCollapsed}
        theme="dark"
        className="!bg-slate-900"
        width={240}
      >
        <div className="h-16 flex items-center justify-center border-b border-slate-700">
          <div className="text-white font-bold text-lg flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <CarOutlined />
            </div>
            {!sidebarCollapsed && <span>智慧调度平台</span>}
          </div>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={['/roster', '/monitor']}
          items={menuItems}
          className="!border-r-0 !bg-slate-900"
        />
      </Sider>
      <Layout>
        <Header className="!bg-white !px-6 !flex !items-center !justify-between shadow-sm">
          <div className="flex items-center gap-4">
            {React.createElement(sidebarCollapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              className: 'text-xl cursor-pointer text-slate-600',
              onClick: toggleSidebar,
            })}
            <h2 className="text-lg font-medium text-slate-800">
              {(menuItems.find(m => 'key' in m && m.key === selectedKey) as any)?.label ||
                menuItems.flatMap(m => ('children' in m ? (m as any).children : [])).find((c: any) => c.key === selectedKey)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <Badge count={newAlertCount} size="small">
              <BellOutlined className="text-xl text-slate-600 cursor-pointer hover:text-blue-500 transition-colors" />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors">
                <Avatar size={36} icon={<UserOutlined />} className="!bg-blue-500" />
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-slate-800">{currentUser?.name}</div>
                  <div className="text-xs text-slate-500">{currentUser && getRoleName(currentUser.role)}</div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="m-6">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
