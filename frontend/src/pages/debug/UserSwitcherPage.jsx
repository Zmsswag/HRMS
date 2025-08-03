import React, { useState } from 'react';
import { Card, Input, Button, Form, message, Typography } from 'antd';
import { UserSwitchOutlined } from '@ant-design/icons';
import userApi from '../../api/userApi'; // ✨ 修改了这一行

const { Title, Text } = Typography;

const UserSwitcherPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSwitchUser = async (values) => {
    const { username } = values;
    setLoading(true);
    try {
      const response = await userApi.setCurrentUser(username);
      // response.message 来自于 mock/index.js 中定义的成功响应体
      message.success(response.message || `用户已成功切换为${username}了`);
      // 可以在切换成功后做一些事，比如刷新页面来让整个应用的状态更新
      // window.location.reload(); 
      // 或者只是清空输入框
      form.resetFields();
    } catch (error) {
      // error.message 来自于 axios 拦截器或 userApi.js 中的 Promise.reject
      message.error(error.message || '切换用户失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ maxWidth: 500, margin: '50px auto' }}>
      <Title level={4}>
        <UserSwitchOutlined style={{ marginRight: 8 }} />
        模拟用户切换 (调试专用)
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        在这里输入一个名字（例如：李四, 王五），提交后系统的当前用户身份将切换。
        这会影响到“我的申请”列表以及“待我审批”列表的数据。
      </Text>
      <Form
        form={form}
        onFinish={handleSwitchUser}
        layout="vertical"
      >
        <Form.Item
          label="用户名"
          name="username"
          rules={[{ required: true, message: '请输入要切换的用户名!' }]}
        >
          <Input placeholder="例如：李四" />
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            block
          >
            切换用户
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default UserSwitcherPage;