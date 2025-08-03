// src/pages/MyRequestsPage.jsx

import React, { useState, useEffect } from 'react';
import { Card, message } from 'antd'; // 移除了 Button 和 Tooltip, Space 的导入，因为 DataTable 内部处理了
import { useNavigate } from 'react-router-dom';
import { 
  EyeOutlined, 
  DeleteOutlined, 
  PlusOutlined 
} from '@ant-design/icons';
import DataTable from '../components/DataTable';
import StatusIndicator from '../components/StatusIndicator';
import { fetchMyLeaveRequests, withdrawLeaveRequest } from '../api/leaveRequest';

/**
 * 我的请假申请页面
 */
const MyRequestsPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  
  const navigate = useNavigate();

  // 获取我的请假申请列表
  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const { current, pageSize, ...filters } = params;
      const response = await fetchMyLeaveRequests({
        page: current || 1,
        pageSize: pageSize || 10,
        ...filters
      });
      
      setData(response.data || []);
      setPagination({
        ...pagination,
        current: response.current_page || 1,
        pageSize: response.page_size || 10,
        total: response.total || 0
      });
    } catch (error) {
      message.error('获取请假申请列表失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData({ current: pagination.current, pageSize: pagination.pageSize });
  }, []); // 依赖项改为空数组，初始加载一次

  // 处理表格变化（排序、筛选、分页）
  const handleTableChange = (pagination, filters, sorter) => {
    fetchData({
      current: pagination.current,
      pageSize: pagination.pageSize,
      sortField: sorter.field,
      sortOrder: sorter.order,
      ...filters,
    });
  };

  // 查看详情 - 这个函数现在接收一个 record 对象
  const handleViewDetail = (record) => {
    // 进行安全检查，确保 record 和 record.id 存在
    if (record && record.id) {
      navigate(`/detail/${record.id}`);
    } else {
      console.error("无法跳转详情页，记录或记录ID无效", record);
      message.error("无法查看详情，缺少申请ID。");
    }
  };

  // 撤回申请 - 这个函数现在接收一个 record 对象
  const handleWithdraw = async (record) => {
    try {
      await withdrawLeaveRequest(record.id);
      message.success('申请已撤回');
      fetchData({ current: pagination.current, pageSize: pagination.pageSize }); // 刷新数据
    } catch (error) {
      message.error('撤回申请失败: ' + error.message);
    }
  };

  // 新建申请
  const handleCreateNew = () => {
    navigate('/submit');
  };

  // 表格列定义
  const columns = [
    { title: '申请编号', dataIndex: 'id', key: 'id', width: 100 },
    { title: '请假类型', dataIndex: 'leaveType', key: 'leaveType', width: 120 },
    { title: '开始日期', dataIndex: 'startDate', key: 'startDate', width: 120, type: 'date', sorter: true },
    { title: '结束日期', dataIndex: 'endDate', key: 'endDate', width: 120, type: 'date' },
    { title: '请假天数', dataIndex: 'duration', key: 'duration', width: 100, sorter: true },
    { title: '申请原因', dataIndex: 'reason', key: 'reason', ellipsis: true },
    { title: '申请时间', dataIndex: 'createdAt', key: 'createdAt', width: 180, type: 'datetime', sorter: true },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      width: 120,
      render: (status) => <StatusIndicator status={status} />,
      filters: [
        { text: '待审批', value: 'pending' },
        { text: '审批中', value: 'processing' },
        { text: '已通过', value: 'approved' },
        { text: '已拒绝', value: 'rejected' },
        { text: '已取消', value: 'cancelled' },
      ],
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      type: 'actions', // 告知 DataTable 这是一个操作列
      actions: [ // 定义具体的操作按钮
        {
          key: 'view',
          label: '查看',
          icon: <EyeOutlined />,
          /**
           * BUG修复关键点：
           * DataTable 组件的行内操作按钮 onClick 回调，会统一传递一个包含单条记录的数组作为参数，
           * 即 records = [record]。这是为了与顶部批量操作（可能选择多行）保持参数结构一致。
           * 因此，我们需要从这个数组中取出第一个元素 records[0] 来获取当前行的记录对象。
           */
          onClick: (records) => {
            if (records && records.length > 0) {
              handleViewDetail(records[0]);
            }
          },
        },
        {
          key: 'withdraw',
          label: '撤回',
          icon: <DeleteOutlined />,
          danger: true,
          condition: (record) => ['pending', 'processing'].includes(record.status), // 只有待审批和审批中的申请可以撤回
          needConfirm: true,
          confirmTitle: '确认撤回',
          confirmContent: '确定要撤回此申请吗？撤回后需要重新提交。',
          /**
           * BUG修复关键点：
           * 同上，我们从 records 数组中获取第一个（也是唯一一个）元素来执行操作。
           */
          onClick: (records) => {
            if (records && records.length > 0) {
              handleWithdraw(records[0]);
            }
          },
        },
      ],
    },
  ];

  // 表格顶部操作按钮
  const tableActions = [
    {
      key: 'create',
      label: '新建申请',
      type: 'primary',
      icon: <PlusOutlined />,
      onClick: handleCreateNew,
    },
  ];

  return (
    <Card title="我的请假申请">
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        onRowClick={handleViewDetail} // 点击整行依然可以查看详情
        actions={tableActions}
        rowKey="id"
      />
    </Card>
  );
};

export default MyRequestsPage;