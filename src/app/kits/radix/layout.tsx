import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: '进制转换',
};

export default function RadixLayout({ children }: PropsWithChildren) {
  return children;
}
