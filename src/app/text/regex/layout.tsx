import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: '正则测试',
};

export default function RegexLayout({ children }: PropsWithChildren) {
  return children;
}
