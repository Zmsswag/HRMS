import React from 'react';
import { Card, Typography, Divider, Form } from 'antd';
import { InputComponent } from '../components/FormComponents';

const { Title, Paragraph } = Typography;

const InputPage = () => {
  return (
    <Card title="输入框组件" bordered={false} style={{ width: '100%' }}>
      <Typography>
        <Title level={4}>输入框组件介绍</Title>
        <Paragraph>
          输入框组件是最基础的表单元素，用于收集用户的文本输入信息。在人力资源系统中，输入框常用于收集员工姓名、联系方式、地址等基本信息。
        </Paragraph>
        <Divider />
        <Title level={4}>组件示例</Title>
      </Typography>
      
      <Form layout="vertical" style={{ maxWidth: 600 }}>
        <InputComponent />
      </Form>
      
      <Divider />
      <Typography>
        <Title level={4}>使用说明</Title>
        <Paragraph>
          1. 输入框支持必填验证，可以设置错误提示信息
        </Paragraph>
        <Paragraph>
          2. 可以设置占位符文本，提示用户输入内容
        </Paragraph>
        <Paragraph>
          3. 可以限制输入长度，设置前缀和后缀图标
        </Paragraph>
      </Typography>
    </Card>
  );
};

export default InputPage;