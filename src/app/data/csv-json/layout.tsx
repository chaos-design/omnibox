import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: 'CSV / JSON',
};

export default function CsvJsonLayout({ children }: PropsWithChildren) {
  return children;
}
