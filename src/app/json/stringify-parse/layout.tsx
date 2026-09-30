import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: 'JSON 工作台',
};

export default function JsonWorkbenchLayout({ children }: PropsWithChildren) {
  return children;
}
