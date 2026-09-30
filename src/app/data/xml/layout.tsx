import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: 'XML',
};

export default function XmlLayout({ children }: PropsWithChildren) {
  return children;
}
