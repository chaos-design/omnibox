import type { Metadata, Viewport } from 'next';
import type { PropsWithChildren } from 'react';

import { ThemeProvider } from '../components/theme';
import { TooltipProvider } from '../components/ui/tooltip';
import { defaultTheme, themeColors, themeInitScript } from '../utils/theme';

import './globals.css';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/').at(-1);
const basePath =
  process.env.GITHUB_ACTIONS === 'true' && repositoryName
    ? `/${repositoryName}`
    : '';

export const metadata: Metadata = {
  description: '面向开发者的代码、JSON 与日常效率工具箱。',
  icons: {
    icon: `${basePath}/favicon.ico`,
  },
  title: {
    default: 'Omnibox',
    template: '%s | Omnibox',
  },
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: themeColors[defaultTheme],
};

const RootLayout = ({ children }: Readonly<PropsWithChildren>) => (
  <html
    className="dark"
    data-theme={defaultTheme}
    lang="zh-CN"
    suppressHydrationWarning
  >
    <head>
      <script
        dangerouslySetInnerHTML={{ __html: themeInitScript }}
        id="theme-init"
      />
    </head>
    <body>
      <ThemeProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </ThemeProvider>
    </body>
  </html>
);

export default RootLayout;
