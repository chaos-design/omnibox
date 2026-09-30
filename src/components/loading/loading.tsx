import { Loader2Icon } from 'lucide-react';

import { cn } from '../../lib/utils';

import s from './index.module.scss';

export interface LoadingProps {
  className?: string;
  /** 视觉上的一行提示，说明正在加载什么。 */
  hint?: string;
  /** 读屏播报文案。缺省复用 hint。 */
  label?: string;
}

/**
 * 全站唯一的加载指示器。
 *
 * 形态是一个紧凑的胶囊：旋转图标 + 提示文案 + 三点波，横向排成一行。
 * 刻意不做成上下堆叠的两块 —— 那样会读成两个独立元素、视觉重心也会散开；
 * 收成一行之后整体只有一个重心，落在哪都是居中的。
 *
 * 动效分三层互不干扰：图标自转、胶囊底色呼吸、点波依次上跳。
 */
export function Loading({ className, hint, label }: LoadingProps) {
  return (
    <div
      aria-label={label ?? hint ?? '页面加载中'}
      className={cn(s.root, className)}
      role="status"
    >
      <div aria-hidden="true" className={s.pill}>
        <Loader2Icon className={s.icon} />
        {hint ? <span className={s.hint}>{hint}</span> : null}
        <span className={s.dots}>
          <span className={s.dot} />
          <span className={s.dot} />
          <span className={s.dot} />
        </span>
      </div>
    </div>
  );
}
