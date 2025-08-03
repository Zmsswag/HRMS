// src/mock/mockService.js

import { faker } from '@faker-js/faker';
import moment from 'moment';
// ✨ 引入 Node.js 内置模块，用于文件操作
import fs from 'node:fs';
import path from 'node:path';

/**
 * 模拟网络延迟的辅助函数
 */
const sleep = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// ✨ 定义 JSON 文件的存储路径 (相对于项目根目录)
const DB_DIR = path.resolve(process.cwd(), 'mock_db');
const LEAVE_REQUESTS_PATH = path.join(DB_DIR, 'leave_requests.json');
const WORKFLOW_DEFINITIONS_PATH = path.join(DB_DIR, 'workflow_definitions.json');

// ✨ 确保数据库目录存在
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR);
}

/**
 * MockApiService 类
 * 统一管理所有模拟数据和API逻辑
 */
class MockApiService {
  constructor() {
    this.allLeaveRequests = [];
    this.workflowDefinitions = [];
    this.currentUser = {
      name: '张三',
      department: '研发部',
    };

    // ✨ 使用新的文件加载逻辑
    this._loadDataFromFile(LEAVE_REQUESTS_PATH, '_generateInitialLeaveRequests', 'allLeaveRequests');
    this._loadDataFromFile(WORKFLOW_DEFINITIONS_PATH, '_generateInitialWorkflowDefinitions', 'workflowDefinitions');
    this.reloadData();
  }
  reloadData() {
    console.log('🔄 Reloading data from files...');
    this._loadDataFromFile(LEAVE_REQUESTS_PATH, '_generateInitialLeaveRequests', 'allLeaveRequests');
    this._loadDataFromFile(WORKFLOW_DEFINITIONS_PATH, '_generateInitialWorkflowDefinitions', 'workflowDefinitions');
  }
  // --- 数据加载/保存方法 ---
  _loadDataFromFile(filePath, generatorMethod, propertyName) {
    try {
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        this[propertyName] = JSON.parse(fileContent);
      } else {
        this[generatorMethod]();
        this._saveDataToFile(filePath, this[propertyName]);
      }
    } catch (error) {
      console.error(`从 ${filePath} 加载数据失败:`, error);
      this[generatorMethod]();
    }
  }

  _saveDataToFile(filePath, data) {
    try {
      const dataString = JSON.stringify(data, null, 2);
      fs.writeFileSync(filePath, dataString, 'utf-8');
    } catch (error) {
      console.error(`保存数据到 ${filePath} 失败:`, error);
    }
  }
    /**
   * 切换当前模拟的用户
   * @param {string} newName 新的用户名
   */
  async setCurrentUser(newName) {
    if (!newName || typeof newName !== 'string') {
        throw new Error('用户名必须是一个非空字符串');
    }
    console.log(`👤 [MockService] User changed from ${this.currentUser.name} to ${newName}`);
    this.currentUser = {
      name: newName,
      department: '研发部', // 假设部门不变
    };
    this.reloadData(); // 切换用户后重新加载数据，以更新权限等
    return this.currentUser;
  }

  // --- 初始数据生成 ---
  _generateInitialLeaveRequests() {
    const initialData = [
      { id: '1001', applicantName: '张三', status: 'approved', workflowId: 'wf_001' },
      { id: '1002', applicantName: '张三', status: 'rejected', workflowId: 'wf_001' },
      { id: '1003', applicantName: '张三', status: 'pending', currentApprover: this.currentUser.name, workflowId: 'wf_001' },
      { id: '2001', applicantName: '李明', status: 'pending', currentApprover: '张三', workflowId: 'wf_002' },
    ];
    this.allLeaveRequests = initialData.map(item => ({
      ...item,
      id: String(item.id),
      department: '研发部',
      position: '员工',
      leaveType: faker.helpers.arrayElement(['事假', '病假', '年假']),
      startDate: moment().subtract(faker.number.int({ min: 5, max: 30 }), 'days').format('YYYY-MM-DD'),
      endDate: moment().subtract(faker.number.int({ min: 1, max: 4 }), 'days').format('YYYY-MM-DD'),
      duration: faker.number.int({ min: 1, max: 5 }),
      reason: faker.lorem.sentence(),
      isApplicant: item.applicantName === this.currentUser.name,
      createdAt: faker.date.past().toISOString(),
      approvalHistory: this._createHistory(item.status, item.applicantName),
      workflowName: item.workflowId === 'wf_001' ? '标准请假流程' : '长假审批流程',
    }));
  }
  
  _generateInitialWorkflowDefinitions() {
    this.workflowDefinitions = [
      { id: 'wf_001', name: '标准请假流程', description: '适用于3天以内的请假。', version: '1.0', is_active: true, created_at: '2023-10-01T10:00:00Z', updated_at: '2023-10-01T10:00:00Z', definition_json: { nodes: [], edges: [] } },
      { id: 'wf_002', name: '长假审批流程', description: '需要部门经理和HR双重审批。', version: '1.2', is_active: true, created_at: '2023-09-15T14:30:00Z', updated_at: '2023-10-05T11:00:00Z', definition_json: { nodes: [], edges: [] } },
      { id: 'wf_dev_01', name: '研发部快速通道(测试)', description: '研发部门内部测试用流程。', version: '0.5', is_active: false, created_at: '2023-11-01T16:00:00Z', updated_at: '2023-11-01T16:00:00Z', definition_json: { nodes: [], edges: [] } },
    ];
  }

  _createHistory(status, applicantName) {
    const history = [{ action: 'submit', operator: applicantName, timestamp: moment().subtract(2, 'days').format('YYYY-MM-DD HH:mm:ss'), comment: '发起申请' }];
    if (status === 'approved') {
      history.push({ action: 'approve', operator: '部门经理', timestamp: moment().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'), comment: '同意' });
    } else if (status === 'rejected') {
      history.push({ action: 'reject', operator: '部门经理', timestamp: moment().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'), comment: '项目繁忙' });
    }
    return history;
  }

  _updateRequest(id, newStatus, action, comment, operator) {
    const requestIndex = this.allLeaveRequests.findIndex(req => req.id === String(id));
    if (requestIndex === -1) throw new Error('申请不存在');

    const request = this.allLeaveRequests[requestIndex];
    request.status = newStatus;
    
    if (['approved', 'rejected', 'cancelled'].includes(newStatus)) {
      request.currentApprover = this.currentUser.name;
    }

    request.approvalHistory.push({
      action: action,
      operator: operator,
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      comment: comment,
    });
    
    this._saveDataToFile(LEAVE_REQUESTS_PATH, this.allLeaveRequests);
    return request;
  }

  // --- 请假申请 API 实现 ---
  async fetchFormConfig() {
    await sleep();
    const activeWorkflows = this.workflowDefinitions.filter(wf => wf.is_active);
    const workflowOptions = activeWorkflows.map(wf => ({
      label: `${wf.name} (v${wf.version})`,
      value: wf.id,
    }));
    return {
      fields: [
        { name: 'leaveType', label: '请假类型', type: 'select', required: true, options: ['事假', '病假', '年假', '婚假', '产假'].map(item => ({ label: item, value: item }))},
        { name: 'dateRange', label: '请假日期', type: 'dateRange', required: true },
        { name: 'reason', label: '请假原因', type: 'textarea', required: true, props: { rows: 4 } },
        { name: 'workflowId', label: '审批工作流', type: 'select', required: true, options: workflowOptions, props: { placeholder: '请选择一个审批流程' }},
      ]
    };
  }


  /**
   * 提交请假申请（完整版，包含向后兼容逻辑）
   * @param {object} data - 从前端表单提交的数据
   * @returns {Promise<object>} 提交结果
   */
  async submitLeaveRequest(data) {
    // 模拟网络延迟
    await sleep(1000);

    // 从 data 中解构表单字段
    const [startDate, endDate] = data.dateRange;
    const newId = String(Math.max(0, ...this.allLeaveRequests.map(r => Number(r.id))) + 1);
    
    // 1. 查找所选的工作流定义
    const workflowDefinition = this.workflowDefinitions.find(wf => wf.id === data.workflowId);
    if (!workflowDefinition || !workflowDefinition.definition_json) {
      // 如果找不到流程定义或定义为空，直接抛出错误，因为这是无法继续的前提条件
      throw new Error('所选的工作流不存在或定义为空');
    }

    // 2. 解析流程图，寻找第一个审批节点
    const { nodes, edges } = workflowDefinition.definition_json;
    const startNode = nodes.find(n => n.type === 'start');
    
    let approverName = null;
    let firstApprovalNodeId = null; 

    if (startNode) {
        const firstEdge = edges.find(e => e.source === startNode.id);
        if (firstEdge) {
            // 找到开始节点连接的第一个节点，并确认它是审批类型
            const firstApprovalNode = nodes.find(n => n.id === firstEdge.target && n.type === 'approval');
            if (firstApprovalNode) {
                // 成功找到了第一个审批节点
                firstApprovalNodeId = firstApprovalNode.id;
                // 尝试从该节点的 data 中获取 'approver' 字段
                approverName = firstApprovalNode.data?.approver;
            }
        }
    }

    // 3. ✨ 兼容性与健壮性处理 ✨
    //    检查是否成功找到了审批人。如果没有，则优雅地回退到默认行为。
    if (!approverName) {
      // 将审批任务默认分配给当前提交者自己
      approverName = this.currentUser.name;
      // 在服务器控制台打印警告，方便调试和运维
      console.warn(
        `[Compatibility Mode] Workflow ID: ${data.workflowId} did not have a configured approver on its first approval node. ` +
        `Defaulting to the applicant: ${approverName}`
      );
    }
    
    // 4. 健壮性检查：必须找到一个有效的审批节点ID，否则流程无法开始
    if (!firstApprovalNodeId) {
      throw new Error('工作流定义不完整：找不到有效的第一个审批节点。请检查流程图的连线是否从“开始”节点正确连出。');
    }

    // 5. 创建新的请假申请对象
    const newRequest = {
      id: newId,
      applicantName: this.currentUser.name,
      department: this.currentUser.department,
      leaveType: data.leaveType,
      startDate: moment(startDate).format('YYYY-MM-DD'),
      endDate: moment(endDate).format('YYYY-MM-DD'),
      duration: moment(endDate).diff(moment(startDate), 'days') + 1,
      reason: data.reason,
      status: 'pending', // 初始状态为待处理
      currentApprover: approverName, // 使用我们逻辑处理后的审批人
      currentNodeId: firstApprovalNodeId, // 在申请单上记录当前所处的节点ID
      isApplicant: true,
      workflowId: data.workflowId,
      workflowName: workflowDefinition.name,
      createdAt: moment().toISOString(),
      approvalHistory: [
        { 
          action: 'submit', 
          operator: this.currentUser.name, 
          timestamp: moment().format('YYYY-MM-DD HH:mm:ss'), 
          comment: '发起申请' 
        }
      ],
    };
    
    // 6. 将新申请添加到数据列表的开头，并保存到文件
    this.allLeaveRequests.unshift(newRequest);
    this._saveDataToFile(LEAVE_REQUESTS_PATH, this.allLeaveRequests);
    
    // 7. 返回成功响应
    return { success: true, message: '提交成功', data: newRequest };
  }

  async fetchMyLeaveRequests(params = {}) {
    await sleep();
    const { page = 1, pageSize = 10 } = params;
    
    const numPage = Number(page);
    const numPageSize = Number(pageSize);
  
    // ==========================================================
    // ===           ✨✨✨ 核心修复点 ✨✨✨                  ===
    // ==========================================================
    // 我们不再依赖那个不可靠的 isApplicant 字段。
    // 而是直接比较申请记录的 applicantName 是否等于当前登录用户的名字。
    // 这保证了无论用户如何切换，数据总是正确的。
    // ==========================================================
    const myData = this.allLeaveRequests.filter(
      req => req.applicantName === this.currentUser.name
    );
    
    const total = myData.length;
    const data = myData.slice((numPage - 1) * numPageSize, numPage * numPageSize);
    return { data, total, current_page: numPage, page_size: numPageSize };
  }

  async fetchPendingApprovals(params = {}) {
    await sleep();
    const { page = 1, pageSize = 10 } = params;
    const pendingData = this.allLeaveRequests.filter(req => 
      (req.status === 'pending' || req.status === 'processing') && req.currentApprover === this.currentUser.name
    );
    const total = pendingData.length;
    const data = pendingData.slice((page - 1) * pageSize, page * pageSize);
    return { data, total, current_page: page, page_size: pageSize };
  }

  async fetchLeaveRequestDetail(id) {
    await sleep();
    const request = this.allLeaveRequests.find(item => item.id === String(id));
    if (!request) throw new Error('请假申请不存在');
    return request;
  }
  
  async approveLeaveRequest(id, data) {
    await sleep(1000); // 模拟网络延迟

    const requestIndex = this.allLeaveRequests.findIndex(item => item.id === String(id));
    if (requestIndex === -1) throw new Error('请假申请不存在');
    
    const request = this.allLeaveRequests[requestIndex];

    if (request.currentApprover !== this.currentUser.name) {
      throw new Error('您没有权限审批此申请');
    }

    request.approvalHistory.push({
      action: 'approve',
      operator: this.currentUser.name,
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      comment: data.comment || '同意',
    });

    const workflowDefinition = this.workflowDefinitions.find(wf => wf.id === request.workflowId);
    
    if (!workflowDefinition || !request.currentNodeId) {
      // 降级处理
      console.warn(`[Compatibility Fallback] Workflow definition for request ${id} not found or currentNodeId is missing. Auto-approving.`);
      request.status = 'approved';
      request.currentApprover = null;
      request.currentNodeId = null;
      this._saveDataToFile(LEAVE_REQUESTS_PATH, this.allLeaveRequests);
      return request;
    }

    const { nodes, edges } = workflowDefinition.definition_json;
    const outgoingEdge = edges.find(edge => edge.source === request.currentNodeId);

    if (!outgoingEdge) {
      // 没有后续连线，流程结束
      console.log(`[Workflow Engine] Request ${id} reached end of flow from node ${request.currentNodeId}.`);
      request.status = 'approved';
      request.currentApprover = null;
      request.currentNodeId = null;
    } else {
      const nextNode = nodes.find(node => node.id === outgoingEdge.target);
      
      if (!nextNode) {
        throw new Error(`工作流定义错误：节点 ${request.currentNodeId} 的连线指向了不存在的目标节点 ${outgoingEdge.target}`);
      }

      console.log(`[Workflow Engine] Request ${id} advancing from ${request.currentNodeId} to ${nextNode.id} (type: ${nextNode.type}).`);

      // ==========================================================
      // ===           ✨✨✨ 核心修复点 ✨✨✨                  ===
      // ==========================================================
      // 我们将判断条件写得更严格：
      // 必须同时满足：1. 下一个节点是'approval'类型
      //             2. 并且，下一个节点的data中定义了'approver'
      // 这样可以防止流程错误地进入结束状态。
      // ==========================================================
      if (nextNode.type === 'approval' && nextNode.data?.approver) {
        // I. 如果下一个节点是配置了审批人的审批节点，则交接任务
        const nextApprover = nextNode.data.approver;
        
        request.status = 'pending'; // 状态保持 "待审批"
        request.currentApprover = nextApprover; // 更新为下一个审批人
        request.currentNodeId = nextNode.id; // 更新当前节点 ID

        console.log(`[Workflow Engine] Task for request ${id} has been passed to next approver: ${nextApprover}`);

      } else {
        // II. 如果下一个节点不是审批节点，或者审批节点没有配置审批人，
        //     或者下一个节点是'end'节点，我们都认为流程结束。
        request.status = 'approved';
        request.currentApprover = null;
        request.currentNodeId = null; // 清空节点ID，表示流程已完结

        console.log(`[Workflow Engine] Request ${id} flow has been completed at node ${nextNode.id}.`);
      }
    }
    
    this._saveDataToFile(LEAVE_REQUESTS_PATH, this.allLeaveRequests);
    return request;
  }
  async rejectLeaveRequest(id, data) {
    await sleep(1000);
    const request = this.allLeaveRequests.find(item => item.id === String(id));
    if (!request || request.currentApprover !== this.currentUser.name) throw new Error('请假申请不存在或无权审批');
    return this._updateRequest(id, 'rejected', 'reject', data.comment || '不同意', this.currentUser.name);
  }
  
  async withdrawLeaveRequest(id) {
    await sleep(1000);
    const request = this.allLeaveRequests.find(item => item.id === String(id));
    if (!request || !request.isApplicant) throw new Error('请假申请不存在或无权撤回');
    if (!['pending', 'processing'].includes(request.status)) throw new Error('当前状态不允许撤回申请');
    return this._updateRequest(id, 'cancelled', 'withdraw', '申请人主动撤回', this.currentUser.name);
  }

  // --- 工作流定义 API 实现 ---

  async getWorkflowDefinitions() {
    await sleep();
    return this.workflowDefinitions;
  }

  async getWorkflowDefinition(id) {
    await sleep();
    const definition = this.workflowDefinitions.find(d => d.id === id);
    if (!definition) throw new Error('Not Found');
    return definition;
  }

  async createWorkflowDefinition(data) {
    await sleep();
    const newDefinition = {
      name: '未命名工作流',
      description: '',
      version: '1.0',
      is_active: true,
      definition_json: { nodes: [], edges: [] },
      ...data,
      id: `wf_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.workflowDefinitions.unshift(newDefinition);
    this._saveDataToFile(WORKFLOW_DEFINITIONS_PATH, this.workflowDefinitions);
    return newDefinition;
  }
  
  async updateWorkflowDefinition(id, data) {
    await sleep();
    const index = this.workflowDefinitions.findIndex(d => d.id === id);
    if (index === -1) throw new Error('Not Found');
  
    const oldDefinition = this.workflowDefinitions[index];
    const updateData = data || {};
    const currentVersion = parseFloat(oldDefinition.version) || 1.0;
    const newVersion = (currentVersion + 0.1).toFixed(1);
  
    this.workflowDefinitions[index] = {
      ...oldDefinition,
      ...updateData,
      version: String(newVersion),
      updated_at: new Date().toISOString(),
    };
    this._saveDataToFile(WORKFLOW_DEFINITIONS_PATH, this.workflowDefinitions);
    return this.workflowDefinitions[index];
  }
  
  async patchWorkflowDefinition(id, patchData) {
      await sleep();
      const index = this.workflowDefinitions.findIndex(d => d.id === id);
      if (index === -1) throw new Error('Not Found');
      const dataToPatch = patchData || {};

      this.workflowDefinitions[index] = {
          ...this.workflowDefinitions[index],
          ...dataToPatch,
          updated_at: new Date().toISOString(),
      };
      this._saveDataToFile(WORKFLOW_DEFINITIONS_PATH, this.workflowDefinitions);
      return this.workflowDefinitions[index];
  }

  async deleteWorkflowDefinition(id) {
    await sleep();
    const initialLength = this.workflowDefinitions.length;
    this.workflowDefinitions = this.workflowDefinitions.filter(d => d.id !== String(id));
    
    if (this.workflowDefinitions.length >= initialLength) {
      throw new Error('Not Found');
    }
    
    // =========================================================
    // ===               ‼️ 关键修复‼️                   ===
    // =========================================================
    // 使用了正确的文件路径常量 WORKFLOW_DEFINITIONS_PATH
    this._saveDataToFile(WORKFLOW_DEFINITIONS_PATH, this.workflowDefinitions);
    // =========================================================
    
    return true;
  }

  async duplicateWorkflowDefinition(id) {
    await sleep();
    const original = this.workflowDefinitions.find(d => d.id === id);
    if (!original) throw new Error('Not Found');
    const newDefinition = {
      ...original,
      id: `wf_${Date.now()}`,
      name: `${original.name} (副本)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.workflowDefinitions.unshift(newDefinition);
    this._saveDataToFile(WORKFLOW_DEFINITIONS_PATH, this.workflowDefinitions);
    return newDefinition;
  }
  
  async getDesignerConfig() {
    await sleep();
    return {
      nodeTypes: [
        { type: 'start', label: '开始节点', defaultConfig: { status: 'initial' }, configSchema: { type: 'object', properties: { label: {type: 'string', title: '节点标签'} }} },
        { type: 'end', label: '结束节点', defaultConfig: { status: 'completed' }, configSchema: { type: 'object', properties: { label: {type: 'string', title: '节点标签'} }} },
        { type: 'approval', label: '审批节点', defaultConfig: { approverType: 'user' }, configSchema: { type: 'object', properties: { label: {type: 'string', title: '节点标签'} }}},
      ]
    };
  }
}

// 使用一个全局唯一的 Symbol 来作为我们单例实例的键，防止命名冲突
const MOCK_SERVICE_INSTANCE_KEY = Symbol.for('MyProject.MockApiService.Instance');

let instance;

if (!global[MOCK_SERVICE_INSTANCE_KEY]) {
  console.log('🚀 Creating a NEW MockApiService instance...');
  instance = new MockApiService();
  global[MOCK_SERVICE_INSTANCE_KEY] = instance;
} else {
  console.log('✅ Reusing the EXISTING MockApiService instance.');
  instance = global[MOCK_SERVICE_INSTANCE_KEY];
  // ✨ 关键：即使重用实例，也强制从文件重新加载一次数据
  instance.reloadData();
}

export default instance;