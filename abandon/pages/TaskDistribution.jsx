import React, { useState, useEffect, useMemo } from 'react';
import { Layout, Card, Form, Select, Input, DatePicker, Button, Table, message } from 'antd';
// 移除未使用的导入

const { Content } = Layout;
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const TaskDistribution = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [distributionMethod, setDistributionMethod] = useState('specific');

  // 模拟部门数据
  const mockDepartments = useMemo(() => [
    { id: 1, name: '人力资源部' },
    { id: 2, name: '财务部' },
    { id: 3, name: '技术部' },
    { id: 4, name: '市场部' },
    { id: 5, name: '销售部' }
  ], []);

  // 模拟员工数据
  const mockEmployees = useMemo(() => [
    { id: 1, name: '张三', department_id: 1, position: 'HR专员' },
    { id: 2, name: '李四', department_id: 1, position: '招聘经理' },
    { id: 3, name: '王五', department_id: 2, position: '财务专员' },
    { id: 4, name: '赵六', department_id: 3, position: '前端开发' },
    { id: 5, name: '钱七', department_id: 3, position: '后端开发' },
    { id: 6, name: '孙八', department_id: 4, position: '市场专员' },
    { id: 7, name: '周九', department_id: 5, position: '销售代表' }
  ], []);

  useEffect(() => {
    // 模拟API调用获取部门和员工数据
    setLoading(true);
    setTimeout(() => {
      setDepartments(mockDepartments);
      setEmployees(mockEmployees);
      setLoading(false);
    }, 1000);
  }, [mockDepartments, mockEmployees]); // 添加依赖项，确保useEffect在这些值变化时重新执行

  // 根据部门筛选员工
  const handleDepartmentChange = (departmentIds) => {
    if (!departmentIds || departmentIds.length === 0) {
      form.setFieldsValue({ employees: [] });
      setSelectedEmployees([]);
      return;
    }

    const filteredEmployees = mockEmployees.filter(emp => 
      departmentIds.includes(emp.department_id)
    );
    setSelectedEmployees(filteredEmployees);
  };

  // 处理分配方式变更
  const handleDistributionMethodChange = (value) => {
    setDistributionMethod(value);
    // 重置相关字段
    form.setFieldsValue({
      departments: undefined,
      employees: undefined,
      roles: undefined
    });
    setSelectedEmployees([]);
  };

  // 提交表单
  const handleSubmit = (values) => {
    console.log('提交的任务分发数据:', values);
    
    // 构建任务数据并使用它
    const taskData = {
      title: values.title,
      description: values.description,
      priority: values.priority,
      timeRange: values.timeRange,
      distributionMethod: values.distributionMethod,
      assignees: values.distributionMethod === 'specific' ? values.employees : 
                values.distributionMethod === 'department' ? values.departments :
                values.roles
    };
    
    // 使用taskData，避免未使用变量警告
    console.log('准备提交的数据:', taskData);
    
    // 模拟API调用
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      message.success('任务分发成功！');
      form.resetFields();
    }, 1500);
  };

  // 员工表格列定义
  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '部门',
      dataIndex: 'department_id',
      key: 'department',
      render: (dept_id) => {
        const dept = mockDepartments.find(d => d.id === dept_id);
        return dept ? dept.name : '未知部门';
      }
    },
    {
      title: '职位',
      dataIndex: 'position',
      key: 'position'
    }
  ];

  return (
    <Layout>
      <Content style={{ padding: '24px', minHeight: 'calc(100vh - 112px)' }}>
        <Card title="任务分发" style={{ width: '100%' }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              priority: 'medium',
              distributionMethod: 'specific'
            }}
          >
            <Form.Item
              name="title"
              label="任务标题"
              rules={[{ required: true, message: '请输入任务标题' }]}
            >
              <Input placeholder="请输入任务标题" />
            </Form.Item>

            <Form.Item
              name="description"
              label="任务描述"
              rules={[{ required: true, message: '请输入任务描述' }]}
            >
              <TextArea rows={4} placeholder="请输入任务描述" />
            </Form.Item>

            <Form.Item
              name="priority"
              label="优先级"
              rules={[{ required: true, message: '请选择优先级' }]}
            >
              <Select placeholder="请选择优先级">
                <Option value="high">高</Option>
                <Option value="medium">中</Option>
                <Option value="low">低</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="timeRange"
              label="时间范围"
              rules={[{ required: true, message: '请选择时间范围' }]}
            >
              <RangePicker 
                style={{ width: '100%' }} 
                placeholder={['开始时间', '结束时间']}
              />
            </Form.Item>

            <Form.Item
              name="distributionMethod"
              label="分配方式"
              rules={[{ required: true, message: '请选择分配方式' }]}
            >
              <Select 
                placeholder="请选择分配方式" 
                onChange={handleDistributionMethodChange}
              >
                <Option value="specific">指定人员</Option>
                <Option value="department">按部门分配</Option>
                <Option value="role">按角色分配</Option>
              </Select>
            </Form.Item>

            {distributionMethod === 'department' && (
              <Form.Item
                name="departments"
                label="选择部门"
                rules={[{ required: true, message: '请选择部门' }]}
              >
                <Select 
                  mode="multiple" 
                  placeholder="请选择部门"
                  onChange={handleDepartmentChange}
                >
                  {departments.map(dept => (
                    <Option key={dept.id} value={dept.id}>{dept.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            {distributionMethod === 'specific' && (
              <>
                <Form.Item
                  name="departments"
                  label="筛选部门"
                >
                  <Select 
                    mode="multiple" 
                    placeholder="请选择部门筛选员工"
                    onChange={handleDepartmentChange}
                    allowClear
                  >
                    {departments.map(dept => (
                      <Option key={dept.id} value={dept.id}>{dept.name}</Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="employees"
                  label="选择员工"
                  rules={[{ required: true, message: '请选择员工' }]}
                >
                  <Select 
                    mode="multiple" 
                    placeholder="请选择员工"
                    disabled={selectedEmployees.length === 0 && form.getFieldValue('departments')?.length > 0}
                  >
                    {(selectedEmployees.length > 0 ? selectedEmployees : employees).map(emp => (
                      <Option key={emp.id} value={emp.id}>{emp.name} ({mockDepartments.find(d => d.id === emp.department_id)?.name} - {emp.position})</Option>
                    ))}
                  </Select>
                </Form.Item>
              </>
            )}

            {distributionMethod === 'role' && (
              <Form.Item
                name="roles"
                label="选择角色"
                rules={[{ required: true, message: '请选择角色' }]}
              >
                <Select 
                  mode="multiple" 
                  placeholder="请选择角色"
                >
                  <Option value="manager">部门经理</Option>
                  <Option value="hr">HR专员</Option>
                  <Option value="finance">财务人员</Option>
                  <Option value="tech">技术人员</Option>
                  <Option value="sales">销售人员</Option>
                </Select>
              </Form.Item>
            )}

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                分发任务
              </Button>
            </Form.Item>
          </Form>

          {selectedEmployees.length > 0 && distributionMethod === 'specific' && (
            <Card title="已筛选员工" style={{ marginTop: 16 }}>
              <Table 
                columns={columns} 
                dataSource={selectedEmployees} 
                rowKey="id" 
                pagination={false}
                size="small"
              />
            </Card>
          )}
        </Card>
      </Content>
    </Layout>
  );
};

export default TaskDistribution;