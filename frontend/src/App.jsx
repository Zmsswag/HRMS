// src/App.jsx

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// 导入通用布局组件
import AppLayout from './components/AppLayout';

// 导入各个页面组件
import LeaveRequestSubmissionPage from './pages/LeaveRequestSubmissionPage';
import MyRequestsPage from './pages/MyRequestsPage';
import PendingApprovalsPage from './pages/PendingApprovalsPage';
import LeaveRequestDetailPage from './pages/LeaveRequestDetailPage';
import WorkflowDefinitionsPage from './pages/workflow/WorkflowDefinitionsPage';
import WorkflowDesignerPage from './pages/workflow/WorkflowDesignerPage';

// =========================================================
// ===                 ✨ 步骤 1：导入新页面 ✨             ===
// =========================================================
import UserSwitcherPage from './pages/debug/UserSwitcherPage';
// =========================================================

/**
 * 应用的主路由配置组件
 * @returns {JSX.Element}
 */
const App = () => {
  return (
    // 使用 AppLayout 作为所有页面的通用布局
    <AppLayout>
      <Routes>

        {/* ==================== 请假申请相关路由 ==================== */}
        <Route path="/submit" element={<LeaveRequestSubmissionPage />} />
        <Route path="/my-requests" element={<MyRequestsPage />} />
        <Route path="/pending-approvals" element={<PendingApprovalsPage />} />
        <Route path="/detail/:id" element={<LeaveRequestDetailPage />} />
        
        {/* ==================== 工作流引擎相关路由 ==================== */}
        <Route path="/workflow/definitions" element={<WorkflowDefinitionsPage />} />
        
        {/* 
          将新建和编辑的路由合并成一个，利用可选的 URL 参数。
          `:definitionId?` 中的 `?` 表示 definitionId 是可选的。
          这样 WorkflowDesignerPage 组件内部可以通过 useParams() 来判断是新建还是编辑。
        */}
        <Route path="/workflow/designer/:definitionId?" element={<WorkflowDesignerPage />} />

        {/* =========================================================
            ===           ✨ 步骤 2：添加调试页面的路由 ✨         ===
            ========================================================= */}
        <Route path="/debug/switch-user" element={<UserSwitcherPage />} />
        {/* ========================================================= */}


        {/* ==================== 默认路由重定向 ==================== */}
        <Route path="/" element={<Navigate to="/my-requests" replace />} />

      </Routes>
    </AppLayout>
  );
};

export default App;