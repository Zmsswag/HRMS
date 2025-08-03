import React from 'react';
import { Form, Input, Select, DatePicker, Upload, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

export const InputComponent = () => (
  <Form.Item
    label="输入框"
    name="input"
    rules={[{ required: true, message: '请输入内容' }]}
  >
    <Input placeholder="请输入" />
  </Form.Item>
);

export const SelectComponent = () => (
  <Form.Item
    label="下拉选择"
    name="select"
    rules={[{ required: true, message: '请选择选项' }]}
  >
    <Select placeholder="请选择">
      <Select.Option value="option1">选项1</Select.Option>
      <Select.Option value="option2">选项2</Select.Option>
      <Select.Option value="option3">选项3</Select.Option>
    </Select>
  </Form.Item>
);

export const DatePickerComponent = () => (
  <Form.Item
    label="日期选择"
    name="datePicker"
    rules={[{ required: true, message: '请选择日期' }]}
  >
    <DatePicker style={{ width: '100%' }} />
  </Form.Item>
);

export const UploadComponent = () => (
  <Form.Item
    label="文件上传"
    name="upload"
    valuePropName="fileList"
    getValueFromEvent={e => {
      if (Array.isArray(e)) return e;
      return e?.fileList;
    }}
  >
    <Upload action="/api/upload" listType="text">
      <Button icon={<UploadOutlined />}>点击上传</Button>
    </Upload>
  </Form.Item>
);

// 移除导出，组件本身仍然导出
// componentMap移到单独的文件中