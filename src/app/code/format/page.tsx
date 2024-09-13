'use client';

import React, { useRef, useState } from 'react';

import prettier from 'prettier/standalone';
import parserBabel from 'prettier/parser-babel';
import prettierPluginEstree from 'prettier/plugins/estree';
import prettierPluginHtml from 'prettier/plugins/html';

import { Editor, EditorType } from '../../../components/editor';
import Toolbar from '../../../components/toolbar';

import { Button, Space } from 'antd';
import { useMonacoEditor } from '../../../utils/config/editor';
import { useAppConfig } from '../../../utils/config/app';

import s from './index.module.scss';

export default function Page() {
  const { editor } = useMonacoEditor();
  const appConfig = useAppConfig();

  return (
    <div className={s.pageContainer}>
      <Space
        style={{
          marginRight: 10,
        }}
        // direction="vertical"
        align="start"
        wrap
        size={10}
      >
        <Toolbar />
        <Button
          size="middle"
          type="primary"
          onClick={async () => {
            console.log('editor', editor.getValue(), appConfig);
            if (editor?.getValue?.()) {
              await prettier.format(editor.getValue(), {
                parser: 'html',
                plugins: [
                  // parserBabel,
                  // prettierPluginEstree,
                  prettierPluginHtml,
                ],
              });
            }
            editor.handleFormatDocument();
          }}
        >
          格式化
        </Button>
      </Space>
      <Editor language={appConfig.language} />
    </div>
  );
}
