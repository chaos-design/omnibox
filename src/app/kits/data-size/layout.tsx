import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: '数据大小',
};

export default function DataSizeLayout({ children }: PropsWithChildren) {
  return children;
}
