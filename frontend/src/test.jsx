import React, { useState, useEffect } from 'react';

// 修复 Hook 错误示例
export function CorrectExample() {
    const [count] = useState(0);
    
    // 正确使用 Hook，不在条件语句中
    useEffect(() => {
      // 有条件的逻辑放在 Hook 内部
      if (count > 0) {
        console.log('Count changed');
      }
    }, [count]);
    
    return <div>{count}</div>;
}