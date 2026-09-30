import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: '颜色与对比度',
};

export default function ColorLayout({ children }: PropsWithChildren) {
  return children;
}
