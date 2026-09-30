'use client';

import { usePathname } from 'next/navigation';

import { Loading } from '../components/loading';
import { toolCatalog } from '../utils/tool-catalog';

import s from './loading.module.scss';

function normalizePath(path: string) {
  return path === '/' ? path : path.replace(/\/+$/u, '');
}

/**
 * 路由级加载态。
 *
 * 提示文案取自 tool-catalog：告诉用户正在加载的是哪个工具，
 * 而不是干巴巴一句"加载中"。匹配不到（404、未来的新路由）时
 * 退回到通用文案，不让这块出现空白胶囊。
 */
export default function RouteLoading() {
  const pathname = usePathname();
  const current = normalizePath(pathname);
  const tool = toolCatalog.find((item) => normalizePath(item.href) === current);
  const hint = tool ? `正在加载 ${tool.title}` : '正在加载模块';

  return <Loading className={s.root} hint={hint} />;
}
