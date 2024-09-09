import {
  HomeOutlined,
  AppstoreOutlined,
  CodepenOutlined,
} from '@ant-design/icons';

import { omit } from 'lodash';

import Link from 'next/link';

import { MENU_PATH_DATA } from './folder';

export const MENU_INFO: Record<string, any> = {
  home: {
    label: '首页',
    path: '/',
    icon: <HomeOutlined />,
  },
  json: {
    label: 'JSON',
    icon: <AppstoreOutlined />,
  },
  code: {
    label: '代码',
    icon: <CodepenOutlined />,
  },
  diff: {
    label: '代码对比',
  },
  format: {
    label: '代码美化',
  },
  'stringify-parse': {
    label: '压缩转义',
  },
};

export const menu = MENU_PATH_DATA.map((m) => {
  const c = MENU_INFO[m.label] ?? {};

  return {
    ...c,
    ...omit(m, 'path'),
    label: c.path ? <Link href={c.path}>{c.label}</Link> : c.label,
    children: m.children?.map((mc) => {
      const _mc = MENU_INFO[mc.label] ?? {};

      return {
        ..._mc,
        ...mc,
        label: <Link href={mc.path}>{_mc.label}</Link>,
      };
    }),
  };
});