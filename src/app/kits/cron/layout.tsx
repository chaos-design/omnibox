import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: 'Cron',
};

export default function CronLayout({ children }: PropsWithChildren) {
  return children;
}
