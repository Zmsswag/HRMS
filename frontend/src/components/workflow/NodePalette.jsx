//frontend\src\components\workflow\NodePalette.jsx
import React from 'react';
import { Card, Typography, Space, Divider } from 'antd';
import { 
  UserOutlined, 
  CheckCircleOutlined, 
  QuestionCircleOutlined,
  BellOutlined,
  FormOutlined,
  PlayCircleOutlined,
  StopOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

/**
 * 工作流节点面板组件
 * 显示可用的节点类型，并允许用户拖拽到画布上
 * @param {Array} nodeTypes - 节点类型数组
 */
const NodePalette = ({ nodeTypes = [] }) => {
  // 默认节点类型图标映射
  const defaultNodeIcons = {
    'start': <PlayCircleOutlined style={{ color: '#52c41a' }} />,
    'end': <StopOutlined style={{ color: '#ff4d4f' }} />,
    'approval': <CheckCircleOutlined style={{ color: '#1890ff' }} />,
    'decision': <QuestionCircleOutlined style={{ color: '#faad14' }} />,
    'notification': <BellOutlined style={{ color: '#722ed1' }} />,
    'form': <FormOutlined style={{ color: '#13c2c2' }} />,
    'user_task': <UserOutlined style={{ color: '#eb2f96' }} />
  };

  // 如果没有提供节点类型，使用默认节点类型
  const displayNodeTypes = nodeTypes.length > 0 ? nodeTypes : [
    { type: 'start', label: '开始节点', description: '工作流的起点' },
    { type: 'approval', label: '审批节点', description: '需要用户审批的节点' },
    { type: 'decision', label: '判断节点', description: '根据条件决定流程走向' },
    { type: 'notification', label: '通知节点', description: '发送通知给用户' },
    { type: 'form', label: '表单节点', description: '收集用户输入的表单' },
    { type: 'end', label: '结束节点', description: '工作流的终点' }
  ];

  // 处理节点拖拽开始
  const handleDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div style={{ padding: '16px', height: '100%', overflowY: 'auto' }}>
      <Title level={4}>节点类型</Title>
      <Text type="secondary">拖拽节点到画布创建工作流</Text>
      
      <Divider />
      
      <Space direction="vertical" style={{ width: '100%' }}>
        {displayNodeTypes.map((nodeType) => (
          <Card
            key={nodeType.type}
            size="small"
            style={{ 
              cursor: 'move',
              borderLeft: `3px solid ${nodeType.color || '#1890ff'}`
            }}
            draggable
            onDragStart={(e) => handleDragStart(e, nodeType.type)}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ marginRight: 8 }}>
                {nodeType.icon || defaultNodeIcons[nodeType.type] || <QuestionCircleOutlined />}
              </div>
              <div>
                <div style={{ fontWeight: 'bold' }}>{nodeType.label}</div>
                {nodeType.description && (
                  <div style={{ fontSize: '12px', color: '#00000073' }}>
                    {nodeType.description}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </Space>
    </div>
  );
};

export default NodePalette;