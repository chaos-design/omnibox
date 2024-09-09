import React, { useState } from 'react';

import c from 'classnames';

import { Space, Select, Button } from 'antd';
import { language as originalLanguage } from '../../utils/language';

import s from './index.module.scss';
import { useAppConfig } from '../../utils/config/app';

export interface ToolbarProps {
  className?: string;
  children?: React.ReactNode;
}

const Toolbar = ({ className, children }: ToolbarProps) => {
  const [language, setLanguage] = useState('json');
  const appConfig = useAppConfig();

  return (
    <div className={c(s.toolbarContainer, className)}>
      <Space direction="horizontal" size={20}>
        <Select
          showSearch
          style={{ width: 200 }}
          placeholder="选择语言"
          optionFilterProp="label"
          value={language}
          onChange={(v) => {
            setLanguage(v);
            appConfig.setAppConfig({
              language: v,
            });
          }}
          options={originalLanguage?.map((item) => ({
            value: item,
            // label: item.replace(/^[a-z]/, (c) => c.toUpperCase()),
            label: item.toUpperCase(),
          }))}
        />
        {children}
      </Space>
    </div>
  );
};

export default Toolbar;
