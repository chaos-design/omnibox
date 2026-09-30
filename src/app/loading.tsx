import { Loader2Icon } from 'lucide-react';

import s from './loading.module.scss';

export default function Loading() {
  return (
    <div aria-label="页面加载中" className={s.root} role="status">
      <div className={s.status}>
        <span className={s.badge}>
          <Loader2Icon aria-hidden="true" className={s.icon} />
        </span>
        <span className={s.label}>
          LOADING MODULE...
          <span aria-hidden="true" className={s.cursor} />
        </span>
        <span aria-hidden="true" className={s.track}>
          <span className={s.bar} />
        </span>
      </div>
    </div>
  );
}
