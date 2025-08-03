import React from 'react';
import { Descriptions, Tag, Typography, Divider, Card, Row, Col, Image } from 'antd';
import moment from 'moment';

const { Text, Link } = Typography;

/**
 * 详情面板组件
 * @param {Object} data - 详情数据对象
 * @param {Array} fieldsToShow - 字段白名单，不提供则显示所有字段
 * @param {Object} fieldLabels - 字段标签映射，格式为 {fieldName: '显示名称'}
 * @param {Object} fieldTypes - 字段类型映射，格式为 {fieldName: 'text|date|datetime|tag|image|link|boolean'}
 * @param {Object} fieldOptions - 字段额外配置，如标签颜色映射等
 * @param {String} title - 面板标题
 * @param {String} layout - 布局方式，可选 'horizontal'|'vertical'
 * @param {Object} sections - 分组配置，格式为 [{title: '分组标题', fields: ['字段1', '字段2']}]
 * @param {Number} column - 一行显示的字段数量
 */
const DetailPanel = ({
  data = {},
  fieldsToShow,
  fieldLabels = {},
  fieldTypes = {},
  fieldOptions = {},
  title,
  layout = 'horizontal',
  sections,
  column = 3
}) => {
  // 如果没有数据，显示空状态
  if (!data || Object.keys(data).length === 0) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Text type="secondary">暂无数据</Text>
        </div>
      </Card>
    );
  }

  // 根据字段类型渲染不同的显示方式
  const renderFieldValue = (fieldName, value) => {
    if (value === undefined || value === null) {
      return <Text type="secondary">-</Text>;
    }

    const fieldType = fieldTypes[fieldName] || 'text';
    const options = fieldOptions[fieldName] || {};

    switch (fieldType) {
      case 'date':
        return moment(value).format('YYYY-MM-DD');
      
      case 'datetime':
        return moment(value).format('YYYY-MM-DD HH:mm:ss');
      
      case 'tag':
        const tagColor = options.colorMap?.[value] || options.color || 'blue';
        return <Tag color={tagColor}>{value}</Tag>;
      
      case 'tags':
        if (!Array.isArray(value)) return value;
        return (
          <>
            {value.map((item, index) => {
              const tagColor = options.colorMap?.[item] || options.color || 'blue';
              return <Tag key={index} color={tagColor}>{item}</Tag>;
            })}
          </>
        );
      
      case 'image':
        return (
          <Image
            src={value}
            alt={fieldLabels[fieldName] || fieldName}
            width={options.width || 100}
            height={options.height}
          />
        );
      
      case 'link':
        return <Link href={value} target="_blank">{options.text || value}</Link>;
      
      case 'boolean':
        return value ? '是' : '否';
      
      case 'html':
        return <div dangerouslySetInnerHTML={{ __html: value }} />;
      
      default:
        return value;
    }
  };

  // 渲染单个字段
  const renderField = (fieldName) => {
    if (!data.hasOwnProperty(fieldName)) {
      return null;
    }

    const label = fieldLabels[fieldName] || fieldName;
    const value = data[fieldName];

    return (
      <Descriptions.Item key={fieldName} label={label}>
        {renderFieldValue(fieldName, value)}
      </Descriptions.Item>
    );
  };

  // 渲染所有字段
  const renderAllFields = () => {
    // 确定要显示的字段列表
    let fields = fieldsToShow;
    if (!fields) {
      fields = Object.keys(data);
    }

    return (
      <Descriptions
        title={title}
        bordered
        column={column}
        layout={layout}
        size="middle"
      >
        {fields.map(fieldName => renderField(fieldName))}
      </Descriptions>
    );
  };

  // 渲染分组字段
  const renderSections = () => {
    return (
      <>
        {title && <Divider orientation="left">{title}</Divider>}
        {sections.map((section, index) => (
          <div key={index}>
            <Divider orientation="left" plain>{section.title}</Divider>
            <Descriptions
              bordered
              column={section.column || column}
              layout={layout}
              size="middle"
            >
              {section.fields.map(fieldName => renderField(fieldName))}
            </Descriptions>
          </div>
        ))}
      </>
    );
  };

  // 渲染卡片布局
  const renderCardLayout = () => {
    // 确定要显示的字段列表
    let fields = fieldsToShow;
    if (!fields) {
      fields = Object.keys(data);
    }

    return (
      <Card title={title}>
        <Row gutter={[16, 16]}>
          {fields.map(fieldName => {
            if (!data.hasOwnProperty(fieldName)) {
              return null;
            }

            const label = fieldLabels[fieldName] || fieldName;
            const value = data[fieldName];

            return (
              <Col key={fieldName} span={24 / column}>
                <div>
                  <Text type="secondary">{label}:</Text>
                  <div style={{ marginTop: 4 }}>
                    {renderFieldValue(fieldName, value)}
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      </Card>
    );
  };

  // 根据配置选择渲染方式
  if (sections) {
    return renderSections();
  } else if (layout === 'card') {
    return renderCardLayout();
  } else {
    return renderAllFields();
  }
};

export default DetailPanel;

// 这个 DetailPanel 组件实现了以下功能：

// 1. 支持多种字段类型的展示：文本、日期、日期时间、标签、图片、链接、布尔值、HTML等
// 2. 支持字段分组展示
// 3. 支持自定义字段标签和显示顺序
// 4. 支持多种布局方式：水平布局、垂直布局、卡片布局
// 5. 支持自定义列数
// 6. 支持空数据状态展示