import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: 'SSE Preview',
};

export default function SsePreviewLayout({ children }: PropsWithChildren) {
  return children;
}
