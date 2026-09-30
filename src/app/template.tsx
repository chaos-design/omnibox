import type { PropsWithChildren } from 'react';

import { AppShell } from '../components/app-shell';

export default function Template({ children }: PropsWithChildren) {
  return <AppShell>{children}</AppShell>;
}
