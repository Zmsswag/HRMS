import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Button, Space, Modal, Form, Input, InputNumber, Select, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExportOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const SalaryPage = () => {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);

  // 模拟薪资数据
  const mockSalaries = [
    {
      id: 1,
      employeeName: '张三',
      employeeId: 'EMP001',
      department: '人力资源部',
      position: 'HR专员',
      baseSalary: 8000,
      bonus: 2000,
      allowance: 1000,
      insurance: 800,
      tax: 1200,
      netSalary: 9000,
      paymentDate: '2023-05-10',
      status: 'paid'
    },
    {
      id: 2,
      employeeName: '李四',
      employeeId: 'EMP002',
      department: '财务部',
      position: '财务经理',
      baseSalary: 12000,
      bonus: 3000,
      allowance: 1500,
      insurance: 1200,
      tax: 1800,
      netSalary: 13500,
      paymentDate: '2023-05-10',
      status: 'paid'
    },
    {
      id: 3,
      employeeName: '王五',
      employeeId: 'EMP003',
      department: '技术部',
      position: '高级工程师',
      baseSalary: 15000,
      bonus: 5000,
      allowance: 2000,
      insurance: 1500,
      tax: 2500,
      netSalary: 18000,
      paymentDate: '2023-05-10',
      status: 'paid'
    },
    {
      id: 4,
      employeeName: '赵六',
      employeeId: 'EMP004',
      department: '市场部',
      position: '市场专员',
      baseSalary: 9000,
      bonus: 1500,
      allowance: 1000,
      insurance: 900,
      tax: 1300,
      netSalary: 9300,
      paymentDate: '2023-05-10',
      status: 'paid'
    },
    {
      id: 5,
      employeeName: '钱七',
      employeeId: 'EMP005',
      department: '销售部',
      position: '销售代表',
      baseSalary: 7000,
      bonus: 8000,
      allowance: 1000,
      insurance: 700,
      tax: 1800,
      netSalary: 13500,
      paymentDate: '2023-05-10',
      status: 'paid'
    }
  ];

  useEffect(() => {
    setLoading(true);
    // 模拟API调用
    setTimeout(() => {
      setSalaries(mockSalaries);
      setLoading(false);
    }, 1000);
  }, []);

  const columns = [
    {
      title: '员工姓名',
      dataIndex: 'employeeName',
      key: 'employeeName',
    },
    {
      title: '员工ID',
      dataIndex: 'employeeId',
      key: 'employeeId',
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: '职位',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: '基本工资',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      render: (value) => `¥${value.toLocaleString()}`,
    },
    {
      title: '奖金',
      dataIndex: 'bonus',
      key: 'bonus',
      render: (value) => `¥${value.toLocaleString()}`,
    },
    {
      title: '津贴',
      dataIndex: 'allowance',
      key: 'allowance',
      render: (value) => `¥${value.toLocaleString()}`,
    },
    {
      title: '保险',
      dataIndex: 'insurance',
      key: 'insurance',
      render: (value) => `¥${value.toLocaleString()}`,
    },
    {
      title: '税金',
      dataIndex: 'tax',
      key: 'tax',
      render: (value) => `¥${value.toLocaleString()}`,
    },
    {
      title: '实发工资',
      dataIndex: 'netSalary',
      key: 'netSalary',
      render: (value) => `¥${value.toLocaleString()}`,
    },
    {
      title: '发放日期',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span style={{ color: status === 'paid' ? 'green' : 'red' }}>
          {status === 'paid' ? '已发放' : '未发放'}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="danger" icon={<DeleteOutlined />} size="small">删除</Button>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    form.resetFields();
    setEditingId(null);
    setVisible(true);
  };

  const handleEdit = (record) => {
    form.setFieldsValue(record);
    setEditingId(record.id);
    setVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then(values => {
      // 处理表单提交
      console.log('表单值:', values);
      setVisible(false);
      // 这里应该有API调用来保存数据
    }).catch(info => {
      console.log('验证失败:', info);
    });
  };

  const handleExport = () => {
    console.log('导出薪资数据');
    // 这里应该有导出功能的实现
  };

  return (
    <Card title="薪资管理" bordered={false} style={{ width: '100%' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加薪资记录
          </Button>
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            导出薪资数据
          </Button>
        </div>
        
        <Table 
          columns={columns} 
          dataSource={salaries} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1500 }}
        />
      </Space>

      <Modal
        title={editingId ? "编辑薪资记录" : "添加薪资记录"}
        open={visible}
        onOk={handleOk}
        onCancel={() => setVisible(false)}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item name="employeeName" label="员工姓名" rules={[{ required: true, message: '请输入员工姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="employeeId" label="员工ID" rules={[{ required: true, message: '请输入员工ID' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="department" label="部门" rules={[{ required: true, message: '请选择部门' }]}>
            <Select>
              <Option value="人力资源部">人力资源部</Option>
              <Option value="财务部">财务部</Option>
              <Option value="技术部">技术部</Option>
              <Option value="市场部">市场部</Option>
              <Option value="销售部">销售部</Option>
            </Select>
          </Form.Item>
          <Form.Item name="position" label="职位" rules={[{ required: true, message: '请输入职位' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="baseSalary" label="基本工资" rules={[{ required: true, message: '请输入基本工资' }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="bonus" label="奖金">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="allowance" label="津贴">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="insurance" label="保险">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="tax" label="税金">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="netSalary" label="实发工资" rules={[{ required: true, message: '请输入实发工资' }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="paymentDate" label="发放日期" rules={[{ required: true, message: '请选择发放日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select>
              <Option value="paid">已发放</Option>
              <Option value="unpaid">未发放</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default SalaryPage;