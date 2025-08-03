// frontend\src\pages\workflow\WorkflowDefinitionsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Table, 
  Button, 
  Space, 
  Card, 
  Typography, 
  Popconfirm, 
  message, 
  Tag, 
  Tooltip,
  Input,
  Row,
  Col
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  CopyOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
// 修改导入路径，使用专用的工作流API
import workflowApi from '../../api/workflowApi';

const { Title } = Typography;
const { Search } = Input;

const WorkflowDefinitionsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [definitions, setDefinitions] = useState([]);
  const [searchText, setSearchText] = useState('');
  
  // 获取工作流定义列表
  const fetchDefinitions = async () => {
    setLoading(true);
    try {
      // 使用workflowApi.definitions.getDefinitions替代api.get
      const response = await workflowApi.definitions.getDefinitions();
      setDefinitions(response.data);
    } catch (error) {
      message.error('获取工作流定义列表失败');
      console.error('获取工作流定义列表失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 初始化加载
  useEffect(() => {
    fetchDefinitions();
  }, []);
  
  // 删除工作流定义
  const handleDelete = async (id) => {
    try {
      // 使用workflowApi.definitions.deleteDefinition替代api.delete
      await workflowApi.definitions.deleteDefinition(id);
      message.success('删除成功');
      fetchDefinitions(); // 重新加载列表
    } catch (error) {
      message.error('删除失败');
      console.error('删除工作流定义失败:', error);
    }
  };
  
  // 复制工作流定义
  const handleDuplicate = async (id) => {
    try {
      // 使用workflowApi.definitions.duplicateDefinition替代api.post
      await workflowApi.definitions.duplicateDefinition(id);
      message.success('复制成功');
      fetchDefinitions(); // 重新加载列表
    } catch (error) {
      message.error('复制失败');
      console.error('复制工作流定义失败:', error);
    }
  };
  
  // 切换工作流定义状态（激活/禁用）
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      // 使用workflowApi.definitions.patchDefinition替代api.patch
      await workflowApi.definitions.patchDefinition(id, {
        is_active: !currentStatus
      });
      message.success(`${currentStatus ? '禁用' : '激活'}成功`);
      fetchDefinitions(); // 重新加载列表
    } catch (error) {
      message.error(`${currentStatus ? '禁用' : '激活'}失败`);
      console.error('更新工作流定义状态失败:', error);
    }
  };
  
  // 搜索过滤
  const filteredDefinitions = definitions.filter((def) => {
    const searchTextLower = searchText.toLowerCase();
    // 确保 name 存在且是字符串类型
    const nameMatch = def.name && typeof def.name === 'string' && def.name.toLowerCase().includes(searchTextLower);
    // 确保 description 存在且是字符串类型
    const descriptionMatch = def.description && typeof def.description === 'string' && def.description.toLowerCase().includes(searchTextLower);
    
    return nameMatch || descriptionMatch;
  });
  
  // 表格列定义
  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <a onClick={() => navigate(`/workflow/designer/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      render: (version) => <Tag color="blue">{version}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive) => (
        isActive ? 
          <Tag color="success" icon={<CheckCircleOutlined />}>激活</Tag> : 
          <Tag color="error" icon={<CloseCircleOutlined />}>禁用</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button 
              icon={<EditOutlined />} 
              size="small" 
              onClick={() => navigate(`/workflow/designer/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="复制">
            <Button 
              icon={<CopyOutlined />} 
              size="small" 
              onClick={() => handleDuplicate(record.id)}
            />
          </Tooltip>
          <Tooltip title={record.is_active ? '禁用' : '激活'}>
            <Button 
              icon={record.is_active ? <CloseCircleOutlined /> : <CheckCircleOutlined />} 
              size="small" 
              onClick={() => handleToggleStatus(record.id, record.is_active)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除此工作流定义吗？"
              description="删除后将无法恢复，且可能影响正在运行的工作流实例。"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button icon={<DeleteOutlined />} size="small" danger />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];
  
  return (
    <Card>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4}>工作流定义管理</Title>
        </Col>
        <Col>
          <Space>
            <Search
              placeholder="搜索工作流定义"
              allowClear
              onSearch={(value) => setSearchText(value)}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchDefinitions}
            >
              刷新
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => navigate('/workflow/designer')}
            >
              新建工作流
            </Button>
          </Space>
        </Col>
      </Row>
      
      <Table
        columns={columns}
        dataSource={filteredDefinitions}
        rowKey="id"
        loading={loading}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
      />
    </Card>
  );
};

export default WorkflowDefinitionsPage;