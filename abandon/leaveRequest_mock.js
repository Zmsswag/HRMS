import mockService from '../frontend/src/mock/mockService';

// 使用模拟服务
const api = mockService;

/**
 * 获取请假表单配置
 * @returns {Promise} 表单配置对象
 */
export const fetchFormConfig = async () => {
  return api.fetchFormConfig();
};

/**
 * 提交请假申请
 * @param {Object} data 请假申请数据
 * @returns {Promise} 提交结果
 */
export const submitLeaveRequest = async (data) => {
  return api.submitLeaveRequest(data);
};

/**
 * 获取我的请假申请列表
 * @param {Object} params 查询参数
 * @returns {Promise} 请假申请列表
 */
export const fetchMyLeaveRequests = async (params) => {
  return api.fetchMyLeaveRequests(params);
};

/**
 * 获取待审批的请假申请列表
 * @param {Object} params 查询参数
 * @returns {Promise} 待审批请假申请列表
 */
export const fetchPendingApprovals = async (params) => {
  return api.fetchPendingApprovals(params);
};

/**
 * 获取请假申请详情
 * @param {String} id 请假申请ID
 * @returns {Promise} 请假申请详情
 */
export const fetchLeaveRequestDetail = async (id) => {
  return api.fetchLeaveRequestDetail(id);
};

/**
 * 审批通过请假申请
 * @param {String} id 请假申请ID
 * @param {Object} data 审批数据
 * @returns {Promise} 审批结果
 */
export const approveLeaveRequest = async (id, data) => {
  return api.approveLeaveRequest(id, data);
};

/**
 * 审批拒绝请假申请
 * @param {String} id 请假申请ID
 * @param {Object} data 审批数据
 * @returns {Promise} 审批结果
 */
export const rejectLeaveRequest = async (id, data) => {
  return api.rejectLeaveRequest(id, data);
};

/**
 * 撤回请假申请
 * @param {String} id 请假申请ID
 * @returns {Promise} 撤回结果
 */
export const withdrawLeaveRequest = async (id) => {
  return api.withdrawLeaveRequest(id);
};

export default api;