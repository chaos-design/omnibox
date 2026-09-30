import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: '代码美化',
};

export default function CodeFormatLayout({ children }: PropsWithChildren) {
  return children;
}
