import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, Badge, Avatar, Tooltip } from 'antd';
import { 
  UserOutlined, 
  CheckCircleOutlined, 
  QuestionCircleOutlined,
  BellOutlined,
  FormOutlined,
  PlayCircleOutlined,
  StopOutlined
} from '@ant-design/icons';

// 开始节点
const StartNode = memo(({ data, isConnectable }) => {
  return (
    <div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
      />
      <Card
        size="small"
        style={{
          width: 150,
          borderColor: '#52c41a',
          borderRadius: '50%',
          textAlign: 'center',
          padding: '8px'
        }}
      >
        <Avatar
          size={48}
          style={{ backgroundColor: '#52c41a' }}
          icon={<PlayCircleOutlined />}
        />
        <div style={{ marginTop: 8 }}>{data.label || '开始'}</div>
      </Card>
    </div>
  );
});

// 结束节点
const EndNode = memo(({ data, isConnectable }) => {
  return (
    <div>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <Card
        size="small"
        style={{
          width: 150,
          borderColor: '#ff4d4f',
          borderRadius: '50%',
          textAlign: 'center',
          padding: '8px'
        }}
      >
        <Avatar
          size={48}
          style={{ backgroundColor: '#ff4d4f' }}
          icon={<StopOutlined />}
        />
        <div style={{ marginTop: 8 }}>{data.label || '结束'}</div>
      </Card>
    </div>
  );
});

// 审批节点
const ApprovalNode = memo(({ data, isConnectable }) => {
  return (
    <div>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <Card
        size="small"
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />
            {data.label || '审批节点'}
          </div>
        }
        style={{ width: 200, borderColor: '#1890ff' }}
      >
        <div style={{ fontSize: '12px' }}>
          <div>
            <strong>指派给: </strong>
            {data.assignee || '未指定'}
          </div>
          {data.timeout && (
            <div>
              <strong>超时: </strong>
              {data.timeout}小时
            </div>
          )}
        </div>
      </Card>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
      />
    </div>
  );
});

// 判断节点
const DecisionNode = memo(({ data, isConnectable }) => {
  return (
    <div>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <div
        style={{
          width: 150,
          height: 100,
          backgroundColor: '#fff',
          border: '2px solid #faad14',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transform: 'rotate(45deg)',
          position: 'relative'
        }}
      >
        <div style={{ transform: 'rotate(-45deg)', textAlign: 'center' }}>
          <QuestionCircleOutlined style={{ color: '#faad14', fontSize: 24 }} />
          <div>{data.label || '判断节点'}</div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        style={{ left: '30%' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="b"
        style={{ left: '70%' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="c"
        isConnectable={isConnectable}
      />
    </div>
  );
});

// 通知节点
const NotificationNode = memo(({ data, isConnectable }) => {
  return (
    <div>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <Card
        size="small"
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <BellOutlined style={{ color: '#722ed1', marginRight: 8 }} />
            {data.label || '通知节点'}
          </div>
        }
        style={{ width: 200, borderColor: '#722ed1' }}
      >
        <div style={{ fontSize: '12px' }}>
          <div>
            <strong>接收人: </strong>
            {data.recipients || '未指定'}
          </div>
          {data.template && (
            <div>
              <strong>模板: </strong>
              {data.template}
            </div>
          )}
        </div>
      </Card>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
      />
    </div>
  );
});

// 表单节点
const FormNode = memo(({ data, isConnectable }) => {
  return (
    <div>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <Card
        size="small"
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <FormOutlined style={{ color: '#13c2c2', marginRight: 8 }} />
            {data.label || '表单节点'}
          </div>
        }
        style={{ width: 200, borderColor: '#13c2c2' }}
      >
        <div style={{ fontSize: '12px' }}>
          <div>
            <strong>表单: </strong>
            {data.formId || '未指定'}
          </div>
          {data.assignee && (
            <div>
              <strong>指派给: </strong>
              {data.assignee}
            </div>
          )}
        </div>
      </Card>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
      />
    </div>
  );
});

// 默认节点
const DefaultNode = memo(({ data, isConnectable }) => {
  return (
    <div>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <Card
        size="small"
        title={data.label || '节点'}
        style={{ width: 180 }}
      >
        <div style={{ fontSize: '12px' }}>
          {Object.entries(data)
            .filter(([key]) => key !== 'label')
            .map(([key, value]) => (
              <div key={key}>
                <strong>{key}: </strong>
                {String(value)}
              </div>
            ))}
        </div>
      </Card>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
      />
    </div>
  );
});

// 导出所有自定义节点类型
const CustomNodeTypes = {
  start: StartNode,
  end: EndNode,
  approval: ApprovalNode,
  decision: DecisionNode,
  notification: NotificationNode,
  form: FormNode,
  default: DefaultNode
};

export default CustomNodeTypes;