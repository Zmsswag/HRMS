import mockService from '../src/mock/mockService.js';
import { URLSearchParams } from 'node:url'; // 导入 Node.js 内置的 URL 处理模块

// --- 辅助函数1: 手动解析请求体 (保持不变) ---
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('Invalid JSON in request body'));
      }
    });
    req.on('error', (err) => { reject(err); });
  });
}

// --- 辅助函数2: 统一的响应处理器 (保持不变) ---
const handleRawResponse = async (serviceCall, res, successCode = 200) => {
  try {
    const result = await serviceCall();
    res.statusCode = successCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ code: successCode, message: 'Success', data: result }));
  } catch (error) {
    console.error('❌ Error in mock service call:', error);
    res.statusCode = error.message === 'Not Found' ? 404 : 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ code: res.statusCode, message: error.message, data: null }));
  }
};


export default [
  // =======================================================
  // --- Workflow Definitions Routes (已修复) ---
  // =======================================================
  {
    url: '/api/workflows/definitions',
    method: 'get',
    rawResponse: async (req, res) => {
      await handleRawResponse(() => mockService.getWorkflowDefinitions(), res);
    },
  },
  {
    url: '/api/workflows/definitions',
    method: 'post',
    rawResponse: async (req, res) => {
      const body = await parseBody(req);
      await handleRawResponse(() => mockService.createWorkflowDefinition(body), res, 201);
    },
  },
  {
    url: '/api/workflows/definitions/:id',
    method: 'get',
    rawResponse: async (req, res) => {
      const id = req.url.split('/').pop();
      await handleRawResponse(() => mockService.getWorkflowDefinition(id), res);
    },
  },
  {
    url: '/api/workflows/definitions/:id',
    method: 'put',
    rawResponse: async (req, res) => {
      const id = req.url.split('/').pop();
      const body = await parseBody(req);
      await handleRawResponse(() => mockService.updateWorkflowDefinition(id, body), res);
    },
  },
  {
    url: '/api/workflows/definitions/:id',
    method: 'patch',
    rawResponse: async (req, res) => {
      const id = req.url.split('/').pop();
      const body = await parseBody(req);
      await handleRawResponse(() => mockService.patchWorkflowDefinition(id, body), res);
    }
  },
  {
    url: '/api/workflows/definitions/:id',
    method: 'delete',
    rawResponse: async (req, res) => {
      const id = req.url.split('/').pop();
      console.log(`[WORKAROUND] Manually extracting ID from DELETE ${req.url}. Found ID: "${id}"`);
      try {
        await mockService.deleteWorkflowDefinition(id);
        res.statusCode = 204;
        res.end();
      } catch (error) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: error.message }));
      }
    },
  },
  {
    url: '/api/workflows/definitions/:id/duplicate',
    method: 'post',
    rawResponse: async (req, res) => {
      const id = req.url.split('/')[4];
      await handleRawResponse(() => mockService.duplicateWorkflowDefinition(id), res);
    },
  },
  {
    url: '/api/workflows/designer/config',
    method: 'get',
    rawResponse: async (req, res) => {
      await handleRawResponse(() => mockService.getDesignerConfig(), res);
    },
  },

  // =======================================================
  // --- Leave Request Routes  ---
  // =======================================================
  {
    url: '/api/leave-requests/form-config',
    method: 'get',
    rawResponse: async (req, res) => {
      await handleRawResponse(() => mockService.fetchFormConfig(), res);
    },
  },
  {
    url: '/api/leave-requests',
    method: 'post',
    rawResponse: async (req, res) => {
      try {
        const body = await parseBody(req);
        const result = await mockService.submitLeaveRequest(body);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
      } catch (error) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, message: error.message }));
      }
    },
  },
  {
    url: '/api/leave-requests/my',
    method: 'get',
    rawResponse: async (req, res) => {
      const queryString = req.url.split('?')[1] || '';
      const queryParams = Object.fromEntries(new URLSearchParams(queryString));
      await handleRawResponse(() => mockService.fetchMyLeaveRequests(queryParams), res);
    },
  },
  {
    url: '/api/leave-requests/pending-approval',
    method: 'get',
    rawResponse: async (req, res) => {
      const queryString = req.url.split('?')[1] || '';
      const queryParams = Object.fromEntries(new URLSearchParams(queryString));
      await handleRawResponse(() => mockService.fetchPendingApprovals(queryParams), res);
    },
  },
  {
    url: '/api/leave-requests/:id',
    method: 'get',
    rawResponse: async (req, res) => {
      const id = req.url.split('/').pop();
      await handleRawResponse(() => mockService.fetchLeaveRequestDetail(id), res);
    },
  },
  {
    url: '/api/leave-requests/:id/approve',
    method: 'patch',
    rawResponse: async (req, res) => {
      const id = req.url.split('/')[3];
      const body = await parseBody(req);
      await handleRawResponse(() => mockService.approveLeaveRequest(id, body), res);
    },
  },
  {
    url: '/api/leave-requests/:id/reject',
    method: 'patch',
    rawResponse: async (req, res) => {
      const id = req.url.split('/')[3];
      const body = await parseBody(req);
      await handleRawResponse(() => mockService.rejectLeaveRequest(id, body), res);
    },
  },
  {
    url: '/api/leave-requests/:id',
    method: 'delete',
    rawResponse: async (req, res) => {
      const id = req.url.split('/').pop();
      await handleRawResponse(() => mockService.withdrawLeaveRequest(id), res);
    },
  },
  {
    url: '/api/test-user-switch',
    method: 'post',
    rawResponse: async (req, res) => {
      try {
        // ✨✨✨ 核心修复：在这里调用 parseBody ✨✨✨
        const body = await parseBody(req);
        
        // 现在从解析好的 body 对象中解构
        const { newName } = body;

        // 添加一个防御性检查
        if (!newName) {
          throw new Error("The 'newName' property is required in the request body.");
        }

        const updatedUser = await mockService.setCurrentUser(newName);
        
        // 响应可以更具体一些
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ code: 200, message: `User successfully switched to ${newName}`, data: updatedUser }));
      
      } catch (error) {
        console.error('❌ Error in /api/test-user-switch mock:', error.message);
        res.statusCode = 400; // Bad Request
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ code: 400, message: error.message, data: null }));
      }
    },
  },
];