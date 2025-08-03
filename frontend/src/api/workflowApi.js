import api from './axiosConfig';

// 工作流定义相关API
const workflowDefinitionApi = {
  /**
   * 获取所有工作流定义列表
   */
  getDefinitions: () => {
    return api.get('/workflows/definitions');
  },

  /**
   * 根据ID获取单个工作流定义
   * @param {string} definitionId - 工作流定义的唯一ID
   */
  getDefinition: (definitionId) => {
    return api.get(`/workflows/definitions/${definitionId}`);
  },

  /**
   * 创建一个新的工作流定义
   * @param {object} definitionData - 包含名称、描述和JSON定义等数据的对象
   */
  createDefinition: (definitionData) => {
    // URL已规范化，移除了末尾的斜杠
    return api.post('/workflows/definitions', definitionData);
  },

  /**
   * 更新一个已存在的工作流定义
   * @param {string} definitionId - 要更新的工作流定义的ID
   * @param {object} definitionData - 要更新的数据
   */
  updateDefinition: (definitionId, definitionData) => {
    return api.put(`/workflows/definitions/${definitionId}`, definitionData);
  },

  /**
   * 部分更新一个工作流定义（例如，只改变激活状态）
   * @param {string} definitionId - 要更新的工作流定义的ID
   * @param {object} patchData - 包含要修改的字段的对象，如 { is_active: true }
   */
  patchDefinition: (definitionId, patchData) => {
    return api.patch(`/workflows/definitions/${definitionId}`, patchData);
  },

  /**
   * 删除一个工作流定义
   * @param {string} definitionId - 要删除的工作流定义的ID
   */
  deleteDefinition: (definitionId) => {
    return api.delete(`/workflows/definitions/${definitionId}`);
  },

  /**
   * 复制一个工作流定义来创建一个新的
   * @param {string} definitionId - 要复制的源工作流定义的ID
   */
  duplicateDefinition: (definitionId) => {
    return api.post(`/workflows/definitions/${definitionId}/duplicate`);
  },

  /**
   * 获取工作流设计器所需的配置信息（如节点类型）
   */
  getDesignerConfig: () => {
    return api.get('/workflows/designer/config');
  }
};

// 工作流实例相关API
const workflowInstanceApi = {
  /**
   * 获取工作流实例列表，支持分页和筛选
   * @param {object} params - 查询参数，如 { page: 1, pageSize: 10 }
   */
  getInstances: (params) => {
    return api.get('/workflows/instances', { params });
  },

  /**
   * 获取单个工作流实例的详情
   * @param {string} instanceId - 工作流实例的ID
   */
  getInstance: (instanceId) => {
    return api.get(`/workflows/instances/${instanceId}`);
  },

  /**
   * 启动一个新的工作流实例
   * @param {object} startData - 启动工作流所需的数据，如 { definitionId: '...', variables: {...} }
   */
  startWorkflow: (startData) => {
    return api.post('/workflows/instances/start', startData);
  },

  /**
   * 取消一个正在运行的工作流实例
   * @param {string} instanceId - 要取消的工作流实例的ID
   * @param {object} reason - 取消原因，如 { reason: '用户主动取消' }
   */
  cancelInstance: (instanceId, reason) => {
    return api.post(`/workflows/instances/${instanceId}/cancel`, reason);
  },

  /**
   * 获取指定工作流实例的历史记录
   * @param {string} instanceId - 工作流实例的ID
   */
  getInstanceHistory: (instanceId) => {
    return api.get(`/workflows/instances/${instanceId}/history`);
  },

  /**
   * 获取指定工作流实例的当前待办任务
   * @param {string} instanceId - 工作流实例的ID
   */
  getInstanceTasks: (instanceId) => {
    return api.get(`/workflows/instances/${instanceId}/tasks`);
  },

  /**
   * 获取指定工作流实例的可视化流程图（高亮当前节点）
   * @param {string} instanceId - 工作流实例的ID
   */
  getInstanceDiagram: (instanceId) => {
    return api.get(`/workflows/instances/${instanceId}/diagram`);
  }
};

// 工作流任务相关API
const workflowTaskApi = {
  /**
   * 获取任务列表
   * @param {object} params - 查询参数
   */
  getTasks: (params) => {
    return api.get('/workflows/tasks', { params });
  },

  /**
   * 获取单个任务的详情
   * @param {string} taskId - 任务的ID
   */
  getTask: (taskId) => {
    return api.get(`/workflows/tasks/${taskId}`);
  },

  /**
   * 完成一个任务
   * @param {string} taskId - 要完成的任务的ID
   * @param {object} completeData - 完成任务所需的数据，如审批意见、表单数据等
   */
  completeTask: (taskId, completeData) => {
    return api.post(`/workflows/tasks/${taskId}/complete`, completeData);
  },

  /**
   * 将任务分配给某个用户
   * @param {string} taskId - 任务ID
   * @param {object} assignData - 分配信息，如 { userId: '...' }
   */
  assignTask: (taskId, assignData) => {
    return api.post(`/workflows/tasks/${taskId}/assign`, assignData);
  },

  /**
   * 获取我的待办任务
   * @param {string} status - 任务状态，默认为 'pending'
   */
  getMyTasks: (status = 'pending') => {
    return api.get('/workflows/tasks/my', { params: { status } });
  },

  /**
   * 认领一个任务（从未分配到已分配给当前用户）
   * @param {string} taskId - 任务ID
   */
  claimTask: (taskId) => {
    return api.post(`/workflows/tasks/${taskId}/claim`);
  }
};

// 组合并导出所有API
const workflowApi = {
  definitions: workflowDefinitionApi,
  instances: workflowInstanceApi,
  tasks: workflowTaskApi,
};

export default workflowApi;