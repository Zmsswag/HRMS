import React, { useState, useEffect, useMemo } from 'react';
import { Table, Card, Space, Tag, Button, Select } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  // 模拟任务数据
  const mockTasks = useMemo(() => [
    {
      id: 1,
      title: '年度员工满意度调查',
      type: 'form',
      status: 'pending',
      priority: 'high',
      assignee: '张三',
      deadline: '2024-03-25'
    },
    {
      id: 2,
      title: '新员工入职培训计划',
      type: 'workflow',
      status: 'in_progress',
      priority: 'medium',
      assignee: '李四',
      deadline: '2024-03-30'
    },
    {
      id: 3,
      title: '部门KPI考核指标制定',
      type: 'form',
      status: 'completed',
      priority: 'low',
      assignee: '王五',
      deadline: '2024-04-05'
    }
  ], []);

  useEffect(() => {
    // 模拟API调用
    setLoading(true);
    setTimeout(() => {
      setTasks(mockTasks);
      setLoading(false);
    }, 1000);
  }, [mockTasks]); // 添加依赖项，确保useEffect在mockTasks变化时重新执行

  const columns = [
    {
      title: '任务名称',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'form' ? 'blue' : 'green'}>
          {type === 'form' ? '表单任务' : '流程任务'}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          pending: { color: 'orange', text: '待处理' },
          in_progress: { color: 'blue', text: '进行中' },
          completed: { color: 'green', text: '已完成' }
        };
        return (
          <Tag color={statusMap[status].color}>
            {statusMap[status].text}
          </Tag>
        );
      }
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        const priorityMap = {
          high: { color: 'red', text: '高' },
          medium: { color: 'orange', text: '中' },
          low: { color: 'green', text: '低' }
        };
        return (
          <Tag color={priorityMap[priority].color}>
            {priorityMap[priority].text}
          </Tag>
        );
      }
    },
    {
      title: '负责人',
      dataIndex: 'assignee',
      key: 'assignee'
    },
    {
      title: '截止日期',
      dataIndex: 'deadline',
      key: 'deadline'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <a onClick={() => handleEdit(record)}>编辑</a>
          <a onClick={() => handleView(record)}>查看</a>
        </Space>
      )
    }
  ];

  const handleEdit = (record) => {
    navigate(`/designer?taskId=${record.id}`);
  };

  const handleView = () => {
    // 实现查看详情功能
  };

  const handleFilterChange = (value) => {
    setFilter(value);
    // 实现任务筛选功能
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/designer')}
          >
            新建任务
          </Button>
          <Select
            value={filter}
            onChange={handleFilterChange}
            style={{ width: 120 }}
          >
            <Option value="all">全部任务</Option>
            <Option value="pending">待处理</Option>
            <Option value="in_progress">进行中</Option>
            <Option value="completed">已完成</Option>
          </Select>
        </Space>
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          loading={loading}
        />
      </Card>
    </Space>
  );
};

export default TaskList;