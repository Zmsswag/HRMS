import React from 'react';
import { Card, Typography, Divider, Form } from 'antd';
import { AssignmentNode } from '../components/WorkflowComponents';

const { Title, Paragraph } = Typography;

const AssignmentPage = () => {
  return (
    <Card title="任务分配组件" bordered={false} style={{ width: '100%' }}>
      <Typography>
        <Title level={4}>任务分配组件介绍</Title>
        <Paragraph>
          任务分配组件用于在工作流中将任务分配给特定人员或角色。在人力资源系统中，任务分配常用于招聘流程中的面试安排、培训任务分配、绩效评估分配等场景。
        </Paragraph>
        <Divider />
        <Title level={4}>组件示例</Title>
      </Typography>
      
      <Form layout="vertical" style={{ maxWidth: 600 }}>
        <AssignmentNode />
      </Form>
      
      <Divider />
      <Typography>
        <Title level={4}>使用说明</Title>
        <Paragraph>
          1. 支持按人员、角色、部门分配任务
        </Paragraph>
        <Paragraph>
          2. 可以设置任务优先级和截止时间
        </Paragraph>
        <Paragraph>
          3. 支持任务说明和相关资源链接
        </Paragraph>
      </Typography>
    </Card>
  );
};

export default AssignmentPage;