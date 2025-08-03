import React from 'react';
import { Card, Typography, Divider, Form } from 'antd';
import { SelectComponent } from '../components/FormComponents';

const { Title, Paragraph } = Typography;

const SelectPage = () => {
  return (
    <Card title="下拉选择组件" bordered={false} style={{ width: '100%' }}>
      <Typography>
        <Title level={4}>下拉选择组件介绍</Title>
        <Paragraph>
          下拉选择组件用于从预设的选项中选择一个或多个值。在人力资源系统中，下拉选择常用于部门选择、职位选择、学历选择等场景。
        </Paragraph>
        <Divider />
        <Title level={4}>组件示例</Title>
      </Typography>
      
      <Form layout="vertical" style={{ maxWidth: 600 }}>
        <SelectComponent />
      </Form>
      
      <Divider />
      <Typography>
        <Title level={4}>使用说明</Title>
        <Paragraph>
          1. 支持单选和多选模式
        </Paragraph>
        <Paragraph>
          2. 可以设置默认值和占位符文本
        </Paragraph>
        <Paragraph>
          3. 支持搜索功能，方便用户快速查找选项
        </Paragraph>
      </Typography>
    </Card>
  );
};

export default SelectPage;