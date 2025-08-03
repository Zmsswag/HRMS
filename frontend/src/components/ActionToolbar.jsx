import React, { useCallback, useMemo } from 'react';
import { Button, Space, Dropdown, Tooltip, Modal, Popconfirm } from 'antd';
import { MoreOutlined } from '@ant-design/icons';

/**
 * 操作工具栏组件
 * @param {Array} allowedActions - 允许的操作类型数组 (包含 key, label, icon?, permissionCode?, condition?, type?, danger?, disabled?, loading?, tooltip?, needConfirm?, confirmTitle?, confirmContent?, okText?, cancelText?, popConfirm?, style?)
 * @param {Function} onActionClick - 操作回调函数 (actionKey, record) => void
 * @param {Object} record - 当前行的数据记录
 * @param {Object} permissions - 权限配置对象 { permissionCode: boolean }
 * @param {String} buttonSize - 按钮大小，可选 'small', 'middle', 'large'
 * @param {Boolean} loading - 全局加载状态，会影响非独立的 loading 按钮和下拉菜单项
 * @param {String} position - 按钮在容器中的对齐方式，可选 'left', 'right', 'center'
 * @param {Number} maxVisible - 工具栏中最大可见的按钮数量，超出部分放入“更多”下拉菜单
 */
const ActionToolbar = ({
  allowedActions = [],
  onActionClick,
  record = {},
  permissions = {},
  buttonSize = 'middle',
  loading = false,
  position = 'left',
  maxVisible = 3,
}) => {
  // 检查操作是否有权限
  const hasPermission = useCallback(
    (action) => {
      // 如果 action 没有定义 permissionCode，则默认有权限
      if (!action.permissionCode) return true;
      // 检查 permissions 对象中对应的权限码是否为 true
      return permissions[action.permissionCode] === true;
    },
    [permissions] // 依赖 permissions 状态
  );

  // 检查操作是否应该显示（权限和条件判断）
  const shouldShowAction = useCallback(
    (action) => {
      // 首先检查权限
      if (!hasPermission(action)) return false;

      // 如果 action 定义了 condition 函数，则执行该函数判断是否满足显示条件
      if (action.condition && typeof action.condition === 'function') {
        return action.condition(record);
      }

      // 如果没有 condition 函数或条件满足，则显示
      return true;
    },
    [hasPermission, record] // 依赖 hasPermission 函数和 record 数据
  );

  // 处理操作按钮点击事件
  const handleActionClick = useCallback(
    (action) => {
      // 如果全局 loading 为 true，则阻止操作
      if (loading && !action.loading) return; // 允许独立的loading按钮操作

      // 定义实际执行操作的函数
      const executeAction = () => {
        if (onActionClick) {
          onActionClick(action.key, record);
        }
      };

      // 如果 action 配置了 needConfirm，则弹出 Modal 确认框
      if (action.needConfirm && !action.popConfirm) { // PopConfirm 已单独处理，避免重复确认
        Modal.confirm({
          title: action.confirmTitle || '确认操作',
          content: action.confirmContent || `确定要执行 "${action.label}" 操作吗？`,
          okText: action.okText || '确定',
          cancelText: action.cancelText || '取消',
          onOk: executeAction, // 点击确认后执行操作
        });
      } else if (action.popConfirm) {
          // PopConfirm 的确认逻辑在其 onConfirm 属性中处理，这里不需要额外操作
          // 但为了统一，如果 PopConfirm 按钮被直接点击（理论上不会，会被 Popconfirm 包裹），也执行 action
          // 实际上 Popconfirm 的 onConfirm 会调用 onActionClick，所以这里可以省略
          // executeAction(); // 通常不需要
      }
       else {
        // 如果不需要确认，直接执行操作
        executeAction();
      }
    },
    [loading, onActionClick, record] // 依赖 loading 状态, onActionClick 回调, record 数据
  );

  // 过滤出有权限且应该显示的可见操作
  const visibleActions = useMemo(
    () => allowedActions.filter((action) => shouldShowAction(action)),
    [allowedActions, shouldShowAction] // 依赖允许的操作列表和显示判断函数
  );

  // 如果没有可见的操作，则不渲染任何内容
  if (visibleActions.length === 0) {
    return null;
  }

  // 根据 maxVisible 分割主要操作和更多操作
  const mainActions = visibleActions.slice(0, maxVisible);
  const moreActions = visibleActions.slice(maxVisible);

  // 渲染单个操作按钮（包括 Popconfirm 和 Tooltip）
  const renderActionButton = useCallback(
    (action) => {
      const buttonProps = {
        key: action.key,
        type: action.type || 'link', // 默认使用 link 类型按钮，更常用于表格操作列
        icon: action.icon,
        size: buttonSize,
        danger: action.danger,
        // action.loading 优先于全局 loading
        loading: action.loading || (loading && action.showGlobalLoading), // 添加 showGlobalLoading 控制是否受全局loading影响
        // 如果按钮独立loading或全局loading，则禁用；或 action 本身被禁用
        disabled: action.disabled || action.loading || (loading && action.showGlobalLoading),
        onClick: (e) => {
             // 如果是 Popconfirm 包裹的按钮，阻止事件冒泡，避免触发 handleActionClick
             if (!action.popConfirm) {
                 handleActionClick(action);
             }
             // 如果 action 本身有 onClick，也执行它（允许自定义逻辑）
             if (action.onClick) {
                 action.onClick(e, record);
             }
        },
        style: action.style,
      };

      const buttonElement = <Button {...buttonProps}>{action.label}</Button>;

      const buttonWithTooltip = action.tooltip ? (
        <Tooltip title={action.tooltip}>{buttonElement}</Tooltip>
      ) : (
        buttonElement
      );

      // 如果 action 配置了 popConfirm，则使用 Popconfirm 包裹按钮
      if (action.popConfirm) {
        return (
          <Popconfirm
            key={action.key}
            title={action.confirmTitle || '确认操作'}
            description={action.confirmContent || `确定要执行 "${action.label}" 操作吗？`}
            okText={action.okText || '确定'}
            cancelText={action.cancelText || '取消'}
            onConfirm={() => onActionClick(action.key, record)} // Popconfirm 的确认直接调用 onActionClick
            disabled={buttonProps.disabled} // 将按钮的禁用状态传递给 Popconfirm
          >
            {/* Popconfirm 包裹的按钮通常不直接绑定 onClick 事件来执行业务逻辑 */}
            {/* Tooltip 应包裹在 Popconfirm 内部触发器上 */}
             {action.tooltip ? (
                <Tooltip title={action.tooltip}>
                    <Button {...buttonProps} onClick={null}>{action.label}</Button>
                </Tooltip>
             ) : (
                <Button {...buttonProps} onClick={null}>{action.label}</Button>
             )}
          </Popconfirm>
        );
      }

      // 如果没有 popConfirm，直接返回带 Tooltip (如果需要) 的按钮
      return buttonWithTooltip;

    },
    [buttonSize, handleActionClick, loading, onActionClick, record] // 依赖项更新
  );

  // 渲染“更多”操作的下拉菜单
  const renderMoreMenu = useCallback(() => {
    if (moreActions.length === 0) {
      return null;
    }

    // 使用 Ant Design v4.20+ / v5 的 items API
    const menuItems = moreActions.map((action) => ({
      key: action.key,
      label: action.tooltip ? <Tooltip title={action.tooltip} placement="left">{action.label}</Tooltip> : action.label, // 下拉菜单项也可以加 Tooltip
      icon: action.icon,
      danger: action.danger,
      // 下拉菜单项的禁用状态也受全局 loading 或自身 disabled 影响
      disabled: action.disabled || (loading && action.showGlobalLoading),
      onClick: () => handleActionClick(action), // 点击菜单项时触发 handleActionClick
    }));

    return (
      <Dropdown
        menu={{ items: menuItems }} // 使用 menu={{ items }} 替代 overlay
        placement="bottomRight"
        // 如果需要在下拉菜单展开时禁用按钮，可以添加 disabled 属性
        // disabled={loading}
      >
        <Button icon={<MoreOutlined />} size={buttonSize}>
          更多
        </Button>
      </Dropdown>
    );
  }, [buttonSize, handleActionClick, loading, moreActions, record]); // 依赖项更新

  // 根据 position 属性获取容器的对齐样式
  const getPositionStyle = useCallback(() => {
    switch (position) {
      case 'right':
        return { justifyContent: 'flex-end' };
      case 'center':
        return { justifyContent: 'center' };
      case 'left':
      default:
        return { justifyContent: 'flex-start' };
    }
  }, [position]); // 依赖 position

  return (
    <div style={{ display: 'flex', width: '100%', ...getPositionStyle() }}>
      {/* 使用 Space 组件来自动处理按钮间的间距 */}
      <Space>
        {/* 渲染主要操作按钮 */}
        {mainActions.map((action) => renderActionButton(action))}
        {/* 渲染“更多”操作下拉菜单 */}
        {renderMoreMenu()}
      </Space>
    </div>
  );
};

export default ActionToolbar;