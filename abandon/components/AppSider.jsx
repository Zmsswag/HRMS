import React from 'react';
import { Layout, Menu } from 'antd';
import { FormOutlined, UserOutlined, SettingOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom'; // 导入 Link 组件

const { Sider } = Layout;

const AppSider = () => {
  const menuItems = [
    {
      key: 'form',
      icon: <FormOutlined />,
      label: '表单组件',
      children: [
        { key: 'input', label: <Link to="/input">输入框</Link> }, // 添加链接
        { key: 'select', label: <Link to="/select">下拉选择</Link> }, // 添加链接
        { key: 'datepicker', label: <Link to="/datepicker">日期选择</Link> }, // 添加链接
        { key: 'upload', label: <Link to="/upload">文件上传</Link> } // 添加链接
      ]
    },
    {
      key: 'workflow',
      icon: <SettingOutlined />,
      label: '流程组件',
      children: [
        { key: 'approval', label: <Link to="/approval">审批节点</Link> }, // 添加链接
        { key: 'notification', label: <Link to="/notification">通知节点</Link> }, // 添加链接
        { key: 'condition', label: <Link to="/condition">条件节点</Link> }, // 添加链接
        { key: 'assignment', label: <Link to="/assignment">任务分配</Link> } // 添加链接
      ]
    },
    // {
    //   key: 'hr',
    //   icon: <UserOutlined />,
    //   label: 'HR组件',
    //   children: [
    //     { key: 'employee', label: <Link to="/employee">员工信息</Link> }, // 添加链接
    //     { key: 'department', label: <Link to="/department">部门信息</Link> }, // 添加链接
    //     { key: 'attendance', label: <Link to="/attendance">考勤记录</Link> }, // 添加链接
    //     { key: 'salary', label: <Link to="/salary">薪资管理</Link> } // 添加链接
    //   ]
    // }
  ];

  return (
    <Sider width={200} theme="light">
      <Menu
        mode="inline"
        defaultOpenKeys={['form', 'workflow', 'hr']}
        style={{ height: '100%', borderRight: 0 }}
        items={menuItems}
      />
    </Sider>
  );
};

export default AppSider;