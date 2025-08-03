import React from 'react';
import { Form, Input, Select, DatePicker, Space, Card } from 'antd';

const ComponentProperties = ({ component, onUpdate }) => {
  const [form] = Form.useForm();

  const handleValuesChange = (changedValues, allValues) => {
    onUpdate({ ...component, properties: allValues });
  };

  const renderProperties = () => {
    if (!component) return null;

    const { type, properties = {} } = component;

    switch (type) {
      case 'input':
        return (
          <Form
            form={form}
            initialValues={properties}
            onValuesChange={handleValuesChange}
          >
            <Form.Item label="标签" name="label">
              <Input placeholder="请输入标签文本" />
            </Form.Item>
            <Form.Item label="占位符" name="placeholder">
              <Input placeholder="请输入占位符文本" />
            </Form.Item>
            <Form.Item label="是否必填" name="required" valuePropName="checked">
              <Select>
                <Select.Option value={true}>是</Select.Option>
                <Select.Option value={false}>否</Select.Option>
              </Select>
            </Form.Item>
          </Form>
        );

      case 'approval':
        return (
          <Form
            form={form}
            initialValues={properties}
            onValuesChange={handleValuesChange}
          >
            <Form.Item label="审批人" name="approvers">
              <Select mode="multiple" placeholder="选择审批人">
                <Select.Option value="manager">直接主管</Select.Option>
                <Select.Option value="hr">HR专员</Select.Option>
                <Select.Option value="director">部门总监</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="审批期限" name="deadline">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="审批说明" name="description">
              <Input.TextArea rows={4} placeholder="请输入审批说明" />
            </Form.Item>
          </Form>
        );

      case 'notification':
        return (
          <Form
            form={form}
            initialValues={properties}
            onValuesChange={handleValuesChange}
          >
            <Form.Item label="通知方式" name="methods">
              <Select mode="multiple" placeholder="选择通知方式">
                <Select.Option value="email">邮件</Select.Option>
                <Select.Option value="sms">短信</Select.Option>
                <Select.Option value="system">系统消息</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="通知对象" name="recipients">
              <Select mode="multiple" placeholder="选择通知对象">
                <Select.Option value="assignee">任务负责人</Select.Option>
                <Select.Option value="manager">直接主管</Select.Option>
                <Select.Option value="department">部门成员</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="通知模板" name="template">
              <Input.TextArea rows={4} placeholder="请输入通知内容模板" />
            </Form.Item>
          </Form>
        );

      default:
        return (
          <div style={{ color: '#999', textAlign: 'center' }}>
            暂不支持该组件的属性配置
          </div>
        );
    }
  };

  return (
    <Card title="组件属性" size="small">
      <Space direction="vertical" style={{ width: '100%' }}>
        {renderProperties()}
      </Space>
    </Card>
  );
};

export default ComponentProperties;