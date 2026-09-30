import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: 'JSON Pointer',
};

export default function JsonPointerLayout({ children }: PropsWithChildren) {
  return children;
}
