import React from 'react';
import { Layout, Menu } from 'antd';
import { DesktopOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Header } = Layout;

const AppHeader = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      key: 'designer',
      icon: <DesktopOutlined />,
      label: '任务设计器',
      onClick: () => navigate('/designer')
    },
    {
      key: 'tasks',
      icon: <UserOutlined />,
      label: '任务列表',
      onClick: () => navigate('/')
    },
    {
      key: 'distribution',
      icon: <UserOutlined />,
      label: '任务分发',
      onClick: () => navigate('/distribution')
    }
  ];

  return (
    <Header>
      <div className="logo" style={{ color: '#1890ff', fontSize: '18px', fontWeight: 'bold' }}>
        HR低代码平台
      </div>
      <Menu
        mode="horizontal"
        items={menuItems}
        style={{ flex: 1, minWidth: 0 }}
      />
    </Header>
  );
};

export default AppHeader;