import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: 'Unix 权限',
};

export default function ChmodLayout({ children }: PropsWithChildren) {
  return children;
}
