import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: 'HTTP 代码生成',
};

export default function HttpBuilderLayout({ children }: PropsWithChildren) {
  return children;
}
