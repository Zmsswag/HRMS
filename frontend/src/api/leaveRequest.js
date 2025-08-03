// src/api/leaveRequest.js

// 导入我们在项目中创建的、统一配置的 axios 实例
// 这个实例已经包含了 baseURL 和统一的响应/错误拦截器
import api from './axiosConfig';

/**
 * 获取请假表单的配置信息。
 * 这个函数负责调用后端API，并处理返回的数据，只把最核心的表单配置对象返回给组件。
 * @returns {Promise<Object>} 返回一个包含 `fields` 数组的表单配置对象。
 */
export const fetchFormConfig = async () => {
  // 使用统一的 axios 实例发起 GET 请求。
  // 拦截器会自动处理掉 HTTP 层的包装，这里得到的 response 就是 mock 服务返回的 { code, message, data } 对象。
  const response = await api.get('/leave-requests/form-config');
  
  // 在这一层进行“解包”，提取出组件真正需要的数据部分。
  // 这样做的好处是让组件代码更干净，不用关心API响应的通用包装结构。
  if (response && response.data) {
    // response.data 此时就是 { fields: [...] }
    return response.data;
  }
  console.log('📬 [API Layer] Response from axios:', response);

  if (response && response.data) {
    // 诊断日志 #2: 看看我们准备返回给组件的数据是什么
    console.log('✅ [API Layer] Returning this to component:', response.data);
    return response.data;
  }
  
  console.error('❌ [API Layer] Invalid response structure:', response);
  // 如果 API 返回的数据结构不符合预期，为了防止组件报错，返回一个安全的默认值。
  console.error('从API获取的表单配置格式不正确:', response);
  return { fields: [] }; 
};

/**
 * 提交一个新的请假申请。
 * @param {Object} formData - 从表单收集到的所有数据，例如 { leaveType, dateRange, reason, workflowId }。
 * @returns {Promise<Object>} 返回提交结果，通常是 { success: true, message: '提交成功', ... }。
 */
export const submitLeaveRequest = async (formData) => {
  // 发起 POST 请求，并将表单数据作为请求体发送。
  // 对于这个API，我们的 mock 服务直接返回了 { success: true, ... } 格式，
  // 所以这里不需要再进行解包，直接返回即可。
  return await api.post('/leave-requests', formData);
};

/**
 * 获取当前用户提交的请假申请列表（我的申请）。
 * @param {Object} params - 分页和筛选参数，例如 { page: 1, pageSize: 10 }。
 * @returns {Promise<Object>} 返回包含列表和总数的数据，例如 { data: [...], total: 15, ... }。
 */
export const fetchMyLeaveRequests = async (params) => {
  // 发起带查询参数的 GET 请求。
  const response = await api.get('/leave-requests/my', { params });
  
  // 同样进行解包，提取核心数据。
  if (response && response.data) {
    return response.data;
  }

  // 返回安全的默认值。
  return { data: [], total: 0 };
};

/**
 * 获取待当前用户审批的请假申请列表。
 * @param {Object} params - 分页和筛选参数。
 * @returns {Promise<Object>} 返回包含列表和总数的数据。
 */
export const fetchPendingApprovals = async (params) => {
  const response = await api.get('/leave-requests/pending-approval', { params });
  
  if (response && response.data) {
    return response.data;
  }

  return { data: [], total: 0 };
};

/**
 * 根据ID获取单个请假申请的详细信息。
 * @param {string} id - 请假申请的唯一ID。
 * @returns {Promise<Object>} 返回单个申请的详细数据对象。
 */
export const fetchLeaveRequestDetail = async (id) => {
  const response = await api.get(`/leave-requests/${id}`);
  
  if (response && response.data) {
    return response.data;
  }

  // 如果找不到，可以返回 null 或一个空对象，取决于组件如何处理。
  return null;
};

/**
 * 审批通过一个请假申请。
 * @param {string} id - 请假申请的ID。
 * @param {Object} data - 审批意见等数据，例如 { comment: '同意' }。
 * @returns {Promise<Object>} 返回更新后的请假申请对象。
 */
export const approveLeaveRequest = async (id, data) => {
  const response = await api.patch(`/leave-requests/${id}/approve`, data);
  
  if (response && response.data) {
    return response.data;
  }
  
  return null;
};

/**
 * 审批拒绝一个请假申请。
 * @param {string} id - 请假申请的ID。
 * @param {Object} data - 拒绝理由等数据，例如 { comment: '项目繁忙，暂不批准' }。
 * @returns {Promise<Object>} 返回更新后的请假申请对象。
 */
export const rejectLeaveRequest = async (id, data) => {
  const response = await api.patch(`/leave-requests/${id}/reject`, data);

  if (response && response.data) {
    return response.data;
  }

  return null;
};

/**
 * 申请人撤回一个请假申请。
 * @param {string} id - 请假申请的ID。
 * @returns {Promise<Object>} 返回更新后的请假申请对象。
 */
export const withdrawLeaveRequest = async (id) => {
  const response = await api.delete(`/leave-requests/${id}`);

  if (response && response.data) {
    return response.data;
  }
  
  return null;
};