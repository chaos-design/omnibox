import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: 'IPv4 / CIDR',
};

export default function IpCidrLayout({ children }: PropsWithChildren) {
  return children;
}
