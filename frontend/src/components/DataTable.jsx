import React, { useState, useEffect, useRef, useCallback,useMemo } from 'react';
import { Table, Button, Input, Space, Tooltip, Tag, Dropdown, Modal, message } from 'antd';
import { SearchOutlined, FilterOutlined, MoreOutlined, ExportOutlined, ReloadOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';

/**
 * 数据表格组件
 * @param {Array} columns - 列定义 (Ant Design ColumnType[]), 添加自定义属性如: searchable, type ('tag', 'date', 'datetime', 'boolean', 'actions'), tagColorMap, actions[]
 * @param {Array} data - 数据数组
 * @param {Function} onRowClick - 行点击回调 (record) => void
 * @param {Boolean} loading - 加载状态
 * @param {Object} pagination - Ant Design 分页配置对象 | false
 * @param {Function} onChange - 表格变化回调 (pagination, filters, sorter, extra: { currentDataSource, action }) => void
 * @param {Object} rowSelection - Ant Design 行选择配置对象
 * @param {Array} actions - 表格顶部操作按钮配置 [{ key, label, icon, type?, tooltip?, needSelection?, confirm?, confirmTitle?, confirmContent?, onClick(selectedRows), disabled? }]
 * @param {String | Function} rowKey - 行唯一标识字段名或函数 (record => key)
 * @param {Function} onRefresh - 点击刷新按钮的回调
 * @param {Object} tableProps - 其他原生 Ant Design Table 组件的 props
 */
const DataTable = ({
  columns = [],
  data = [],
  onRowClick,
  loading = false,
  pagination = { pageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: total => `共 ${total} 条` },
  onChange,
  rowSelection,
  actions = [],
  rowKey = 'id',
  onRefresh, // Added dedicated refresh handler prop
  tableProps = {}, // Pass additional Table props
}) => {
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [internalSelectedRowKeys, setInternalSelectedRowKeys] = useState(rowSelection?.selectedRowKeys || []);
  // Use internal state only if rowSelection.selectedRowKeys is not controlled externally
  const isSelectionControlled = rowSelection && rowSelection.selectedRowKeys !== undefined;
  const selectedRowKeys = isSelectionControlled ? rowSelection.selectedRowKeys : internalSelectedRowKeys;

  const searchInputRef = useRef(null);

  // Sync internal selection state if external state changes (and not controlled)
  useEffect(() => {
    if (rowSelection && rowSelection.selectedRowKeys !== undefined) {
        setInternalSelectedRowKeys(rowSelection.selectedRowKeys);
    }
  }, [rowSelection?.selectedRowKeys]);


  // 处理搜索输入确认
  const handleSearch = (confirm, dataIndex) => {
    confirm();
    // Note: searchText and searchedColumn state are mainly for the Highlighter
    // The actual filtering happens via the Table's internal state or server-side via onChange
  };

  // 处理搜索重置
  const handleReset = (clearFilters, confirm) => {
    clearFilters();
    setSearchText('');
    setSearchedColumn(''); // Reset highlighted column
    confirm(); // Confirm the reset to clear the filter state in the table
  };

  // --- 列搜索属性生成函数 ---
  const getColumnSearchProps = useCallback((dataIndex, columnTitle) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}> {/* Prevent dropdown close on keydown */}
        <Input
          ref={searchInputRef}
          placeholder={`搜索 ${columnTitle || dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => {
              handleSearch(confirm, dataIndex);
              setSearchText(selectedKeys[0]);
              setSearchedColumn(dataIndex);
          }}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => {
                handleSearch(confirm, dataIndex);
                setSearchText(selectedKeys[0]);
                setSearchedColumn(dataIndex);
            }}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            搜索
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters, confirm)}
            size="small"
            style={{ width: 90 }}
          >
            重置
          </Button>
          {/* <Button
            type="link"
            size="small"
            onClick={() => close()} // Allow manual closing
          >
            关闭
          </Button> */}
        </Space>
      </div>
    ),
    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    // Let Ant Design Table handle the filtering if data is client-side
    // If server-side, filtering logic happens in 'onChange' handler
    onFilter: (value, record) =>
        record[dataIndex]
            ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
            : false,
    onFilterDropdownOpenChange: visible => {
        if (visible) {
            setTimeout(() => searchInputRef.current?.select(), 100);
        }
    },
    // Render function for highlighting
    render: text => {
        const textString = text ? String(text) : '';
        return (searchedColumn === dataIndex && searchText) ? (
            <Highlighter
            highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
            searchWords={[searchText]}
            autoEscape
            textToHighlight={textString}
            />
        ) : (
            textString // Ensure text is rendered even if not highlighted
        )
    },
  }), [searchedColumn, searchText]); // Include state dependencies

  // --- 处理动作点击（表格顶部操作和行内操作） ---
  const handleActionClick = useCallback((actionConfig, records) => {
    const { confirm, confirmTitle, confirmContent, onClick, key } = actionConfig;

    const execute = () => {
        if (onClick) {
            onClick(records, key); // Pass records and action key
        } else {
            console.warn(`Action "${key || 'unknown'}" has no onClick handler.`);
        }
    };

    if (confirm) {
      Modal.confirm({
        title: confirmTitle || '确认操作',
        content: confirmContent || '确定要执行此操作吗？',
        onOk: execute,
        okText: "确定",
        cancelText: "取消",
      });
    } else {
      execute();
    }
  }, []); // No dependencies needed if onClick handlers don't rely on component state directly

  // --- 处理行选择变化 ---
  const handleRowSelectionChange = (selectedKeys, selectedRows) => {
    if (!isSelectionControlled) {
        setInternalSelectedRowKeys(selectedKeys);
    }
    // Call external onChange if provided
    if (rowSelection && rowSelection.onChange) {
        rowSelection.onChange(selectedKeys, selectedRows);
    }
  };

  // --- 增强列配置 ---
  const enhancedColumns = useMemo(() => columns.map(column => {
    const { dataIndex, title, searchable, type, tagColorMap, actions: rowActions = [], render: customRender, ...restColumn } = column;
    const enhancedColumn = { dataIndex, title, ...restColumn }; // Ensure basic props are included

    // 1. 可搜索列
    if (searchable && dataIndex) {
      Object.assign(enhancedColumn, getColumnSearchProps(dataIndex, title));
    }

    // 2. 自定义渲染器优先级最高
    if (customRender) {
      enhancedColumn.render = (text, record, index) => customRender(text, record, index);
    }
    // 3. 内建类型渲染器
    else if (type) {
        switch (type) {
            case 'tag':
                enhancedColumn.render = (text) => {
                    if (text === null || text === undefined || text === '') return null;
                    const tagColor = tagColorMap?.[text] || 'default';
                    return <Tag color={tagColor}>{text}</Tag>;
                };
                break;
            case 'date':
                enhancedColumn.render = (text) => {
                    if (!text) return null;
                    try { return new Date(text).toLocaleDateString(); } catch (e) { return text; } // Basic error handling
                };
                break;
            case 'datetime':
                enhancedColumn.render = (text) => {
                    if (!text) return null;
                    try { return new Date(text).toLocaleString(); } catch (e) { return text; } // Basic error handling
                };
                break;
            case 'boolean':
                enhancedColumn.render = (text) => (text ? <Tag color="success">是</Tag> : <Tag color="default">否</Tag>); // Use Tags for better visuals
                break;
            case 'actions':
                enhancedColumn.fixed = enhancedColumn.fixed || 'right'; // Default actions to fixed right
                enhancedColumn.width = enhancedColumn.width || Math.max(rowActions.length * 60, 100); // Basic width estimation
                enhancedColumn.render = (_, record) => {
                    const visibleActions = rowActions.filter(action => !action.hidden?.(record)); // Support conditional hiding
                    const MAX_VISIBLE_INLINE = 2; // Max buttons before using dropdown

                    if (visibleActions.length === 0) return null;

                    if (visibleActions.length <= MAX_VISIBLE_INLINE) {
                        // Render inline buttons
                        return (
                            <Space>
                            {visibleActions.map((action) => (
                                <Tooltip title={action.tooltip} key={action.key || action.label}>
                                    <Button
                                        type={action.type || "link"}
                                        size="small"
                                        icon={action.icon}
                                        danger={action.danger}
                                        disabled={action.disabled?.(record)}
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent row click if action is clicked
                                            handleActionClick(action, [record]);
                                        }}
                                    >
                                        {action.label}
                                    </Button>
                                </Tooltip>
                            ))}
                            </Space>
                        );
                    } else {
                        // Render dropdown menu for more actions
                        const menuItems = visibleActions.map((action) => ({
                            key: action.key || action.label,
                            label: action.label,
                            icon: action.icon,
                            danger: action.danger,
                            disabled: action.disabled?.(record),
                            onClick: ({ domEvent }) => { // Get event from menu item click
                                domEvent.stopPropagation();
                                handleActionClick(action, [record]);
                            },
                        }));

                        return (
                            <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                                <Button type="link" size="small" onClick={e => e.stopPropagation()}>
                                    <MoreOutlined /> 操作
                                </Button>
                            </Dropdown>
                        );
                    }
                };
                break;
            default:
                // Default rendering (or keep AntD's default)
                break;
        }
    }
    // Add highlighter even if no specific type/render, if search is active
    else if (searchedColumn === dataIndex && searchText && !enhancedColumn.render) {
         enhancedColumn.render = text => {
            const textString = text ? String(text) : '';
            return (<Highlighter
                highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
                searchWords={[searchText]}
                autoEscape
                textToHighlight={textString}
                />)
         }
    }


    return enhancedColumn;
  }), [columns, getColumnSearchProps, handleActionClick, searchedColumn, searchText]); // Include dependencies

  // --- 表格顶部操作栏 ---
  const renderTableActions = () => {
    const hasActions = actions && actions.length > 0;
    const hasRefresh = !!onRefresh;

    if (!hasActions && !hasRefresh) return null;

    return (
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Space>
          {actions.map((action) => {
            const isDisabled = (action.needSelection && selectedRowKeys.length === 0) || action.disabled;
            const tooltipTitle = isDisabled && action.needSelection ? '请先选择数据' : action.tooltip;

            return (
              <Tooltip key={action.key || action.label} title={tooltipTitle}>
                {/* Span needed for Tooltip when Button is disabled */}
                <span>
                  <Button
                    type={action.type || "default"}
                    icon={action.icon}
                    danger={action.danger}
                    onClick={() => {
                      // Find selected records based on current data (might be filtered/paginated)
                      // It's often better if the onClick handler fetches fresh data if needed
                      const selectedRecordObjects = data.filter(item => selectedRowKeys.includes(typeof rowKey === 'function' ? rowKey(item) : item[rowKey]));
                      handleActionClick(action, selectedRecordObjects);
                    }}
                    disabled={isDisabled}
                  >
                    {action.label}
                  </Button>
                </span>
              </Tooltip>
            );
          })}
          {hasRefresh && (
             <Tooltip title="刷新">
                <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}/>
             </Tooltip>
          )}
        </Space>
      </div>
    );
  };

  // --- 配置行选择 ---
  const rowSelectionConfig = rowSelection ? {
    type: rowSelection.type || 'checkbox', // Default to checkbox
    selectedRowKeys, // Use the derived selectedRowKeys state
    onChange: handleRowSelectionChange,
    getCheckboxProps: rowSelection.getCheckboxProps,
    // Add other rowSelection props like fixed if needed
    // fixed: true,
  } : undefined;


  return (
    <div>
      {renderTableActions()}
      <Table
        columns={enhancedColumns}
        dataSource={data} // Directly use the data prop
        rowKey={rowKey}
        loading={loading}
        pagination={pagination}
        onChange={onChange} // Let parent handle pagination, filter, sort changes
        rowSelection={rowSelectionConfig}
        onRow={onRowClick ? (record) => ({
          onClick: (event) => {
            // Prevent row click trigger if clicking inside an action button/dropdown
            if (event.target.closest('button, .ant-dropdown-trigger')) {
                 return;
            }
            onRowClick(record);
          },
          style: { cursor: 'pointer' }
        }) : undefined}
        size="middle" // Default size
        bordered // Default border
        scroll={{ x: 'max-content', ...tableProps?.scroll }} // Default horizontal scroll, allow override
        {...tableProps} // Spread any additional table props
      />
    </div>
  );
};

export default DataTable;