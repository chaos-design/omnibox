import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: 'Unicode',
};

export default function UnicodeLayout({ children }: PropsWithChildren) {
  return children;
}
