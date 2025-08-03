import React, { useState, useEffect } from 'react';
import { Card, message } from 'antd';
// ✨ 1. 从 react-router-dom 导入 useLocation
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  EyeOutlined, 
  CheckOutlined, 
  CloseOutlined 
} from '@ant-design/icons';
import DataTable from '../components/DataTable';
import StatusIndicator from '../components/StatusIndicator';
import { fetchPendingApprovals, approveLeaveRequest, rejectLeaveRequest } from '../api/leaveRequest';

/**
 * 待审批请假申请页面
 */
const PendingApprovalsPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  
  const navigate = useNavigate();
  // ✨ 2. 获取 location 对象，它将作为 useEffect 的依赖
  const location = useLocation();

  // 获取待审批的请假申请列表
  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const { current, pageSize, ...filters } = params;
      const response = await fetchPendingApprovals({
        page: current || 1,
        pageSize: pageSize || 10,
        ...filters
      });
      
      setData(response.data || []);
      setPagination(prev => ({ // 使用函数式更新，避免 pagination 状态依赖问题
        ...prev,
        current: response.current_page || 1,
        pageSize: response.page_size || 10,
        total: response.total || 0
      }));
    } catch (error) {
      message.error('获取待审批列表失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✨ 3. 修改 useEffect
  useEffect(() => {
    // 这个 effect 会在组件首次加载时，以及每次 location 改变时（即导航到此页面时）执行
    console.log('🔄 Navigated to PendingApprovalsPage, fetching fresh data...');
    fetchData({ current: 1, pageSize: 10 }); // 每次进入页面，都从第一页开始加载最新数据
  }, [location]); // 将 location 添加到依赖数组

  // 处理表格变化（排序、筛选、分页）
  const handleTableChange = (newPagination, filters, sorter) => {
    // 分页、排序、筛选时，我们不需要 location 变化，所以这个逻辑保持独立
    // fetchData 会更新 pagination state，这个 state 会被 DataTable 组件消费
    fetchData({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
      sortField: sorter.field,
      sortOrder: sorter.order,
      ...filters,
    });
  };

  // 查看详情 - 接收单个 record 对象
  const handleViewDetail = (record) => {
    if (record && record.id) {
      navigate(`/detail/${record.id}`);
    } else {
      console.error("无法跳转详情页，记录或记录ID无效", record);
      message.error("无法查看详情，缺少申请ID。");
    }
  };

  // 审批通过 - 接收单个 record 对象
  const handleApprove = async (record) => {
    if (!record || !record.id) {
      message.error('审批失败：无法获取到当前记录的ID。');
      return;
    }
    try {
      await approveLeaveRequest(record.id, { comment: '同意' });
      message.success('已审批通过');
      // 审批成功后，刷新当前页的数据
      fetchData({ current: pagination.current, pageSize: pagination.pageSize }); 
    } catch (error) {
      message.error('审批失败: ' + error.message);
    }
  };

  // 审批拒绝 - 接收单个 record 对象
  const handleReject = async (record) => {
    if (!record || !record.id) {
      message.error('审批失败：无法获取到当前记录的ID。');
      return;
    }
    try {
      await rejectLeaveRequest(record.id, { comment: '不同意' });
      message.success('已审批拒绝');
      // 拒绝成功后，刷新当前页的数据
      fetchData({ current: pagination.current, pageSize: pagination.pageSize });
    } catch (error) {
      message.error('审批失败: ' + error.message);
    }
  };

  // 表格列定义
  const columns = [
    { title: '申请编号', dataIndex: 'id', key: 'id', width: 100 },
    { title: '申请人', dataIndex: 'applicantName', key: 'applicantName', width: 120, searchable: true },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 150,
      filters: [
        { text: '研发部', value: '研发部' },
        { text: '市场部', value: '市场部' },
        { text: '人事部', value: '人事部' },
        { text: '财务部', value: '财务部' },
      ],
    },
    { title: '请假类型', dataIndex: 'leaveType', key: 'leaveType', width: 120 },
    { title: '开始日期', dataIndex: 'startDate', key: 'startDate', width: 120, type: 'date', sorter: true },
    { title: '结束日期', dataIndex: 'endDate', key: 'endDate', width: 120, type: 'date' },
    { title: '请假天数', dataIndex: 'duration', key: 'duration', width: 100, sorter: true },
    { title: '申请时间', dataIndex: 'createdAt', key: 'createdAt', width: 180, type: 'datetime', sorter: true },
    { title: '状态', dataIndex: 'status', key: 'status', width: 120, render: (status) => <StatusIndicator status={status} /> },
    {
      title: '操作',
      key: 'action',
      width: 200,
      type: 'actions',
      actions: [
        {
          key: 'view',
          label: '查看',
          icon: <EyeOutlined />,
          onClick: (records) => {
            if (records && records.length > 0) {
              handleViewDetail(records[0]);
            }
          },
        },
        {
          key: 'approve',
          label: '通过',
          icon: <CheckOutlined />,
          type: 'primary',
          onClick: (records) => {
            if (records && records.length > 0) {
              handleApprove(records[0]);
            }
          },
          needConfirm: true,
          confirmTitle: '确认通过',
          confirmContent: '确定要通过此申请吗？',
        },
        {
          key: 'reject',
          label: '拒绝',
          icon: <CloseOutlined />,
          danger: true,
          onClick: (records) => {
            if (records && records.length > 0) {
              handleReject(records[0]);
            }
          },
          needConfirm: true,
          confirmTitle: '确认拒绝',
          confirmContent: '确定要拒绝此申请吗？',
        },
      ],
    },
  ];

  return (
    <Card title="待审批的请假申请">
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        onRowClick={handleViewDetail}
        rowKey="id"
      />
    </Card>
  );
};

export default PendingApprovalsPage;