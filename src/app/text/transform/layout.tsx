import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: '文本处理',
};

export default function TextTransformLayout({ children }: PropsWithChildren) {
  return children;
}
