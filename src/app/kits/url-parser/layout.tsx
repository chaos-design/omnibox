import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: 'URL 解析',
};

export default function UrlParserLayout({ children }: PropsWithChildren) {
  return children;
}
