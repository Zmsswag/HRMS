//frontend\src\pages\LeaveRequestSubmissionPage.jsx

import React, { useState, useEffect } from 'react';
import { Card, message, Spin, Alert } from 'antd';
import DynamicForm from '../components/DynamicForm';
import { fetchFormConfig, submitLeaveRequest } from '../api/leaveRequest';

/**
 * 请假申请提交页面
 */
const LeaveRequestSubmissionPage = () => {
  const [formConfig, setFormConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // 获取表单配置
  useEffect(() => {
    const getFormConfig = async () => {
      setLoading(true);
      setError(null);
      try {
        const config = await fetchFormConfig();
        setFormConfig(config);
      } catch (err) {
        console.error('获取表单配置失败:', err);
        setError('获取表单配置失败，请刷新页面重试');
      } finally {
        setLoading(false);
      }
    };

    getFormConfig();
  }, []);

  // 提交请假申请
  const handleSubmit = async (values) => {
    setSubmitting(true);
    setError(null);
    try {
      await submitLeaveRequest(values);
      message.success('请假申请提交成功');
      // 重置表单或跳转到其他页面
    } catch (err) {
      console.error('提交请假申请失败:', err);
      setError('提交请假申请失败: ' + (err.message || '未知错误'));
    } finally {
      setSubmitting(false);
    }
  };

  // 加载中状态
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载表单配置中...</div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <Alert
        message="错误"
        description={error}
        type="error"
        showIcon
      />
    );
  }

  // 表单配置不存在
  if (!formConfig) {
    return (
      <Alert
        message="提示"
        description="表单配置不存在"
        type="warning"
        showIcon
      />
    );
  }

  return (
    <Card title="提交请假申请">
      <DynamicForm
        formSchema={formConfig}
        onSubmit={handleSubmit}
        loading={submitting}
        submitText="提交申请"
      />
    </Card>
  );
};

export default LeaveRequestSubmissionPage;