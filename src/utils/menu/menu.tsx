import {
  BracesIcon,
  Code2Icon,
  DatabaseIcon,
  FileJson2Icon,
  HouseIcon,
  type LucideIcon,
  TypeIcon,
  WrenchIcon,
} from 'lucide-react';

import { MENU_PATH_DATA } from './folder';

interface MenuInfo {
  icon?: LucideIcon;
  label: string;
  path?: string;
}

export interface NavigationItem {
  children?: NavigationItem[];
  icon?: LucideIcon;
  key: string;
  label: string;
  path?: string;
}

export const MENU_INFO: Record<string, MenuInfo> = {
  home: {
    icon: HouseIcon,
    label: '首页',
    path: '/',
  },
  json: {
    icon: BracesIcon,
    label: 'JSON',
  },
  code: {
    icon: Code2Icon,
    label: '代码',
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
  js: {
    icon: FileJson2Icon,
    label: 'JavaScript',
  },
  'to-ts': {
    label: '转 TypeScript',
  },
  'to-schema': {
    label: '转 Schema',
  },
  data: {
    icon: DatabaseIcon,
    label: '数据',
  },
  'csv-json': {
    label: 'CSV / JSON',
  },
  xml: {
    label: 'XML',
  },
  'json-pointer': {
    label: 'JSON Pointer',
  },
  text: {
    icon: TypeIcon,
    label: '文本',
  },
  codec: {
    label: '编码解码',
  },
  transform: {
    label: '文本处理',
  },
  regex: {
    label: '正则测试',
  },
  unicode: {
    label: 'Unicode',
  },
  kits: {
    icon: WrenchIcon,
    label: '工具箱',
  },
  'hash-random': {
    label: '哈希与随机值',
  },
  jwt: {
    label: 'JWT 解码',
  },
  hmac: {
    label: 'HMAC',
  },
  color: {
    label: '颜色与对比度',
  },
  'data-size': {
    label: '数据大小',
  },
  chmod: {
    label: 'Unix 权限',
  },
  cron: {
    label: 'Cron',
  },
  'ip-cidr': {
    label: 'IPv4 / CIDR',
  },
  semver: {
    label: 'SemVer',
  },
  'data-url': {
    label: 'Data URL',
  },
  'http-builder': {
    label: 'HTTP 代码生成',
  },
  qrcode: {
    label: '二维码',
  },
  radix: {
    label: '进制转换',
  },
  timestamp: {
    label: '时间戳',
  },
  'url-parser': {
    label: 'URL 解析',
  },
};

function getMenuInfo(label: string): MenuInfo {
  return MENU_INFO[label] ?? { label };
}

export const menu: NavigationItem[] = MENU_PATH_DATA.map((group) => {
  const info = getMenuInfo(group.label);

  return {
    children: group.children?.map((item) => {
      const childInfo = getMenuInfo(item.label);

      return {
        key: item.path,
        label: childInfo.label,
        path: item.path,
      };
    }),
    icon: info.icon,
    key: info.path ?? group.key,
    label: info.label,
    path: info.path,
  };
});
