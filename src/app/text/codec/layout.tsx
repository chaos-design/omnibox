import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: '文本编码',
};

export default function CodecLayout({ children }: PropsWithChildren) {
  return children;
}
