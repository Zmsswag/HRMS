import React from 'react';
import { Layout } from 'antd';
import { Routes, Route } from 'react-router-dom'; // 移除 BrowserRouter 导入，避免重复包裹
import HelloWorld from './components/Helloworld';

import AppHeader from './components/AppHeader';
import AppSider from './components/AppSider';
import TaskDesigner from './pages/TaskDesigner';
import TaskList from './pages/TaskList';
import TaskDistribution from './pages/TaskDistribution';
// 表单组件页面
import InputPage from './pages/InputPage';
import SelectPage from './pages/SelectPage';
import DatePickerPage from './pages/DatePickerPage';
import UploadPage from './pages/UploadPage';
// 流程组件页面
import ApprovalPage from './pages/ApprovalPage';
import NotificationPage from './pages/NotificationPage';
import ConditionPage from './pages/ConditionPage';
import AssignmentPage from './pages/AssignmentPage';
// HR组件页面
// import EmployeePage from './pages/EmployeePage';
// import DepartmentPage from './pages/DepartmentPage';
// import AttendancePage from './pages/AttendancePage';
// import SalaryPage from './pages/SalaryPage';
import './App.css';


const { Content } = Layout;
// const App = () => {
//   return (
//     <Routes>
//       <Route path="/" element={
//       < HelloWorld />
//       }
//       />
//     </Routes> 
//   );
// }

const App = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppHeader />
      <Layout>
        <AppSider />
        <Layout style={{ padding: '24px' }}>
          <Content>
              <Routes>
                <Route path="/" element={<TaskList />} />
                <Route path="/designer" element={<TaskDesigner />} />
                <Route path="/distribution" element={<TaskDistribution />} />
                {/* 表单组件路由 */}
                <Route path="/input" element={<InputPage />} />
                <Route path="/select" element={<SelectPage />} />
                <Route path="/datepicker" element={<DatePickerPage />} />
                <Route path="/upload" element={<UploadPage />} />
                {/* 流程组件路由 */}
                <Route path="/approval" element={<ApprovalPage />} />
                <Route path="/notification" element={<NotificationPage />} />
                <Route path="/condition" element={<ConditionPage />} />
                <Route path="/assignment" element={<AssignmentPage />} />
                {/* HR组件路由
                <Route path="/employee" element={<EmployeePage />} />
                <Route path="/department" element={<DepartmentPage />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/salary" element={<SalaryPage />} /> */}
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </Layout>
  );
};

export default App;