import { Loader2Icon } from 'lucide-react';

import { cn } from '../../lib/utils';

import s from './index.module.scss';

export interface LoadingProps {
  className?: string;
  /** 只给读屏播报，视觉上不渲染任何文字。 */
  label?: string;
}

/**
 * 全站唯一的加载指示器：图标块 + 光晕脉冲 + 三点波，三层动效各自独立。
 * 刻意不显示文案 —— 路由过渡往往只存在几百毫秒，文字来不及读就被撤掉，
 * 只会制造一次闪烁；语义交给 aria-label，视觉交给运动。
 */
export function Loading({ className, label = '页面加载中' }: LoadingProps) {
  return (
    <div aria-label={label} className={cn(s.root, className)} role="status">
      <span aria-hidden="true" className={s.chip}>
        <Loader2Icon className={s.icon} />
      </span>
      <span aria-hidden="true" className={s.dots}>
        <span className={s.dot} />
        <span className={s.dot} />
        <span className={s.dot} />
      </span>
    </div>
  );
}
