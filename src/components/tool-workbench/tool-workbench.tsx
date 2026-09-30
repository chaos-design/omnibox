import type { ComponentProps, PropsWithChildren, ReactNode } from 'react';

import { cn } from '../../lib/utils';

import s from './index.module.scss';

interface ToolWorkbenchProps extends PropsWithChildren {
  className?: string;
  description: string;
  title: string;
}

interface ToolGridProps extends ComponentProps<'div'> {
  columns?: 1 | 2 | 3;
}

interface ToolPanelProps extends ComponentProps<'section'> {
  actions?: ReactNode;
  description?: string;
  title: string;
}

export function ToolWorkbench({
  children,
  className,
  description,
  title,
}: ToolWorkbenchProps) {
  return (
    <main aria-label={title} className={cn(s.page, className)}>
      <header className={s.pageHeader}>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      {children}
    </main>
  );
}

export function ToolGrid({
  children,
  className,
  columns = 2,
  ...props
}: ToolGridProps) {
  return (
    <div className={cn(s.grid, s[`columns${columns}`], className)} {...props}>
      {children}
    </div>
  );
}

export function ToolPanel({
  actions,
  children,
  className,
  description,
  title,
  ...props
}: ToolPanelProps) {
  return (
    <section className={cn(s.panel, className)} {...props}>
      <header className={s.panelHeader}>
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className={s.panelActions}>{actions}</div> : null}
      </header>
      <div className={s.panelBody}>{children}</div>
    </section>
  );
}
