import React, { useEffect } from 'react';
import { Form, Input, Select, InputNumber, Switch, DatePicker, Button, Divider, Typography, Empty, Card } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

/**
 * 工作流属性面板组件
 * 显示并编辑选中元素的属性
 * @param {Object} selectedElement - 当前选中的节点或边
 * @param {Object} elementConfigSchema - 元素配置schema
 * @param {Function} onElementUpdate - 元素更新回调
 */
const PropertiesPanel = ({
  selectedElement,
  elementConfigSchema,
  onElementUpdate
}) => {
  const [form] = Form.useForm();
  
  // 当选中元素变化时，重置表单
  useEffect(() => {
    if (selectedElement && selectedElement.data) {
      form.setFieldsValue(selectedElement.data);
    } else {
      form.resetFields();
    }
  }, [selectedElement, form]);
  
  // 处理表单值变化
  const handleValuesChange = (changedValues, allValues) => {
    if (onElementUpdate) {
      onElementUpdate(allValues);
    }
  };
  
  // 如果没有选中元素，显示空状态
  if (!selectedElement) {
    return (
      <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Empty description="请选择一个节点或连接线以编辑其属性" />
      </div>
    );
  }
  
  // 根据元素类型显示不同的标题
  const getElementTitle = () => {
    if (selectedElement.elementType === 'node') {
      return `${selectedElement.data?.label || '节点'} 属性`;
    } else {
      return '连接线属性';
    }
  };
  
  // 根据节点类型渲染不同的表单字段
  const renderFormFields = () => {
    // 如果没有配置schema，显示基本属性
    if (!elementConfigSchema) {
      return (
        <>
          <Form.Item name="label" label="标签">
            <Input placeholder="输入标签" />
          </Form.Item>
          {selectedElement.elementType === 'edge' && (
            <Form.Item name="condition" label="条件表达式">
              <TextArea placeholder="输入条件表达式，例如: leave_days > 3" rows={3} />
            </Form.Item>
          )}
        </>
      );
    }
    
    // 根据节点类型渲染特定字段
    switch (selectedElement.type) {
      case 'approval':
        return (
          <>
            <Form.Item name="label" label="标签" rules={[{ required: true }]}>
              <Input placeholder="审批节点名称" />
            </Form.Item>
            {/* <Form.Item name="assignee" label="指派给" rules={[{ required: true }]}>
              <Select placeholder="选择审批人">
                <Option value="requester_manager">申请人直接主管</Option>
                <Option value="department_manager">部门经理</Option>
                <Option value="hr_manager">人事经理</Option>
                <Option value="specific_user">指定用户</Option>
              </Select>
            </Form.Item>
            {selectedElement.data?.assignee === 'specific_user' && (
              <Form.Item name="assignee_id" label="指定用户ID" rules={[{ required: true }]}>
                <Input placeholder="输入用户ID" />
              </Form.Item>
            )} */}
             <Form.Item
              name="approver"
              label="审批人"
              rules={[{ required: true, message: '请输入审批人的名字' }]}
            >
              <Input placeholder="例如: 王五 (部门经理)" />
            </Form.Item>
            <Form.Item name="approval_type" label="审批类型">
              <Select placeholder="选择审批类型">
                <Option value="sequential">顺序审批</Option>
                <Option value="parallel">并行审批(会签)</Option>
              </Select>
            </Form.Item>
            <Form.Item name="timeout" label="超时时间(小时)">
              <InputNumber min={1} max={168} placeholder="超时时间" />
            </Form.Item>
            <Form.Item name="timeout_action" label="超时动作">
              <Select placeholder="选择超时动作">
                <Option value="remind">提醒</Option>
                <Option value="auto_approve">自动批准</Option>
                <Option value="auto_reject">自动驳回</Option>
                <Option value="escalate">上报</Option>
              </Select>
            </Form.Item>
          </>
        );
        
      case 'decision':
        return (
          <>
            <Form.Item name="label" label="标签" rules={[{ required: true }]}>
              <Input placeholder="判断节点名称" />
            </Form.Item>
            <Form.Item name="description" label="描述">
              <TextArea placeholder="描述此判断节点的作用" rows={2} />
            </Form.Item>
            <Text type="secondary">
              注意: 判断条件在连接线上设置，请选择从此节点出发的连接线来设置条件。
            </Text>
          </>
        );
        
      case 'notification':
        return (
          <>
            <Form.Item name="label" label="标签" rules={[{ required: true }]}>
              <Input placeholder="通知节点名称" />
            </Form.Item>
            <Form.Item name="recipients" label="接收人" rules={[{ required: true }]}>
              <Select placeholder="选择接收人" mode="multiple">
                <Option value="requester">申请人</Option>
                <Option value="requester_manager">申请人直接主管</Option>
                <Option value="department_manager">部门经理</Option>
                <Option value="hr">人事部门</Option>
              </Select>
            </Form.Item>
            
            <Form.Item name="template" label="消息模板">
              <Select placeholder="选择消息模板">
                <Option value="leave_approved">请假批准通知</Option>
                <Option value="leave_rejected">请假驳回通知</Option>
                <Option value="leave_pending">请假待审批通知</Option>
                <Option value="custom">自定义模板</Option>
              </Select>
            </Form.Item>
            {selectedElement.data?.template === 'custom' && (
              <Form.Item name="custom_template" label="自定义模板内容">
                <TextArea 
                  placeholder="可使用变量如 {{user_name}}, {{leave_days}}, {{start_date}}" 
                  rows={4} 
                />
              </Form.Item>
            )}
            <Form.Item name="channels" label="通知渠道">
              <Select placeholder="选择通知渠道" mode="multiple" defaultValue={['system']}>
                <Option value="system">系统消息</Option>
                <Option value="email">电子邮件</Option>
                <Option value="sms">短信</Option>
              </Select>
            </Form.Item>
          </>
        );
        
      case 'form':
        return (
          <>
            <Form.Item name="label" label="标签" rules={[{ required: true }]}>
              <Input placeholder="表单节点名称" />
            </Form.Item>
            <Form.Item name="formId" label="表单ID" rules={[{ required: true }]}>
              <Select placeholder="选择表单">
                <Option value="leave_request">请假申请表</Option>
                <Option value="expense_claim">报销申请表</Option>
                <Option value="business_trip">出差申请表</Option>
              </Select>
            </Form.Item>
            <Form.Item name="assignee" label="指派给">
              <Select placeholder="选择表单填写人">
                <Option value="requester">申请人</Option>
                <Option value="requester_manager">申请人直接主管</Option>
                <Option value="specific_role">特定角色</Option>
              </Select>
            </Form.Item>
            {selectedElement.data?.assignee === 'specific_role' && (
              <Form.Item name="role" label="角色">
                <Input placeholder="输入角色名称" />
              </Form.Item>
            )}
            <Form.Item name="required_fields" label="必填字段">
              <Select mode="multiple" placeholder="选择必填字段">
                <Option value="reason">原因</Option>
                <Option value="start_date">开始日期</Option>
                <Option value="end_date">结束日期</Option>
                <Option value="attachment">附件</Option>
              </Select>
            </Form.Item>
          </>
        );
        
      case 'start':
        return (
          <>
            <Form.Item name="label" label="标签">
              <Input placeholder="开始节点名称" />
            </Form.Item>
            <Form.Item name="description" label="描述">
              <TextArea placeholder="描述此工作流的用途" rows={3} />
            </Form.Item>
            <Form.Item name="initiator_roles" label="可发起角色">
              <Select mode="multiple" placeholder="选择可发起此工作流的角色">
                <Option value="all">所有用户</Option>
                <Option value="employee">普通员工</Option>
                <Option value="manager">管理者</Option>
                <Option value="hr">人事部门</Option>
              </Select>
            </Form.Item>
          </>
        );
        
      case 'end':
        return (
          <>
            <Form.Item name="label" label="标签">
              <Input placeholder="结束节点名称" />
            </Form.Item>
            <Form.Item name="description" label="描述">
              <TextArea placeholder="描述此结束节点的状态" rows={2} />
            </Form.Item>
            <Form.Item name="status" label="结束状态">
              <Select placeholder="选择工作流结束状态">
                <Option value="completed">正常完成</Option>
                <Option value="approved">已批准</Option>
                <Option value="rejected">已驳回</Option>
                <Option value="canceled">已取消</Option>
              </Select>
            </Form.Item>
          </>
        );
        
      default:
        // 对于边（连接线）或其他未知类型的节点
        if (selectedElement.elementType === 'edge') {
          return (
            <>
              <Form.Item name="label" label="标签">
                <Input placeholder="连接线标签" />
              </Form.Item>
              <Form.Item name="condition" label="条件表达式">
                <TextArea 
                  placeholder="输入条件表达式，例如: leave_days > 3 && leave_type == 'sick'" 
                  rows={3} 
                />
              </Form.Item>
              <Form.Item name="priority" label="优先级">
                <InputNumber min={1} max={100} placeholder="条件评估优先级" />
              </Form.Item>
              <Form.Item name="description" label="描述">
                <TextArea placeholder="描述此条件的业务含义" rows={2} />
              </Form.Item>
            </>
          );
        } else {
          // 通用节点属性
          return (
            <>
              <Form.Item name="label" label="标签">
                <Input placeholder="节点标签" />
              </Form.Item>
              <Form.Item name="description" label="描述">
                <TextArea placeholder="节点描述" rows={3} />
              </Form.Item>
            </>
          );
        }
    }
  };
  
  return (
    <div style={{ padding: '16px', height: '100%', overflowY: 'auto' }}>
      <Title level={4}>{getElementTitle()}</Title>
      <Text type="secondary">ID: {selectedElement.id}</Text>
      
      <Divider />
      
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
        initialValues={selectedElement.data || {}}
      >
        {renderFormFields()}
      </Form>
      
      {selectedElement.elementType === 'node' && selectedElement.type !== 'start' && selectedElement.type !== 'end' && (
        <div style={{ marginTop: 16 }}>
          <Divider />
          <Card size="small" title="高级选项" bordered={false}>
            <Form.Item name="is_required" valuePropName="checked">
              <Switch checkedChildren="必需节点" unCheckedChildren="可选节点" />
            </Form.Item>
            <Form.Item name="allow_skip" valuePropName="checked">
              <Switch checkedChildren="允许跳过" unCheckedChildren="不可跳过" />
            </Form.Item>
            <Form.Item name="allow_return" valuePropName="checked">
              <Switch checkedChildren="允许退回" unCheckedChildren="不可退回" />
            </Form.Item>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PropertiesPanel;