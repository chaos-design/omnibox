import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: 'HMAC',
};

export default function HmacLayout({ children }: PropsWithChildren) {
  return children;
}
