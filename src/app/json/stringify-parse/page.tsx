'use client';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { Editor } from '../../../components/editor';

import { Space, Button, ButtonProps } from 'antd';

import { useMonacoEditor } from '../../../utils/config/editor';
import * as json from '../../../utils/tools/json';

import s from './index.module.scss';
import { copyToClipboard } from '../../../utils/tools/copy';
import { storageStringifyParseValue } from '../../../utils/storage/json';

const demoText = `{
  "name": "John Doe",
  "text": "Line1\\nLine2\\tTabbed",
  "info": {
    "age": 30,
    "active": true,
    "description": "他说：“你好，世界！”"
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

export default function Page() {
  const { editor } = useMonacoEditor();
  // console.log('editorRef', editorRef.current, editor);
  const cache = storageStringifyParseValue()

  useEffect(() => {
    const value = editor?.getValue();

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
      <Editor />
    </div>
  );
}
