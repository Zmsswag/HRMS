// src/App.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { BrowserRouter } from 'react-router-dom'; // 导入 BrowserRouter

describe('App Component', () => {
  test('renders HelloWorld component', () => {
    render(
      <BrowserRouter>  {/* 使用 BrowserRouter 包裹 App 组件 */}
        <App />
      </BrowserRouter>
    );

    // 检查 HelloWorld 组件是否被渲染
    const helloWorldElement = screen.getByText(/Hello, World!/i); // 使用正则匹配，不区分大小写
    expect(helloWorldElement).toBeInTheDocument();
  });
});