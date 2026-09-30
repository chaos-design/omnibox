import { footerConfig } from '../../utils/footer';

import s from './index.module.scss';

export interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <div className={[s.footer, className].filter(Boolean).join(' ')}>
      <span>{footerConfig.copyright}</span>
      <span aria-hidden="true">·</span>
      {footerConfig.source.map((item) =>
        item.url ? (
          <a
            key={item.title}
            className={s.link}
            href={item.url}
            rel="noreferrer"
            target="_blank"
          >
            {item.title}
          </a>
        ) : (
          <span key={item.title}>{item.title}</span>
        ),
      )}
    </div>
  );
}
