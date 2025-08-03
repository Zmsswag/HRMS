import React from 'react';
import { Card, Typography, Divider, Form } from 'antd';
import { DatePickerComponent } from '../components/FormComponents';

const { Title, Paragraph } = Typography;

const DatePickerPage = () => {
  return (
    <Card title="日期选择组件" bordered={false} style={{ width: '100%' }}>
      <Typography>
        <Title level={4}>日期选择组件介绍</Title>
        <Paragraph>
          日期选择组件用于选择特定的日期或日期范围。在人力资源系统中，日期选择常用于入职日期、生日、合同期限等时间相关信息的收集。
        </Paragraph>
        <Divider />
        <Title level={4}>组件示例</Title>
      </Typography>
      
      <Form layout="vertical" style={{ maxWidth: 600 }}>
        <DatePickerComponent />
      </Form>
      
      <Divider />
      <Typography>
        <Title level={4}>使用说明</Title>
        <Paragraph>
          1. 支持日期、周、月、季度、年等多种选择模式
        </Paragraph>
        <Paragraph>
          2. 支持日期范围选择
        </Paragraph>
        <Paragraph>
          3. 可以设置日期格式和禁用特定日期
        </Paragraph>
      </Typography>
    </Card>
  );
};

export default DatePickerPage;