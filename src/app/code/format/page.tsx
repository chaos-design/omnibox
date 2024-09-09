'use client';

import React, { useRef, useState } from 'react';

import { Editor, EditorType } from '../../../components/editor';
import Toolbar from '../../../components/toolbar';

import s from './index.module.scss';
import { Button, Space } from 'antd';
import { useMonacoEditor } from '../../../utils/config/editor';
import { useAppConfig } from '../../../utils/config/app';

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
          onClick={() => {
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
