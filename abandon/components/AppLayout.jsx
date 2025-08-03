import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button } from 'antd';
import { 
  MenuUnfoldOutlined, 
  MenuFoldOutlined, 
  UserOutlined, 
  FileTextOutlined,
  CheckSquareOutlined,
  HistoryOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import PageContainer from './PageContainer';

const { Header, Sider, Content } = Layout;

const AppLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const toggle = () => {
    setCollapsed(!collapsed);
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        个人信息
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />}>
        退出登录
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="light">
        <div className="logo" style={{ height: 64, padding: 16, textAlign: 'center' }}>
          <h2 style={{ color: '#1890ff', display: collapsed ? 'none' : 'block' }}>请假审批系统</h2>
          {collapsed && <span style={{ fontSize: 24, color: '#1890ff' }}>假</span>}
        </div>
        <Menu theme="light" mode="inline" selectedKeys={[location.pathname]}>
          <Menu.Item key="/submit" icon={<FileTextOutlined />}>
            <Link to="/submit">提交请假申请</Link>
          </Menu.Item>
          <Menu.Item key="/my-requests" icon={<HistoryOutlined />}>
            <Link to="/my-requests">我的申请记录</Link>
          </Menu.Item>
          <Menu.Item key="/pending-approvals" icon={<CheckSquareOutlined />}>
            <Link to="/pending-approvals">待审批申请</Link>
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout className="site-layout">
        <Header className="site-layout-background" style={{ padding: 0, background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 24 }}>
            <Button 
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggle}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
            <Dropdown overlay={userMenu} placement="bottomRight">
              <div style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span style={{ marginLeft: 8, display: collapsed ? 'none' : 'inline' }}>管理员</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <PageContainer>
          {children}
        </PageContainer>
      </Layout>
    </Layout>
  );
};

export default AppLayout;