import React from 'react';
import { Layout, Breadcrumb } from 'antd';
import { useLocation } from 'react-router-dom';

const { Content } = Layout;

// 路径映射到面包屑名称
const pathMap = {
  '/submit': '提交请假申请',
  '/my-requests': '我的申请记录',
  '/pending-approvals': '待审批申请',
  '/detail': '申请详情'
};

const PageContainer = ({ children }) => {
  const location = useLocation();
  const pathSnippets = location.pathname.split('/').filter(i => i);
  
  // 生成面包屑项
  const breadcrumbItems = pathSnippets.map((_, index) => {
    const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
    return (
      <Breadcrumb.Item key={url}>
        {pathMap[url] || url}
      </Breadcrumb.Item>
    );
  });

  // 如果没有路径片段，显示"首页"
  if (breadcrumbItems.length === 0) {
    breadcrumbItems.push(<Breadcrumb.Item key="home">首页</Breadcrumb.Item>);
  }

  return (
    <Content
      style={{
        margin: '24px 16px',
        padding: 24,
        minHeight: 280,
        background: '#fff',
        borderRadius: 4
      }}
    >
      <Breadcrumb style={{ marginBottom: 16 }}>
        {breadcrumbItems}
      </Breadcrumb>
      {children}
    </Content>
  );
};

export default PageContainer;