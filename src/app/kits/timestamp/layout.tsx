import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: '时间戳',
};

export default function TimestampLayout({ children }: PropsWithChildren) {
  return children;
}
