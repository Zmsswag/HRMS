import React from 'react';
import { Form, Input, Select, Space } from 'antd';

export const ApprovalNode = () => (
  <Form.Item
    label="审批节点"
    name="approval"
    rules={[{ required: true, message: '请配置审批节点' }]}
  >
    <Space direction="vertical" style={{ width: '100%' }}>
      <Select
        placeholder="选择审批人"
        mode="multiple"
        style={{ width: '100%' }}
      >
        <Select.Option value="manager">直接主管</Select.Option>
        <Select.Option value="hr">HR专员</Select.Option>
        <Select.Option value="director">部门总监</Select.Option>
      </Select>
      <Input.TextArea
        placeholder="审批说明"
        rows={3}
      />
    </Space>
  </Form.Item>
);

export const NotificationNode = () => (
  <Form.Item
    label="通知节点"
    name="notification"
    rules={[{ required: true, message: '请配置通知内容' }]}
  >
    <Space direction="vertical" style={{ width: '100%' }}>
      <Select
        placeholder="选择通知方式"
        mode="multiple"
        style={{ width: '100%' }}
      >
        <Select.Option value="email">邮件</Select.Option>
        <Select.Option value="sms">短信</Select.Option>
        <Select.Option value="system">系统消息</Select.Option>
      </Select>
      <Select
        placeholder="选择通知对象"
        mode="multiple"
        style={{ width: '100%' }}
      >
        <Select.Option value="assignee">任务负责人</Select.Option>
        <Select.Option value="manager">直接主管</Select.Option>
        <Select.Option value="department">部门成员</Select.Option>
      </Select>
      <Input.TextArea
        placeholder="通知内容模板"
        rows={3}
      />
    </Space>
  </Form.Item>
);

export const ConditionNode = () => (
  <Form.Item
    label="条件节点"
    name="condition"
    rules={[{ required: true, message: '请配置条件规则' }]}
  >
    <Space direction="vertical" style={{ width: '100%' }}>
      <Select
        placeholder="选择条件类型"
        style={{ width: '100%' }}
      >
        <Select.Option value="status">任务状态</Select.Option>
        <Select.Option value="priority">优先级</Select.Option>
        <Select.Option value="assignee">负责人</Select.Option>
        <Select.Option value="custom">自定义条件</Select.Option>
      </Select>
      <Select
        placeholder="选择操作符"
        style={{ width: '100%' }}
      >
        <Select.Option value="equals">等于</Select.Option>
        <Select.Option value="not_equals">不等于</Select.Option>
        <Select.Option value="contains">包含</Select.Option>
        <Select.Option value="not_contains">不包含</Select.Option>
      </Select>
      <Input placeholder="条件值" />
    </Space>
  </Form.Item>
);

export const AssignmentNode = () => (
  <Form.Item
    label="任务分配"
    name="assignment"
    rules={[{ required: true, message: '请配置任务分配规则' }]}
  >
    <Space direction="vertical" style={{ width: '100%' }}>
      <Select
        placeholder="选择分配方式"
        style={{ width: '100%' }}
      >
        <Select.Option value="specific">指定人员</Select.Option>
        <Select.Option value="role">按角色分配</Select.Option>
        <Select.Option value="department">按部门分配</Select.Option>
        <Select.Option value="auto">自动分配</Select.Option>
      </Select>
      <Select
        placeholder="选择执行人"
        mode="multiple"
        style={{ width: '100%' }}
      >
        <Select.Option value="employee1">张三</Select.Option>
        <Select.Option value="employee2">李四</Select.Option>
        <Select.Option value="employee3">王五</Select.Option>
      </Select>
      <Input.TextArea
        placeholder="分配说明"
        rows={2}
      />
    </Space>
  </Form.Item>
);

// 移除导出，组件本身仍然导出
// workflowComponentMap移到单独的文件中