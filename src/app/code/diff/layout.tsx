import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: '代码对比',
};

export default function CodeDiffLayout({ children }: PropsWithChildren) {
  return children;
}
