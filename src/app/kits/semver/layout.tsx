import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: 'SemVer',
};

export default function SemverLayout({ children }: PropsWithChildren) {
  return children;
}
