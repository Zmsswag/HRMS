import React from 'react';
import { Card, Typography, Divider, Form } from 'antd';
import { UploadComponent } from '../components/FormComponents';

const { Title, Paragraph } = Typography;

const UploadPage = () => {
  return (
    <Card title="文件上传组件" bordered={false} style={{ width: '100%' }}>
      <Typography>
        <Title level={4}>文件上传组件介绍</Title>
        <Paragraph>
          文件上传组件用于上传文件到服务器。在人力资源系统中，文件上传常用于简历上传、证件照片上传、合同文档上传等场景。
        </Paragraph>
        <Divider />
        <Title level={4}>组件示例</Title>
      </Typography>
      
      <Form layout="vertical" style={{ maxWidth: 600 }}>
        <UploadComponent />
      </Form>
      
      <Divider />
      <Typography>
        <Title level={4}>使用说明</Title>
        <Paragraph>
          1. 支持单文件和多文件上传
        </Paragraph>
        <Paragraph>
          2. 支持文件类型和大小限制
        </Paragraph>
        <Paragraph>
          3. 支持上传进度显示和文件预览
        </Paragraph>
      </Typography>
    </Card>
  );
};

export default UploadPage;