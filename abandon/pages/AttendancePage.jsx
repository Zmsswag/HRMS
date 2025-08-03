import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Button, Space, DatePicker, Select, Form, Tag } from 'antd';
import { SearchOutlined, ExportOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const AttendancePage = () => {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // 模拟考勤数据
  const mockAttendances = [
    {
      id: 1,
      employeeName: '张三',
      employeeId: 'EMP001',
      department: '人力资源部',
      date: '2023-05-01',
      checkIn: '08:55',
      checkOut: '18:05',
      status: 'normal',
      workHours: 9
    },
    {
      id: 2,
      employeeName: '李四',
      employeeId: 'EMP002',
      department: '财务部',
      date: '2023-05-01',
      checkIn: '09:10',
      checkOut: '18:15',
      status: 'late',
      workHours: 9
    },
    {
      id: 3,
      employeeName: '王五',
      employeeId: 'EMP003',
      department: '技术部',
      date: '2023-05-01',
      checkIn: '08:45',
      checkOut: '18:30',
      status: 'normal',
      workHours: 9.75
    },
    {
      id: 4,
      employeeName: '赵六',
      employeeId: 'EMP004',
      department: '市场部',
      date: '2023-05-01',
      checkIn: '08:50',
      checkOut: '17:45',
      status: 'early',
      workHours: 8.92
    },
    {
      id: 5,
      employeeName: '钱七',
      employeeId: 'EMP005',
      department: '销售部',
      date: '2023-05-01',
      checkIn: '08:30',
      checkOut: '18:00',
      status: 'normal',
      workHours: 9.5
    }
  ];

  useEffect(() => {
    setLoading(true);
    // 模拟API调用
    setTimeout(() => {
      setAttendances(mockAttendances);
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
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '签到时间',
      dataIndex: 'checkIn',
      key: 'checkIn',
    },
    {
      title: '签退时间',
      dataIndex: 'checkOut',
      key: 'checkOut',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'green';
        let text = '正常';
        
        if (status === 'late') {
          color = 'orange';
          text = '迟到';
        } else if (status === 'early') {
          color = 'blue';
          text = '早退';
        } else if (status === 'absent') {
          color = 'red';
          text = '缺勤';
        }
        
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '工时',
      dataIndex: 'workHours',
      key: 'workHours',
    },
  ];

  const handleSearch = (values) => {
    console.log('搜索条件:', values);
    // 这里应该有API调用来根据条件筛选数据
    setLoading(true);
    setTimeout(() => {
      // 模拟筛选结果
      setAttendances(mockAttendances.filter(item => 
        (!values.department || item.department === values.department) &&
        (!values.status || item.status === values.status)
      ));
      setLoading(false);
    }, 1000);
  };

  const handleExport = () => {
    console.log('导出考勤数据');
    // 这里应该有导出功能的实现
  };

  return (
    <Card title="考勤记录管理" bordered={false} style={{ width: '100%' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
          style={{ marginBottom: 16 }}
        >
          <Form.Item name="dateRange" label="日期范围">
            <RangePicker />
          </Form.Item>
          <Form.Item name="department" label="部门">
            <Select style={{ width: 120 }} allowClear>
              <Option value="人力资源部">人力资源部</Option>
              <Option value="财务部">财务部</Option>
              <Option value="技术部">技术部</Option>
              <Option value="市场部">市场部</Option>
              <Option value="销售部">销售部</Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select style={{ width: 120 }} allowClear>
              <Option value="normal">正常</Option>
              <Option value="late">迟到</Option>
              <Option value="early">早退</Option>
              <Option value="absent">缺勤</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              搜索
            </Button>
          </Form.Item>
          <Form.Item>
            <Button icon={<ExportOutlined />} onClick={handleExport}>
              导出
            </Button>
          </Form.Item>
        </Form>
        
        <Table 
          columns={columns} 
          dataSource={attendances} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Space>
    </Card>
  );
};

export default AttendancePage;