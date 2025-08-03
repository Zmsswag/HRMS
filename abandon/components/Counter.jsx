import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0); // 初始化 state

  const increment = () => {
    setCount(count + 1); // 更新 state
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}

export default Counter;