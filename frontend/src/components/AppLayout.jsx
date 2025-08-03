import React, { useState, useMemo } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UserOutlined,
  FileTextOutlined,
  AuditOutlined,
  FormOutlined,
  LogoutOutlined,
  BellOutlined,
  SettingOutlined,
  // =========================================================
  // ===                 ✨ 步骤 1：导入新图标 ✨             ===
  // =========================================================
  ToolOutlined, // 导入一个调试工具图标
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

/**
 * 应用布局组件
 * @param {React.ReactNode} children - 子组件
 */
const AppLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 切换侧边栏折叠状态
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  // 处理菜单点击
  const handleMenuClick = ({ key }) => {
    if (key === 'logout') {
      console.log('Logout clicked');
    } 
    // =========================================================
    // ===          ✨ 步骤 2：修改 'profile' 的处理逻辑 ✨       ===
    // =========================================================
    // 当用户点击 "个人信息" (key 为 'profile') 时，导航到用户切换页面
    else if (key === 'profile') {
      navigate('/debug/switch-user'); 
    }
    // =========================================================
    else if (key === 'settings') {
      console.log(`Navigate to ${key}`);
    } else if (key.startsWith('/')) {
      navigate(key);
    } else if (key.startsWith('notification') || key === 'all') {
        console.log(`Notification clicked: ${key}`)
    }
  };

  // --- 用户菜单项 ---
  const userMenuItems = useMemo(() => [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ], []);

  // --- 通知菜单项 ---
  const notificationMenuItems = useMemo(() => [ /* ...代码不变... */ ], []);

  // --- 侧边栏菜单项 ---
  const siderMenuItems = useMemo(() => [
      {
        key: '/submit',
        icon: <FormOutlined />,
        label: '提交请假申请',
      },
      {
        key: '/my-requests',
        icon: <FileTextOutlined />,
        label: '我的请假记录',
      },
      {
        key: '/pending-approvals',
        icon: <AuditOutlined />,
        label: '待审批申请',
      },
      {
        key: 'workflow',
        icon: <SettingOutlined />,
        label: '工作流管理',
        children: [
          {
            key: '/workflow/definitions',
            label: '工作流定义',
          },
          {
            key: '/workflow/designer',
            label: '创建工作流',
          }
        ]
      },
      // =========================================================
      // ===          ✨ 步骤 3：(可选) 添加调试菜单项 ✨         ===
      // =========================================================
      {
        key: 'debug',
        icon: <ToolOutlined />,
        label: '调试工具',
        children: [
            {
                key: '/debug/switch-user',
                label: '切换用户'
            }
        ]
      },
      // =========================================================
  ], []);

  // --- 动态计算选中和展开的菜单项 (代码不变) ---
  const getSelectedKeys = () => {
    const path = location.pathname;
    
    // 遍历所有菜单项（包括子菜单）
    const findKey = (items) => {
        for (const item of items) {
            if (item.children) {
                const childMatch = findKey(item.children);
                if (childMatch) return childMatch;
            } else if (path.startsWith(item.key) && item.key !== '/') {
                return item.key;
            }
        }
        return null;
    };
    
    const matchedKey = findKey(siderMenuItems);
    return matchedKey ? [matchedKey] : [path];
  };
  
  const getOpenKeys = () => {
    const path = location.pathname;
    
    for (const item of siderMenuItems) {
      if (item.children) {
        const hasMatch = item.children.some(child => path.startsWith(child.key));
        if (hasMatch) {
          return [item.key];
        }
      }
    }
    
    return [];
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="light">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <h2 style={{ color: '#1890ff', margin: 0, fontSize: collapsed ? 16 : 20, whiteSpace: 'nowrap' }}>
            {collapsed ? 'HR' : '人力资源系统'}
          </h2>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()} // antd 推荐使用 defaultOpenKeys 来避免组件重渲染时菜单折叠
          onClick={handleMenuClick}
          items={siderMenuItems}
        />
      </Sider>

      <Layout>
        <Header style={{
          padding: '0 16px 0 0',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0, 21, 41, 0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleCollapsed}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Dropdown
              menu={{ items: notificationMenuItems, onClick: handleMenuClick }}
              placement="bottomRight"
              trigger={['click']}
            >
              {/* <Badge count={2} size="small">
                <Button type="text" icon={<BellOutlined style={{ fontSize: '18px' }} />} />
              </Badge> */}
            </Dropdown>

            <Dropdown
              menu={{ items: userMenuItems, onClick: handleMenuClick }}
              placement="bottomRight"
              trigger={['click']}
            >
              {/* <span style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                <Avatar size="small" icon={<UserOutlined />} />
                <span style={{ marginLeft: 8 }}>张三</span>
              </span> */}
            </Dropdown>
          </div>
        </Header>

        <Content style={{ margin: '24px 16px', padding: 24, background: '#f0f2f5', flexGrow: 1 }}>
          <div style={{ padding: 24, background: '#fff', minHeight: 'calc(100vh - 64px - 48px)' }}>
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;