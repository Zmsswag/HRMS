/**
 * src/api/userApi.js
 * 
 * 封装所有与用户相关的API请求。
 * (使用默认导出，与 workflowApi.js 风格保持一致)
 */

import api from './axiosConfig';

const getCurrentUser = async () => {
  try {
    const response = await api.get('/user/current');
    if (response && response.data) {
      return response.data;
    }
    console.error('从API获取的当前用户信息格式不正确:', response);
    return null;
  } catch (error) {
    console.error("API call to getCurrentUser failed:", error);
    throw error;
  }
};

const setCurrentUser = async (newName) => {
  try {
    //const response = await api.post('/user/set/current', { newName });
    const response = await api.post('/test-user-switch', { newName });
    if (response && response.data) {
      return response.data;
    }
    console.error('切换用户后从API返回的数据格式不正确:', response);
    return null;
  } catch (error) {
    console.error(`API call to setCurrentUser with name "${newName}" failed:`, error);
    throw error;
  }
};

// ✨ 将所有函数组织到一个对象中
const userApi = {
  getCurrentUser,
  setCurrentUser,
};

// ✨ 将这个对象作为默认导出
export default userApi;