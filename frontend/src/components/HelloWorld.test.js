// src/components/HelloWorld.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import HelloWorld from './HelloWorld';

describe('HelloWorld Component', () => {
  test('renders the greeting message', () => {
    render(<HelloWorld />);

    // 检查是否渲染了 "Hello, World!" 文本
    const greetingElement = screen.getByText(/Hello, World!/i); // 使用正则匹配，不区分大小写
    expect(greetingElement).toBeInTheDocument();
  });
});