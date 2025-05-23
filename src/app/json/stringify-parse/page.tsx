'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Editor } from '../../../components/editor';

import { Space, Button, ButtonProps, Tabs, notification, Input } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

import { useMonacoEditor } from '../../../utils/config/editor';
import * as json from '../../../utils/tools/json';

import { copyToClipboard } from '../../../utils/tools/copy';
import { storageStringifyParseValue } from '../../../utils/storage/json';

import s from './index.module.scss';

const demoText = `{
  "name": "Rai120",
  "github": "https://github.com/rain120",
  "info": {
    "age": 20,
    "active": true,
    "description": "😊他说：“你好，世界！”"
  }
}`;

enum OperateType {
  'format' = 0,
  'compressAndEscape',
  'compress',
  'escape',
  'unescape',
  'unicodeToChinese',
  'chineseToUnicode',
  'chinesePunctuationToEnglish',
  'copy',
  'demo',
}

type TargetKey = React.MouseEvent | React.KeyboardEvent | string;

const Content = ({ activeKey }: { activeKey: string }) => {
  const { editor } = useMonacoEditor();
  // console.log('editorRef', editorRef.current, editor);
  const cache = storageStringifyParseValue(activeKey);

  useEffect(() => {
    const value = editor?.getValue(cache.getStorageKey());

    if (value) {
      cache.setItem(value);
    } else {
      const localValue = cache.getItem();

      if (localValue) {
        editor?.setValue(localValue);
      } else {
        editor?.setValue(demoText);
      }
    }
  }, [editor]);

  const handleOperate = useCallback(
    (type: OperateType) => {
      const value = editor?.getValue();

      if (!json.isJSON(value)) {
        editor.setValue(json.convert2JSON(value));
      }

      cache.setItem(value || demoText);

      switch (type) {
        case OperateType.format:
          editor.handleFormatDocument();
          break;
        case OperateType.compressAndEscape:
          if (value) {
            editor.setValue(json.compressAndEscapeJSON(value));
          }
          break;
        case OperateType.compress:
          if (value) {
            editor.setValue(json.compressJSON(value));
          }
          break;
        case OperateType.escape:
          if (value) {
            editor.setValue(json.escapeJSON(value));
          }
          break;
        case OperateType.unescape:
          if (value) {
            editor.handleFormatDocument();
            editor.setValue(json.unescapeJSON(value));
          }
          break;
        case OperateType.unicodeToChinese:
          if (value) {
            editor.setValue(json.unicodeToChinese(value));
          }
          break;
        case OperateType.chineseToUnicode:
          if (value) {
            editor.setValue(json.chineseToUnicode(value));
          }
          break;
        case OperateType.chinesePunctuationToEnglish:
          if (value) {
            editor.setValue(
              json.chinesePunctuationToEnglish(
                value,
                editor.getLanguage() === 'json',
              ),
            );
          }
          break;
        case OperateType.copy:
          if (value) {
            copyToClipboard(value);
          }
          break;
        case OperateType.demo:
          if (editor) {
            editor.setValue(demoText);
          }
          break;

        default:
          break;
      }
    },
    [editor],
  );

  const operateList: {
    label: string;
    value: OperateType;
    props?: ButtonProps;
  }[] = useMemo(
    () => [
      {
        label: '格式化',
        value: OperateType.format,
      },
      {
        label: '压缩并转义',
        value: OperateType.compressAndEscape,
      },
      {
        label: '压缩',
        value: OperateType.compress,
      },
      {
        label: '转义',
        value: OperateType.escape,
      },
      {
        label: '去除转义',
        value: OperateType.unescape,
      },
      {
        label: 'Unicode转中文',
        value: OperateType.unicodeToChinese,
      },
      {
        label: '中文转Unicode',
        value: OperateType.chineseToUnicode,
      },
      {
        label: '中文符号转英文符号',
        value: OperateType.chinesePunctuationToEnglish,
      },
      {
        label: '复制',
        value: OperateType.copy,
      },
      {
        label: 'Demo',
        value: OperateType.demo,
      },
    ],
    [],
  );

  return (
    <div className={s.pageContainer}>
      <Space
        style={{
          marginRight: 10,
        }}
        direction="vertical"
        align="start"
        wrap
        size={10}
      >
        {operateList.map((item) => {
          return (
            <Button
              key={item.value}
              size="middle"
              type="primary"
              {...item.props}
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
      <Editor
        className={s.editor}
        onEditorChange={(v) => {
          cache.setItem(v || demoText);
        }}
      />
    </div>
  );
};

export default function Page() {
  const cacheTabs = storageStringifyParseValue('tabs');
  let fistTab: any[] = [{ label: 'Tab 1', key: 'tab_1' }];

  try {
    if (cacheTabs.getItem()) {
      fistTab = JSON.parse(cacheTabs.getItem());
    }
  } catch (error) {
    fistTab = [{ label: 'Tab 1', key: 'tab_1' }];
  }
  const [activeKey, setActiveKey] = useState(fistTab?.[0]?.key || 'tab_1');
  const [items, setItems] = useState(fistTab);
  const newTabIndex = useRef(0);
  const contentRef = useRef(null);

  const onChange = (newActiveKey: string) => {
    setActiveKey(newActiveKey);
  };

  const add = () => {
    const newActiveKey = `newTab${newTabIndex.current++}`;
    const newPanes = [...items];
    newPanes.push({
      label: 'New Tab',
      // children: <Content activeKey={newActiveKey} />,
      key: newActiveKey,
    });
    setItems(newPanes);
    setActiveKey(newActiveKey);

    cacheTabs.setItem(JSON.stringify(newPanes));
  };

  const remove = (targetKey: TargetKey) => {
    if (items.length <= 1) {
      notification.info({
        message: '至少保留一个Tab!',
      });
      return;
    }

    let newActiveKey = activeKey;
    let lastIndex = -1;
    const newPanes = items.filter((item, i) => {
      if (item.key === targetKey) {
        lastIndex = i - 1;
        return false;
      }
      return true;
    });

    if (newPanes.length && newActiveKey === targetKey) {
      if (lastIndex >= 0) {
        newActiveKey = newPanes[lastIndex].key;
      } else {
        newActiveKey = newPanes[0].key;
      }
    }
    setItems(newPanes);
    setActiveKey(newActiveKey);
    cacheTabs.setItem(JSON.stringify(newPanes));
  };

  const onEdit = (
    targetKey: React.MouseEvent | React.KeyboardEvent | string,
    action: 'add' | 'remove',
  ) => {
    if (action === 'add') {
      add();
    } else {
      if (items.length === 1) {
        notification.info({
          message: '至少保留一个Tab!',
        });
        return;
      }
      remove(targetKey);
    }
  };

  return (
    <div ref={contentRef} className={s.pageTabsContainer}>
      <Tabs
        type="editable-card"
        onChange={onChange}
        activeKey={activeKey}
        onEdit={onEdit}
        removeIcon={items.length > 1 ? <CloseOutlined /> : <React.Fragment />}
        items={items.map((item) => ({
          label: item.label,
          key: item.key,
          children: <Content activeKey={item.key} />,
        }))}
      />
    </div>
  );
}
