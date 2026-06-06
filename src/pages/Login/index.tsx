
import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined, CarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAppStore();
  const [loading, setLoading] = useState(false);

  const onFinish = (values: { username: string; password: string }) => {
    setLoading(true);
    setTimeout(() => {
      const success = login(values.username, values.password);
      if (success) {
        message.success('登录成功');
        navigate('/dashboard');
      } else {
        message.error('用户名或密码错误');
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
      </div>
      
      <Card className="w-full max-w-md shadow-2xl backdrop-blur-sm bg-white/95 relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <CarOutlined className="text-3xl text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">城市公交集团</h1>
          <p className="text-slate-500 mt-1">智慧运营调度管理平台</p>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined className="text-slate-400" />}
              placeholder="用户名"
              className="h-12"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-slate-400" />}
              placeholder="密码"
              className="h-12"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 border-none shadow-lg shadow-blue-500/30"
            >
              登 录
            </Button>
          </Form.Item>
        </Form>

        <div className="mt-6 text-center text-sm text-slate-500">
          <p>测试账号：admin / manager / leader / driver</p>
          <p className="mt-1">密码：任意输入即可</p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
