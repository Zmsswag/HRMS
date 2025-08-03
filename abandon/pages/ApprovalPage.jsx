import React from 'react';
import { Card, Typography, Divider, Form } from 'antd';
import { ApprovalNode } from '../components/WorkflowComponents';

const { Title, Paragraph } = Typography;

const ApprovalPage = () => {
  return (
    <Card title="审批节点组件" bordered={false} style={{ width: '100%' }}>
      <Typography>
        <Title level={4}>审批节点组件介绍</Title>
        <Paragraph>
          审批节点是工作流中的关键环节，用于指定审批人和审批规则。在人力资源系统中，审批节点常用于请假申请、报销申请、晋升申请等需要上级审批的流程。
        </Paragraph>
        <Divider />
        <Title level={4}>组件示例</Title>
      </Typography>
      
      <Form layout="vertical" style={{ maxWidth: 600 }}>
        <ApprovalNode />
      </Form>
      
      <Divider />
      <Typography>
        <Title level={4}>使用说明</Title>
        <Paragraph>
          1. 支持多级审批流程设置
        </Paragraph>
        <Paragraph>
          2. 可以指定审批人或审批角色
        </Paragraph>
        <Paragraph>
          3. 支持审批说明和附件上传
        </Paragraph>
      </Typography>
    </Card>
  );
};

export default ApprovalPage;