import React, { useState } from 'react';
import { Layout, Card, Space } from 'antd';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const { Sider, Content } = Layout;

const DraggableComponent = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'move',
    margin: '8px 0'
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

const TaskDesigner = () => {
  const [components, setComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      // 处理拖拽结束后的组件排序
      const oldIndex = components.findIndex(item => item.id === active.id);
      const newIndex = components.findIndex(item => item.id === over.id);
      const newComponents = [...components];
      const [movedItem] = newComponents.splice(oldIndex, 1);
      newComponents.splice(newIndex, 0, movedItem);
      setComponents(newComponents);
    }
  };

  const handleComponentClick = (component) => {
    setSelectedComponent(component);
  };

  return (
    <Layout>
      <Content style={{ padding: '24px', minHeight: 'calc(100vh - 112px)' }}>
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Card title="任务流程设计器" style={{ width: '100%' }}>
              <SortableContext items={components} strategy={verticalListSortingStrategy}>
                {components.map(component => (
                  <DraggableComponent key={component.id} id={component.id}>
                    <Card
                      size="small"
                      onClick={() => handleComponentClick(component)}
                      style={{
                        borderColor: selectedComponent?.id === component.id ? '#1890ff' : '#d9d9d9'
                      }}
                    >
                      {component.type === 'form' && '表单组件'}
                      {component.type === 'approval' && '审批节点'}
                      {component.type === 'notification' && '通知节点'}
                      {/* 根据组件类型渲染不同的内容 */}
                    </Card>
                  </DraggableComponent>
                ))}
              </SortableContext>
            </Card>
          </Space>
        </DndContext>
      </Content>
      <Sider width={300} theme="light" style={{ padding: '24px' }}>
        {selectedComponent ? (
          <Card title="组件属性" size="small">
            {/* 根据选中组件类型显示不同的属性配置表单 */}
          </Card>
        ) : (
          <Card title="组件属性" size="small">
            <div style={{ color: '#999', textAlign: 'center' }}>
              请选择一个组件来配置属性
            </div>
          </Card>
        )}
      </Sider>
    </Layout>
  );
};

export default TaskDesigner;