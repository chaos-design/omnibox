'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Editor, PureEditor } from '../../../components/editor';

import {
  Space,
  Button,
  ButtonProps,
  Splitter,
  Typography,
  Input,
  Switch,
  Modal,
  Tooltip,
  Form,
  Spin,
  message,
} from 'antd';

import { useMonacoEditor } from '../../../utils/config/editor';

import { copyToClipboard } from '../../../utils/tools/copy';
import { storageStringifyParseValue } from '../../../utils/storage/json';

import s from './index.module.scss';
import {
  CopyOutlined,
  FieldStringOutlined,
  ReloadOutlined,
  SettingOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { convert2JSON, isJSON } from '../../../utils/tools/json';

const demoText = `{
  "Name": "Rai120",
  "Github": "https://github.com/rain120",
  "Info": {
    "age": 20,
    "active": true,
    "description": "😊他说：“你好，世界！”"
  }
}`;

enum OperateType {
  'format' = 0,
  'copy',
  'demo',
  'settings',
  'transform',
}

export default function Page() {
  const [ts, setTs] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { editor } = useMonacoEditor();
  const cache = storageStringifyParseValue();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [interfaceName, setInterfaceName] = useState('RootInterface');
  const [splitTypes, setSplitTypes] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false); // 添加加载状态

  useEffect(() => {
    if (!editor) {
      return;
    }

    const initialValue = cache.getItem() || demoText;
    editor.setValue(initialValue);
    transform();

    if (!cache.getItem()) {
      cache.setItem(initialValue);
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [editor]);

  const transform = useCallback(
    async (v?: string) => {
      setIsLoading(true);

      let value = v || editor.getValue();
      setError(null);

      if (value) {
        value = convert2JSON(value);

        cache.setItem(value);
        try {
          JSON.parse(value);

          const response = await fetch('/api/js-to-ts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              json: value,
              interfaceName,
              splitTypes,
            }),
          });

          console.log('Response status:', response.status);
          const result = await response.json();
          console.log('API response:', result);

          if (!response.ok) {
            throw new Error(result.error || 'API request failed');
          }

          if (result?.tsCode) {
            setTs(result.tsCode);
          } else {
            setError('转换成功，但未返回有效的 TypeScript 代码。');
          }
        } catch (err: any) {
          console.error('Transform error:', err);
          if (err instanceof SyntaxError) {
            setError('输入的不是有效的 JSON 格式。');
          } else {
            setError(`转换错误: ${err.message}`);
          }
        } finally {
          setIsLoading(false);
        }

        if (error) {
          message.error(error);
        } else {
          message.success('转换成功');
        }
      } else {
        setError(null);
        setTs('');
        cache.setItem('');
        setIsLoading(false); // 无输入时设置加载状态为 false
      }
    },
    [editor, cache, interfaceName, splitTypes],
  );

  const handleEditorChange = useCallback(
    (v?: string) => {
      if (!v) {
        return;
      }

      handleOperate(OperateType.format);
      if (editor) {
        editor.setValue(v);
      }

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        transform(v);
      }, 500);
    },
    [transform],
  );

  const handleOperate = useCallback(
    (type: OperateType, custom?: string) => {
      switch (type) {
        case OperateType.transform:
          transform();
          break;
        case OperateType.format:
          const value = editor?.getValue();

          if (!isJSON(value)) {
            if (editor) {
              editor.setValue(convert2JSON(value));
            }
          }

          if (editor) {
            editor.handleFormatDocument();
          }
          break;
        case OperateType.copy:
          if (custom) {
            copyToClipboard(custom);
          }
          break;
        case OperateType.demo:
          if (editor) {
            editor.setValue(demoText);
            editor.handleFormatDocument();
          }
          break;
        case OperateType.settings:
          setIsModalOpen(true);
          break;
        default:
          break;
      }
    },
    [editor],
  );

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const operateList: {
    label?: string;
    value: OperateType;
    props?: ButtonProps;
  }[] = useMemo(
    () => [
      {
        props: {
          icon: (
            <Tooltip title="Format">
              <ReloadOutlined />
            </Tooltip>
          ),
        },
        value: OperateType.format,
      },
      {
        label: 'Transform',
        props: {
          icon: (
            <Tooltip title="Transform">
              <SyncOutlined />
            </Tooltip>
          ),
        },
        value: OperateType.transform,
      },
      {
        props: {
          icon: (
            <Tooltip title="Demo">
              <FieldStringOutlined />
            </Tooltip>
          ),
        },
        value: OperateType.demo,
      },
      {
        props: {
          icon: (
            <Tooltip title="Settings">
              <SettingOutlined />
            </Tooltip>
          ),
        },
        value: OperateType.settings,
      },
    ],
    [],
  );

  useEffect(() => {
    form.setFieldsValue({
      interfaceName,
      splitTypes,
    });
  }, [interfaceName, splitTypes]);

  const onFinish = (values: { interfaceName: string; splitTypes: boolean }) => {
    setInterfaceName(values.interfaceName);
    setSplitTypes(values.splitTypes);
    setIsModalOpen(false);
    transform();
  };

  return (
    <div className={s.pageContainer}>
      <Splitter>
        <Splitter.Panel defaultSize="50%" min="30%" max="70%">
          <Space
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              marginBottom: 10,
              marginRight: 10,
            }}
          >
            <Space>
              <Typography.Title level={4}>JSON or JS Object</Typography.Title>
            </Space>
            <Space align="start" wrap size={10}>
              {operateList.map((item) => {
                return (
                  <Button
                    key={item.value}
                    size="middle"
                    type="primary"
                    {...item?.props}
                    onClick={(e) => {
                      if (typeof item.props?.onClick === 'function') {
                        item.props.onClick(e);
                      } else {
                        handleOperate(item.value);
                      }
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Space>
          </Space>
          <Editor onEditorChange={handleEditorChange} />
          {error && (
            <Typography.Text
              type="danger"
              style={{ display: 'block', marginTop: '10px' }}
            >
              {error}
            </Typography.Text>
          )}
        </Splitter.Panel>
        <Splitter.Panel>
          <Space
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              marginBottom: 10,
            }}
          >
            <Space>
              <Typography.Title level={4}>Typescript</Typography.Title>
            </Space>
            <Space align="start" wrap size={10}>
              {[
                {
                  props: {
                    icon: (
                      <Tooltip title="Copy">
                        <CopyOutlined />
                      </Tooltip>
                    ),
                  },
                  value: OperateType.copy,
                },
              ].map((item: (typeof operateList)[0]) => {
                return (
                  <Button
                    key={item.value}
                    size="middle"
                    type="primary"
                    {...item?.props}
                    onClick={(e) => {
                      if (typeof item.props?.onClick === 'function') {
                        item.props.onClick(e);
                      } else {
                        handleOperate(item.value, ts);
                      }
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Space>
          </Space>
          <Spin spinning={isLoading} wrapperClassName={s.tsEditor}>
            <PureEditor
              value={ts}
              options={{
                readOnly: true,
              }}
              defaultLanguage="typescript"
            />
          </Spin>
        </Splitter.Panel>
      </Splitter>
      <Modal
        title="转换设置"
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={handleCancel}
      >
        <Form
          form={form}
          onFinish={onFinish}
          labelCol={{
            span: 6,
          }}
          wrapperCol={{
            span: 18,
          }}
        >
          <Form.Item
            label="接口名称"
            name="interfaceName"
            rules={[{ required: true, message: '请输入接口名称' }]}
          >
            <Input placeholder="请输入接口名称" />
          </Form.Item>
          <Form.Item label="创建单一类型" name="splitTypes">
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
