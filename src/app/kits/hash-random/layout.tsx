import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: '哈希与随机值',
};

export default function HashRandomLayout({ children }: PropsWithChildren) {
  return children;
}
