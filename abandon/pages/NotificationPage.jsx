import React from 'react';
import { Card, Typography, Divider, Form } from 'antd';
import { NotificationNode } from '../components/WorkflowComponents';

const { Title, Paragraph } = Typography;

const NotificationPage = () => {
  return (
    <Card title="通知节点组件" bordered={false} style={{ width: '100%' }}>
      <Typography>
        <Title level={4}>通知节点组件介绍</Title>
        <Paragraph>
          通知节点用于在工作流程中的特定环节向相关人员发送通知。在人力资源系统中，通知节点常用于新任务提醒、审批结果通知、截止日期提醒等场景。
        </Paragraph>
        <Divider />
        <Title level={4}>组件示例</Title>
      </Typography>
      
      <Form layout="vertical" style={{ maxWidth: 600 }}>
        <NotificationNode />
      </Form>
      
      <Divider />
      <Typography>
        <Title level={4}>使用说明</Title>
        <Paragraph>
          1. 支持多种通知方式（邮件、短信、系统消息）
        </Paragraph>
        <Paragraph>
          2. 可以指定通知对象（个人、角色、部门）
        </Paragraph>
        <Paragraph>
          3. 支持通知内容模板和变量替换
        </Paragraph>
      </Typography>
    </Card>
  );
};

export default NotificationPage;