import React from 'react';
import { Timeline, Card, Typography, Avatar, Space, Divider } from 'antd';
import { 
  CheckCircleFilled, 
  CloseCircleFilled, 
  ClockCircleFilled, 
  UserOutlined,
  FormOutlined,
  CommentOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Text, Paragraph } = Typography;

/**
 * 审批流程历史组件
 * @param {Array} historyData - 历史数据数组
 * @param {String} title - 标题
 * @param {Boolean} showCard - 是否显示卡片容器
 * @param {String} mode - 时间轴模式，可选 'left', 'right', 'alternate'
 * @param {Boolean} reverse - 是否倒序显示
 */
const WorkflowHistory = ({
  historyData = [],
  title = '审批历史',
  showCard = true,
  mode = 'left',
  reverse = false
}) => {
  // 如果没有历史数据，显示空状态
  if (!historyData || historyData.length === 0) {
    return showCard ? (
      <Card title={title}>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Text type="secondary">暂无审批记录</Text>
        </div>
      </Card>
    ) : (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <Text type="secondary">暂无审批记录</Text>
      </div>
    );
  }

  // 根据操作类型获取图标
  const getActionIcon = (action) => {
    switch (action) {
      case 'submit':
        return <FormOutlined style={{ color: '#1890ff' }} />;
      case 'approve':
        return <CheckCircleFilled style={{ color: '#52c41a' }} />;
      case 'reject':
        return <CloseCircleFilled style={{ color: '#f5222d' }} />;
      case 'comment':
        return <CommentOutlined style={{ color: '#722ed1' }} />;
      case 'pending':
      default:
        return <ClockCircleFilled style={{ color: '#faad14' }} />;
    }
  };

  // 根据操作类型获取颜色
  const getActionColor = (action) => {
    switch (action) {
      case 'submit':
        return 'blue';
      case 'approve':
        return 'green';
      case 'reject':
        return 'red';
      case 'comment':
        return 'purple';
      case 'pending':
      default:
        return 'orange';
    }
  };

  // 渲染时间轴项
  const renderTimelineItem = (item, index) => {
    const { action, user, timestamp, comment, status } = item;
    
    // 格式化时间
    const formattedTime = timestamp ? moment(timestamp).format('YYYY-MM-DD HH:mm:ss') : '';
    
    // 根据操作类型获取操作文本
    const getActionText = () => {
      switch (action) {
        case 'submit':
          return '提交了申请';
        case 'approve':
          return '审批通过';
        case 'reject':
          return '审批拒绝';
        case 'comment':
          return '添加了评论';
        case 'pending':
          return '等待审批';
        default:
          return action || '未知操作';
      }
    };

    return (
      <Timeline.Item 
        key={index} 
        color={getActionColor(action)}
        dot={getActionIcon(action)}
      >
        <div style={{ marginBottom: 8 }}>
          <Space>
            {user && (
              <>
                <Avatar size="small" icon={<UserOutlined />} src={user.avatar} />
                <Text strong>{user.name || '未知用户'}</Text>
              </>
            )}
            <Text>{getActionText()}</Text>
            {status && <Text type="secondary">({status})</Text>}
          </Space>
        </div>
        
        {comment && (
          <Paragraph 
            style={{ 
              background: '#f5f5f5', 
              padding: '8px 12px', 
              borderRadius: 4,
              marginBottom: 8
            }}
          >
            {comment}
          </Paragraph>
        )}
        
        <Text type="secondary">{formattedTime}</Text>
      </Timeline.Item>
    );
  };

  // 渲染时间轴
  const renderTimeline = () => {
    // 根据reverse属性决定是否倒序显示
    const sortedData = [...historyData];
    if (reverse) {
      sortedData.reverse();
    }

    return (
      <Timeline mode={mode}>
        {sortedData.map((item, index) => renderTimelineItem(item, index))}
      </Timeline>
    );
  };

  // 根据showCard属性决定是否显示卡片容器
  if (showCard) {
    return (
      <Card 
        title={title}
        style={{ marginTop: 16 }}
      >
        {renderTimeline()}
      </Card>
    );
  }

  return (
    <div style={{ marginTop: 16 }}>
      {title && (
        <>
          <Divider orientation="left">{title}</Divider>
        </>
      )}
      {renderTimeline()}
    </div>
  );
};

export default WorkflowHistory;


// 这个 WorkflowHistory 组件实现了以下功能：

// 1. 使用时间轴展示审批流程的历史记录
// 2. 支持不同类型的操作（提交、审批通过、审批拒绝、评论等）
// 3. 显示操作人、操作时间、操作类型和评论内容
// 4. 支持卡片容器和普通容器两种展示方式
// 5. 支持正序和倒序显示
// 6. 支持不同的时间轴模式（左侧、右侧、交替）
// 7. 支持空数据状态展示
// 这个组件可以清晰地展示请假申请的审批流程历史，让用户了解申请的处理进度和结果。