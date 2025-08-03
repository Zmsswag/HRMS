import React, { useState, useEffect } from 'react';
import { Form, Input, Select, DatePicker, Button, Row, Col, Divider, InputNumber, Switch, Radio, Checkbox, message } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import moment from 'moment';

const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Option } = Select;

/**
 * 动态表单组件
 * @param {Object} formSchema - 表单结构定义
 * @param {Object} initialData - 初始数据
 * @param {Function} onSubmit - 提交回调
 * @param {Boolean} loading - 加载状态
 * @param {String} submitText - 提交按钮文字
 */
const DynamicForm = ({ 
  formSchema, 
  initialData = {}, 
  onSubmit, 
  loading = false, 
  submitText = '提交'
}) => {
  const [form] = Form.useForm();
  const [formData, setFormData] = useState(initialData);

  useEffect(() => {
    if (initialData) {
      // 处理日期类型的初始值
      const processedData = { ...initialData };
      
      if (formSchema && formSchema.fields) {
        formSchema.fields.forEach(field => {
          if (field.type === 'date' && processedData[field.name]) {
            processedData[field.name] = moment(processedData[field.name]);
          } else if (field.type === 'dateRange' && processedData[field.name]) {
            processedData[field.name] = [
              moment(processedData[field.name][0]),
              moment(processedData[field.name][1])
            ];
          }
        });
      }
      
      form.setFieldsValue(processedData);
      setFormData(processedData);
    }
  }, [form, JSON.stringify(formSchema)]);

  const handleValuesChange = (changedValues, allValues) => {
    setFormData(allValues);
  };

  const handleSubmit = async (values) => {
    try {
      // 处理日期格式
      const processedValues = { ...values };
      
      if (formSchema && formSchema.fields) {
        formSchema.fields.forEach(field => {
          if (field.type === 'date' && processedValues[field.name]) {
            processedValues[field.name] = processedValues[field.name].format('YYYY-MM-DD');
          } else if (field.type === 'dateRange' && processedValues[field.name]) {
            processedValues[field.name] = [
              processedValues[field.name][0].format('YYYY-MM-DD'),
              processedValues[field.name][1].format('YYYY-MM-DD')
            ];
          }
        });
      }
      
      await onSubmit(processedValues);
      message.success('提交成功');
    } catch (error) {
      message.error('提交失败: ' + (error.message || '未知错误'));
    }
  };

  // 根据字段类型渲染对应的表单控件
  const renderFormItem = (field) => {
    const { type, name, label, placeholder, options, rules = [], ...rest } = field;

    switch (type) {
      case 'input':
        return <Input placeholder={placeholder || `请输入${label}`} {...rest} />;
      
      case 'textarea':
        return <TextArea rows={4} placeholder={placeholder || `请输入${label}`} {...rest} />;
      
      case 'number':
        return <InputNumber style={{ width: '100%' }} placeholder={placeholder || `请输入${label}`} {...rest} />;
      
      case 'select':
        return (
          <Select placeholder={placeholder || `请选择${label}`} {...rest}>
            {options && options.map(option => (
              <Option key={option.value} value={option.value}>{option.label}</Option>
            ))}
          </Select>
        );
      
      case 'date':
        return <DatePicker style={{ width: '100%' }} placeholder={placeholder || `请选择${label}`} {...rest} />;
      
      case 'dateRange':
        return <RangePicker style={{ width: '100%' }} {...rest} />;
      
      case 'switch':
        return <Switch {...rest} />;
      
      case 'radio':
        return (
          <Radio.Group {...rest}>
            {options && options.map(option => (
              <Radio key={option.value} value={option.value}>{option.label}</Radio>
            ))}
          </Radio.Group>
        );
      
      case 'checkbox':
        return (
          <Checkbox.Group {...rest}>
            {options && options.map(option => (
              <Checkbox key={option.value} value={option.value}>{option.label}</Checkbox>
            ))}
          </Checkbox.Group>
        );
      
      case 'list':
        return (
          <Form.List name={name}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(field => (
                  <Row key={field.key} gutter={16} align="middle">
                    {field.listFields && field.listFields.map(listField => (
                      <Col span={24 / (field.listFields.length + 1)} key={listField.name}>
                        <Form.Item
                          {...field}
                          name={[field.name, listField.name]}
                          fieldKey={[field.fieldKey, listField.name]}
                          label={listField.label}
                          rules={listField.rules}
                        >
                          {renderFormItem(listField)}
                        </Form.Item>
                      </Col>
                    ))}
                    <Col span={24 / (field.listFields?.length + 1 || 2)}>
                      <MinusCircleOutlined onClick={() => remove(field.name)} />
                    </Col>
                  </Row>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    添加{label}
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        );
      
      default:
        return <Input placeholder={placeholder || `请输入${label}`} {...rest} />;
    }
  };

  // 渲染表单
  const renderForm = () => {
    if (!formSchema || !formSchema.fields) {
      return <div>表单配置不存在</div>;
    }

    return (
      <Form
        form={form}
        layout={formSchema.layout || 'horizontal'}
        labelCol={formSchema.labelCol || { span: 6 }}
        wrapperCol={formSchema.wrapperCol || { span: 14 }}
        initialValues={formData}
        onValuesChange={handleValuesChange}
        onFinish={handleSubmit}
        scrollToFirstError
      >
        {formSchema.sections && formSchema.sections.map((section, index) => (
          <div key={index}>
            {section.title && <Divider orientation="left">{section.title}</Divider>}
            <Row gutter={16}>
              {section.fields.map(field => (
                <Col key={field.name} span={field.colSpan || 24}>
                  <Form.Item
                    name={field.name}
                    label={field.label}
                    rules={field.rules || []}
                    tooltip={field.tooltip}
                    extra={field.extra}
                    dependencies={field.dependencies}
                  >
                    {renderFormItem(field)}
                  </Form.Item>
                </Col>
              ))}
            </Row>
          </div>
        ))}

        {!formSchema.sections && formSchema.fields && (
          <Row gutter={16}>
            {formSchema.fields.map(field => (
              <Col key={field.name} span={field.colSpan || 24}>
                <Form.Item
                  name={field.name}
                  label={field.label}
                  rules={field.rules || []}
                  tooltip={field.tooltip}
                  extra={field.extra}
                  dependencies={field.dependencies}
                >
                  {renderFormItem(field)}
                </Form.Item>
              </Col>
            ))}
          </Row>
        )}

        <Form.Item wrapperCol={{ offset: formSchema.labelCol?.span || 6, span: formSchema.wrapperCol?.span || 14 }}>
          <Button type="primary" htmlType="submit" loading={loading}>
            {submitText}
          </Button>
        </Form.Item>
      </Form>
    );
  };

  return renderForm();
};

export default DynamicForm;