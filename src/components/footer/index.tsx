import React, { useMemo, useState } from 'react';

import c from 'classnames';

import s from './index.module.scss';
import { footerConfig } from '../../utils/footer';

export interface FooterProps {
  className?: string;
}

const Footer = ({ className }: FooterProps) => {
  const _m = useMemo(() => footerConfig.module || [], []);
  const source = useMemo(() => footerConfig.source || [], []);

  return (
    <div className={c(s.footerContainer, className)}>
      <div className={s.footer}>
        <div className={s.footerModule}>
          {(_m || [])?.map((item, index) => (
            <div
              key={index}
              className={s.module}
              style={{
                width: `${100 / _m.length}%`,
              }}
            >
              <h2 className={s.moduleTitle}>{item.title}</h2>
              <div className={s.moduleContent}>
                {(item.list || []).map((_c, idx) => (
                  <a key={idx} href={_c.url} className={s.moduleItem}>
                    {_c.title}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className={s.footerSource}>
          {source?.map((item, index) =>
            item.url ? (
              <a
                key={index}
                className={s.source}
                href={item.url}
                target="_blank"
                rel="noreferrer"
              >
                {item.title}
              </a>
            ) : (
              <span className={s.source} key={index}>
                {item.title}
              </span>
            ),
          )}
        </div>
        <div className={s.footerContent}>{footerConfig.copyright}</div>
      </div>
    </div>
  );
};

export default Footer;
