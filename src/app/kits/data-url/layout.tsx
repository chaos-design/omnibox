import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: 'Data URL',
};

export default function DataUrlLayout({ children }: PropsWithChildren) {
  return children;
}
