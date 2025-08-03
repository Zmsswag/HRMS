import React from 'react';
import { Card, Typography, Divider, Form } from 'antd';
import { ConditionNode } from '../components/WorkflowComponents';

const { Title, Paragraph } = Typography;

const ConditionPage = () => {
  return (
    <Card title="条件节点组件" bordered={false} style={{ width: '100%' }}>
      <Typography>
        <Title level={4}>条件节点组件介绍</Title>
        <Paragraph>
          条件节点用于在工作流中根据特定条件决定下一步流程走向。在人力资源系统中，条件节点常用于根据请假天数决定审批流程、根据员工级别决定福利发放等场景。
        </Paragraph>
        <Divider />
        <Title level={4}>组件示例</Title>
      </Typography>
      
      <Form layout="vertical" style={{ maxWidth: 600 }}>
        <ConditionNode />
      </Form>
      
      <Divider />
      <Typography>
        <Title level={4}>使用说明</Title>
        <Paragraph>
          1. 支持多种条件类型（等于、不等于、大于、小于等）
        </Paragraph>
        <Paragraph>
          2. 支持多条件组合（且、或、非）
        </Paragraph>
        <Paragraph>
          3. 可以基于表单字段值或系统变量设置条件
        </Paragraph>
      </Typography>
    </Card>
  );
};

export default ConditionPage;