// src/api/axiosConfig.js

import axios from 'axios';

// 创建一个全局唯一的 axios 实例
const axiosInstance = axios.create({
  // 配置所有请求的基础 URL，这样在调用时只需要写相对路径
  baseURL: '/api',
  // 设置请求超时时间，单位毫秒
  timeout: 10000,
});

// 添加响应拦截器
axiosInstance.interceptors.response.use(
  /**
   * 当请求成功时（HTTP状态码为2xx），这个函数会被调用。
   * 我们在这里对所有成功的响应进行预处理。
   */
  response => {
    // 我们的 mock 服务 和 规范的真实后端API 都会返回一个包含 { data: ... } 的响应体。
    // 这个拦截器的作用就是剥离掉 axios 的外层包装，直接返回后端响应体。
    // 即，调用方拿到的就是 { code, message, data } 或类似结构。
    return response.data;
  },
  /**
   * 当请求失败时（HTTP状态码非2xx，或网络错误等），这个函数会被调用。
   * 我们在这里对所有错误进行统一的处理和提示。
   */
  error => {
    // 初始化一个默认的错误消息
    let errorMessage = '发生未知错误，请稍后再试';

    // 判断错误类型
    if (error.response) {
      // 服务器返回了响应，但状态码不是 2xx
      // 我们从服务器返回的响应体中尝试获取更具体的错误信息
      errorMessage = error.response.data?.message || `请求失败，状态码：${error.response.status}`;
    } else if (error.request) {
      // 请求已发出，但没有收到任何响应（例如网络中断或服务器宕机）
      errorMessage = '无法连接到服务器，请检查您的网络';
    } else {
      // 在设置请求时触发了错误（例如配置错误）
      errorMessage = error.message;
    }
    
    // 可以在这里进行全局的错误提示，比如使用 antd 的 message.error
    // import { message } from 'antd';
    // message.error(errorMessage);

    // 以 Promise.reject 的方式将错误继续传递下去，
    // 这样，具体的业务代码里的 .catch(err => ...) 仍然可以捕获到这个错误并进行处理。
    return Promise.reject(new Error(errorMessage));
  }
);

// 导出这个配置好的 axios 实例，供项目中其他 API 文件使用
export default axiosInstance;