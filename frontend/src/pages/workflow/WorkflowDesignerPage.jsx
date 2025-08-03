// frontend/src/pages/workflow/WorkflowDesignerPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Layout,
  Button,
  Space,
  Input,
  Form,
  message,
  Spin,
  Divider,
  Modal
} from 'antd';
import {
  SaveOutlined,
  ArrowLeftOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNodesState, useEdgesState } from 'reactflow';
import NodePalette from '../../components/workflow/NodePalette';
import WorkflowCanvas from '../../components/workflow/WorkflowCanvas';
import PropertiesPanel from '../../components/workflow/PropertiesPanel';
import workflowApi from '../../api/workflowApi';

const { Header, Sider, Content } = Layout;
const { confirm } = Modal;

const WorkflowDesignerPage = () => {
  const { definitionId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // 状态
  const [loading, setLoading] = useState(!!definitionId); // 如果是编辑页，初始设为 loading
  const [saving, setSaving] = useState(false);
  const [workflowMeta, setWorkflowMeta] = useState({
    name: '',
    description: '',
    version: '1.0',
    is_active: true
  });
  const [nodeTypes, setNodeTypes] = useState([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [elementConfigSchema, setElementConfigSchema] = useState(null);

  // 获取设计器配置
  const fetchDesignerConfig = useCallback(async () => {
    try {
      const response = await workflowApi.definitions.getDesignerConfig();
      if (response && response.data) {
        setNodeTypes(response.data.nodeTypes || []);
      }
    } catch (error) {
      message.error('获取设计器配置失败');
      console.error('获取设计器配置失败:', error);
    }
  }, []);

  // 获取工作流定义
  const fetchWorkflowDefinition = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await workflowApi.definitions.getDefinition(id);
      if (response && response.data) {
        const { name, description, version, is_active, definition_json } = response.data;
        
        setWorkflowMeta({ name, description, version, is_active });
        form.setFieldsValue({ name, description });

        if (definition_json) {
          setNodes(definition_json.nodes || []);
          setEdges(definition_json.edges || []);
        }
      } else {
        throw new Error("获取到的工作流定义数据格式不正确");
      }
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || '获取工作流定义失败，请重试';
        message.error(errorMessage);
        console.error('获取工作流定义失败:', error);
        // 获取失败可以考虑跳转回列表页
        navigate('/workflow/definitions');
    } finally {
      setLoading(false);
    }
  }, [form, setNodes, setEdges, navigate]);

  // 初始化
  useEffect(() => {
    fetchDesignerConfig();

    if (definitionId) {
      fetchWorkflowDefinition(definitionId);
    } else {
      // 新建模式，确保表单是空的
      form.resetFields();
    }
  }, [definitionId, fetchDesignerConfig, fetchWorkflowDefinition, form]);


  // 处理节点添加
  const handleAddNode = useCallback((nodeType, position) => {
    const typeConfig = nodeTypes.find(type => type.type === nodeType);
    if (!typeConfig) return;
    const newNode = {
      id: `node_${Date.now()}`,
      type: nodeType,
      position,
      data: { label: typeConfig.label, ...typeConfig.defaultConfig }
    };
    setNodes(nds => [...nds, newNode]);
  }, [nodeTypes, setNodes]);

  // 处理连接创建
  const handleConnect = useCallback((params) => {
    setEdges(eds => [...eds, {
      id: `edge_${Date.now()}`,
      source: params.source,
      target: params.target,
      type: 'default',
      data: { label: '' }
    }]);
  }, [setEdges]);

  // 处理选择变更
  const handleSelectionChange = useCallback(({ nodes, edges }) => {
    if (nodes.length === 1) {
      setSelectedElement({ ...nodes[0], elementType: 'node' });
      const nodeType = nodes[0].type;
      const typeConfig = nodeTypes.find(type => type.type === nodeType);
      setElementConfigSchema(typeConfig?.configSchema || null);
    } else if (edges.length === 1) {
      setSelectedElement({ ...edges[0], elementType: 'edge' });
      setElementConfigSchema({
        type: 'object',
        properties: {
          label: { type: 'string', title: '标签' },
          condition: { type: 'string', title: '条件表达式' }
        }
      });
    } else {
      setSelectedElement(null);
      setElementConfigSchema(null);
    }
  }, [nodeTypes]);

  // 处理元素更新
  const handleElementUpdate = useCallback((updatedData) => {
    if (!selectedElement) return;
    const updater = (items) => items.map(item =>
        item.id === selectedElement.id
            ? { ...item, data: { ...item.data, ...updatedData } }
            : item
    );
    if (selectedElement.elementType === 'node') {
      setNodes(updater);
    } else if (selectedElement.elementType === 'edge') {
      setEdges(updater);
    }
  }, [selectedElement, setNodes, setEdges]);

  // 保存工作流定义
  const handleSave = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();
      setSaving(true);

      const definitionData = {
        name: values.name,
        description: values.description,
        definition_json: { nodes, edges },
        is_active: workflowMeta.is_active
      };
      
      let resultData;

      if (definitionId) {
        const response = await workflowApi.definitions.updateDefinition(definitionId, definitionData);
        resultData = response.data;
      } else {
        const response = await workflowApi.definitions.createDefinition(definitionData);
        resultData = response.data;
      }

      if (resultData) {
        message.success('工作流定义保存成功');
        // 更新本地元数据，特别是版本号
        setWorkflowMeta(prev => ({ ...prev, version: resultData.version }));

        if (!definitionId && resultData.id) {
          // 创建成功后，使用 replace 跳转，防止用户回退到 "新建" 页面
          navigate(`/workflow/designer/${resultData.id}`, { replace: true });
        }
      } else {
         throw new Error("保存操作未返回有效数据");
      }
    } catch (error) {
      if (error.errorFields) {
        message.error('请完善表单信息');
      } else {
        const errorMessage = error.response?.data?.message || error.message || '保存工作流定义失败，请重试';
        message.error(errorMessage);
        console.error('保存工作流定义失败:', error);
      }
    } finally {
      setSaving(false);
    }
  };

  // 返回列表
  const handleBack = () => {
    // 可以在这里增加一个检查，判断是否有未保存的更改
    confirm({
      title: '确定要离开吗？',
      icon: <ExclamationCircleOutlined />,
      content: '未保存的更改将会丢失。',
      okText: '确定离开',
      cancelText: '取消',
      onOk() {
        navigate('/workflow/definitions');
      }
    });
  };

  return (
    <Layout style={{ height: 'calc(100vh - 64px)' }}>
      <Header style={{ background: '#fff', padding: '0 16px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
              返回
            </Button>
            <Divider type="vertical" />
            <Form form={form} layout="inline">
              <Form.Item
                name="name"
                rules={[{ required: true, message: '请输入工作流名称' }]}
              >
                <Input placeholder="工作流名称" style={{ width: 200 }} />
              </Form.Item>
              <Form.Item name="description">
                <Input placeholder="工作流描述" style={{ width: 300 }} />
              </Form.Item>
            </Form>
          </Space>
          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={handleSave}
            >
              保存
            </Button>
          </Space>
        </div>
      </Header>
      <Layout>
        <Sider width={250} theme="light" style={{ borderRight: '1px solid #f0f0f0', overflowY: 'auto', padding: '16px' }}>
          <NodePalette nodeTypes={nodeTypes} />
        </Sider>
        <Content style={{ position: 'relative' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Spin size="large" tip="加载工作流..." />
            </div>
          ) : (
            <WorkflowCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={handleConnect}
              onSelectionChange={handleSelectionChange}
              onAddNode={handleAddNode}
            />
          )}
        </Content>
        <Sider width={300} theme="light" style={{ borderLeft: '1px solid #f0f0f0', overflowY: 'auto', padding: '16px' }}>
          <PropertiesPanel
            selectedElement={selectedElement}
            elementConfigSchema={elementConfigSchema}
            onElementUpdate={handleElementUpdate}
          />
        </Sider>
      </Layout>
    </Layout>
  );
};

export default WorkflowDesignerPage;