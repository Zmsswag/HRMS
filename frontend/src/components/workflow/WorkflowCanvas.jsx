// frontend\src\components\workflow\WorkflowCanvas.jsx

import React, { useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button, Tooltip } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined, FullscreenOutlined } from '@ant-design/icons';
import CustomNodeTypes from './CustomNodeTypes';

/**
 * 工作流画布组件
 * 使用 ReactFlow 渲染工作流图
 * @param {Array} nodes - 节点数组
 * @param {Array} edges - 边数组
 * @param {Function} onNodesChange - 节点变化回调
 * @param {Function} onEdgesChange - 边变化回调
 * @param {Function} onConnect - 连接创建回调
 * @param {Function} onSelectionChange - 选择变更回调
 * @param {Function} onAddNode - 添加节点回调
 * @param {Object} nodeTypes - 自定义节点类型映射
 */
const WorkflowCanvas = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onSelectionChange,
  onAddNode,
  nodeTypes: availableNodeTypes = []
}) => {
  const reactFlowWrapper = useRef(null);
  const { project, fitView, zoomIn, zoomOut } = useReactFlow();
  
  // 自定义节点类型映射
  const customNodeTypes = CustomNodeTypes;
  
  
  // 处理拖拽放置
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  // 处理放置
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const nodeType = event.dataTransfer.getData('application/reactflow');
      
      // 检查是否有效的节点类型
      if (!nodeType) return;
      
      // 计算放置位置
      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top
      });
      
      // 调用添加节点回调
      onAddNode(nodeType, position);
    },
    [project, onAddNode]
  );
  
  return (
    <div style={{ width: '100%', height: '100%' }} ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={customNodeTypes}
        fitView
        attributionPosition="bottom-right"
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Background />
        <Controls showInteractive={false} />
        <MiniMap />
        <Panel position="top-right">
          <div style={{ display: 'flex', gap: '8px' }}>
            <Tooltip title="放大">
              <Button icon={<ZoomInOutlined />} onClick={() => zoomIn()} />
            </Tooltip>
            <Tooltip title="缩小">
              <Button icon={<ZoomOutOutlined />} onClick={() => zoomOut()} />
            </Tooltip>
            <Tooltip title="适应视图">
              <Button icon={<FullscreenOutlined />} onClick={() => fitView()} />
            </Tooltip>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default function WrappedWorkflowCanvas(props) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvas {...props} />
    </ReactFlowProvider>
  );
}