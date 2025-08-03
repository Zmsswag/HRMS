import React from 'react';
import { Tag, Badge, Tooltip } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  SyncOutlined, 
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

/**
 * 状态指示器组件
 * @param {String} status - 当前状态
 * @param {Object} statusConfig - 状态配置对象
 * @param {String} type - 显示类型，可选 'tag', 'badge', 'text'
 * @param {Boolean} showIcon - 是否显示图标
 * @param {Boolean} showTooltip - 是否显示提示
 */
const StatusIndicator = ({
  status,
  statusConfig = {},
  type = 'tag',
  showIcon = true,
  showTooltip = false
}) => {
  // 默认状态配置
  const defaultStatusConfig = {
    pending: {
      color: 'orange',
      text: '待审批',
      icon: <ClockCircleOutlined />,
      tooltip: '申请正在等待审批'
    },
    processing: {
      color: 'blue',
      text: '审批中',
      icon: <SyncOutlined spin />,
      tooltip: '申请正在审批流程中'
    },
    approved: {
      color: 'green',
      text: '已通过',
      icon: <CheckCircleOutlined />,
      tooltip: '申请已被通过'
    },
    rejected: {
      color: 'red',
      text: '已拒绝',
      icon: <CloseCircleOutlined />,
      tooltip: '申请已被拒绝'
    },
    cancelled: {
      color: 'default',
      text: '已取消',
      icon: <ExclamationCircleOutlined />,
      tooltip: '申请已被取消'
    }
  };

  // 合并默认配置和自定义配置
  const mergedConfig = { ...defaultStatusConfig, ...statusConfig };
  
  // 获取当前状态的配置
  const currentStatusConfig = mergedConfig[status] || {
    color: 'default',
    text: status || '未知状态',
    icon: null,
    tooltip: ''
  };

  // 渲染内容
  const renderContent = () => {
    const { color, text, icon } = currentStatusConfig;
    
    switch (type) {
      case 'tag':
        return (
          <Tag color={color} icon={showIcon ? icon : null}>
            {text}
          </Tag>
        );
      
      case 'badge':
        return (
          <Badge 
            status={color === 'default' ? 'default' : color} 
            text={text} 
          />
        );
      
      case 'text':
        return (
          <span style={{ color: color === 'default' ? '#999' : color }}>
            {showIcon && icon && <span style={{ marginRight: 4 }}>{icon}</span>}
            {text}
          </span>
        );
      
      default:
        return text;
    }
  };

  // 如果需要显示提示，添加Tooltip
  if (showTooltip && currentStatusConfig.tooltip) {
    return (
      <Tooltip title={currentStatusConfig.tooltip}>
        {renderContent()}
      </Tooltip>
    );
  }

  return renderContent();
};

export default StatusIndicator;

// 这个 StatusIndicator 组件实现了以下功能：

// 1. 支持多种状态展示方式：标签、徽章、文本
// 2. 支持自定义状态配置（颜色、文本、图标、提示）
// 3. 支持默认状态配置（待审批、审批中、已通过、已拒绝、已取消）
// 4. 支持是否显示图标和提示