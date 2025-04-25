import {
  HomeOutlined,
  AppstoreOutlined,
  CodepenOutlined,
  JavaScriptOutlined,
  ShopOutlined,
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
  selector: {
    label: '选择器',
  },
  xpath: {
    label: 'xpath',
  },
  js: {
    label: 'Javascript',
    icon: <JavaScriptOutlined />,
  },
  'to-json': {
    label: '转 JSON',
  },
  'to-ts': {
    label: '转 Typescript',
  },
  'to-schema': {
    label: '转 Schema',
  },
  kits: {
    label: '工具箱',
    icon: <ShopOutlined />,
  },
  qrcode: {
    label: '二维码',
  },
};

export const menu = MENU_PATH_DATA.map((m) => {
  const c = MENU_INFO[m.label] ?? {
    label: m.label,
  };

  return {
    ...c,
    ...omit(m, 'path'),
    key: c.path || m.key,
    label: c.path ? <Link href={c.path}>{c.label}</Link> : c.label,
    children: m.children?.map((mc) => {
      const _mc = MENU_INFO[mc.label] ?? {
        label: mc.label,
      };

      return {
        ..._mc,
        ...mc,
        key: mc.path,
        label: <Link href={mc.path}>{_mc.label}</Link>,
      };
    }),
  };
});
