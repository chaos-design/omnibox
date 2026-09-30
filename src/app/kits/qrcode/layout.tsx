import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: '二维码生成器',
};

export default function QrCodeLayout({ children }: PropsWithChildren) {
  return children;
}
