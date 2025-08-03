import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Button, Space, Modal, Form, Input, InputNumber, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;
const { Option } = Select;

const DepartmentPage = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);

  // 模拟部门数据
  const mockDepartments = [
    {
      id: 1,
      name: '人力资源部',
      manager: '张三',
      employeeCount: 12,
      description: '负责公司人员招聘、培训、绩效考核等工作',
      location: 'A栋3楼',
      createTime: '2018-01-15'
    },
    {
      id: 2,
      name: '财务部',
      manager: '李四',
      employeeCount: 8,
      description: '负责公司财务管理、预算控制、成本核算等工作',
      location: 'A栋4楼',
      createTime: '2018-01-15'
    },
    {
      id: 3,
      name: '技术部',
      manager: '王五',
      employeeCount: 25,
      description: '负责公司产品研发、技术支持等工作',
      location: 'B栋2楼',
      createTime: '2018-02-20'
    },
    {
      id: 4,
      name: '市场部',
      manager: '赵六',
      employeeCount: 15,
      description: '负责公司市场调研、品牌推广等工作',
      location: 'B栋3楼',
      createTime: '2018-03-10'
    },
    {
      id: 5,
      name: '销售部',
      manager: '钱七',
      employeeCount: 20,
      description: '负责公司产品销售、客户维护等工作',
      location: 'C栋1楼',
      createTime: '2018-04-05'
    }
  ];

  useEffect(() => {
    setLoading(true);
    // 模拟API调用
    setTimeout(() => {
      setDepartments(mockDepartments);
      setLoading(false);
    }, 1000);
  }, []);

  const columns = [
    {
      title: '部门名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '部门主管',
      dataIndex: 'manager',
      key: 'manager',
    },
    {
      title: '员工人数',
      dataIndex: 'employeeCount',
      key: 'employeeCount',
    },
    {
      title: '部门描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '办公地点',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '成立时间',
      dataIndex: 'createTime',
      key: 'createTime',
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

  return (
    <Card title="部门信息管理" bordered={false} style={{ width: '100%' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加部门
          </Button>
        </div>
        
        <Table 
          columns={columns} 
          dataSource={departments} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Space>

      <Modal
        title={editingId ? "编辑部门" : "添加部门"}
        open={visible}
        onOk={handleOk}
        onCancel={() => setVisible(false)}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item name="name" label="部门名称" rules={[{ required: true, message: '请输入部门名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="manager" label="部门主管" rules={[{ required: true, message: '请输入部门主管' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="employeeCount" label="员工人数" rules={[{ required: true, message: '请输入员工人数' }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="description" label="部门描述" rules={[{ required: true, message: '请输入部门描述' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="location" label="办公地点" rules={[{ required: true, message: '请输入办公地点' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="createTime" label="成立时间" rules={[{ required: true, message: '请输入成立时间' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};