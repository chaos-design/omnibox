import { ArrowRightIcon, ShieldCheckIcon } from 'lucide-react';
import Link from 'next/link';

import { toolCatalog } from '../utils/tool-catalog';

import s from './index.module.scss';

export default function Home() {
  return (
    <main aria-label="Omnibox 工具列表" className={s.page}>
      <div className={s.summary}>
        <p>常用开发工具集中处理，无需登录，输入内容不会离开浏览器。</p>
        <span>
          <ShieldCheckIcon aria-hidden="true" />
          Local only
        </span>
      </div>

      <section aria-label="工具列表" className={s.toolGrid}>
        {toolCatalog.map((tool) => {
          const Icon = tool.icon;

          return (
            <Link
              className={s.tool}
              href={tool.href}
              key={tool.href}
              prefetch={false}
            >
              <span className={s.icon}>
                <Icon aria-hidden="true" />
              </span>
              <span className={s.copy}>
                <strong>{tool.title}</strong>
                <span>{tool.description}</span>
              </span>
              <ArrowRightIcon aria-hidden="true" className={s.arrow} />
            </Link>
          );
        })}
      </section>
    </main>
  );
}
