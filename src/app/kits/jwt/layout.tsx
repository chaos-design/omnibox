import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: 'JWT 解码',
};

export default function JwtLayout({ children }: PropsWithChildren) {
  return children;
}
