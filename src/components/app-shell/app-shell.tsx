'use client';

import {
  ChevronDownIcon,
  MenuIcon,
  MoonIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  SunIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  type PropsWithChildren,
  type SVGProps,
  useCallback,
  useState,
  useSyncExternalStore,
} from 'react';

import chaosLogo from '../../../public/chaos.png';
import { cn } from '../../lib/utils';
import { menu } from '../../utils/menu';
import { storageStringifyParseValue } from '../../utils/storage/menu';
import { Footer } from '../footer';
import { useTheme } from '../theme';
import { ToolSearch } from '../tool-search';
import { Button } from '../ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';
import { Sheet, SheetContent, SheetTitle } from '../ui/sheet';
import { Toaster } from '../ui/sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

import s from './index.module.scss';

const desktopMediaQuery = '(min-width: 900px)';
const collapsedStorage = storageStringifyParseValue('collapsed');
const collapsedListeners = new Set<() => void>();
let collapsedMemory = false;

function normalizePath(path: string) {
  return path === '/' ? path : path.replace(/\/+$/u, '');
}

function GitHubIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" {...props}>
      <path
        d="M12 .297a12 12 0 0 0-3.795 23.385c.6.113.82-.258.82-.577l-.015-2.04c-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.084-.729.084-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.435.372.81 1.102.81 2.222l-.015 3.286c0 .315.21.69.825.57A12 12 0 0 0 12 .297Z"
        fill="currentColor"
      />
    </svg>
  );
}

function subscribeToDesktopChange(callback: () => void) {
  const mediaQuery = window.matchMedia(desktopMediaQuery);
  mediaQuery.addEventListener('change', callback);

  return () => mediaQuery.removeEventListener('change', callback);
}

function getDesktopSnapshot() {
  return window.matchMedia(desktopMediaQuery).matches;
}

function getServerDesktopSnapshot() {
  return true;
}

function subscribeToCollapsedChange(callback: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === collapsedStorage.getStorageKey()) {
      callback();
    }
  };

  collapsedListeners.add(callback);
  window.addEventListener('storage', handleStorage);

  return () => {
    collapsedListeners.delete(callback);
    window.removeEventListener('storage', handleStorage);
  };
}

function getCollapsedSnapshot() {
  const stored = collapsedStorage.getItem();

  if (stored !== null) {
    collapsedMemory = stored;
  }

  return collapsedMemory;
}

function getServerCollapsedSnapshot() {
  return false;
}

function setSidebarCollapsed(value: boolean) {
  collapsedMemory = value;
  collapsedStorage.setItem(value);
  collapsedListeners.forEach((listener) => listener());
}

interface NavigationMenuProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

function NavigationMenu({
  collapsed = false,
  onNavigate,
}: NavigationMenuProps) {
  const pathname = usePathname();
  const currentPath = normalizePath(pathname);

  return (
    <nav
      aria-label="工具导航"
      className={cn(s.menu, collapsed && s.menuCollapsed)}
    >
      {menu.map((item) => {
        const Icon = item.icon;
        const itemActive =
          (item.path && normalizePath(item.path) === currentPath) ||
          item.children?.some(
            (child) => child.path && normalizePath(child.path) === currentPath,
          );

        if (item.path) {
          const link = (
            <Link
              aria-current={itemActive ? 'page' : undefined}
              className={cn(
                s.navigationItem,
                itemActive && s.navigationItemActive,
              )}
              href={item.path}
              onClick={onNavigate}
            >
              {Icon ? <Icon aria-hidden="true" /> : null}
              <span className={cn(collapsed && s.visuallyHidden)}>
                {item.label}
              </span>
            </Link>
          );

          return collapsed ? (
            <Tooltip key={item.key}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ) : (
            <div key={item.key}>{link}</div>
          );
        }

        if (collapsed) {
          const target = item.children?.[0];

          if (!target?.path) {
            return null;
          }

          return (
            <Tooltip key={item.key}>
              <TooltipTrigger asChild>
                <Link
                  aria-current={itemActive ? 'page' : undefined}
                  className={cn(
                    s.navigationItem,
                    itemActive && s.navigationItemActive,
                  )}
                  href={target.path}
                  onClick={onNavigate}
                  prefetch={false}
                >
                  {Icon ? <Icon aria-hidden="true" /> : null}
                  <span className={s.visuallyHidden}>{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        }

        return (
          <Collapsible defaultOpen key={item.key}>
            <CollapsibleTrigger
              className={cn(
                s.navigationGroup,
                itemActive && s.navigationGroupActive,
              )}
            >
              {Icon ? <Icon aria-hidden="true" /> : null}
              <span>{item.label}</span>
              <ChevronDownIcon aria-hidden="true" className={s.groupChevron} />
            </CollapsibleTrigger>
            <CollapsibleContent className={s.navigationChildren}>
              {item.children?.map((child) => (
                <Link
                  aria-current={
                    child.path && normalizePath(child.path) === currentPath
                      ? 'page'
                      : undefined
                  }
                  className={cn(
                    s.navigationChild,
                    child.path &&
                      normalizePath(child.path) === currentPath &&
                      s.navigationChildActive,
                  )}
                  href={child.path ?? '/'}
                  key={child.key}
                  onClick={onNavigate}
                  prefetch={false}
                >
                  {child.label}
                </Link>
              ))}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </nav>
  );
}

function ShellContent({ children }: PropsWithChildren) {
  const isDesktop = useSyncExternalStore(
    subscribeToDesktopChange,
    getDesktopSnapshot,
    getServerDesktopSnapshot,
  );
  const collapsed = useSyncExternalStore(
    subscribeToCollapsedChange,
    getCollapsedSnapshot,
    getServerCollapsedSnapshot,
  );
  const { theme, toggleTheme } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <div className={s.app}>
      <header className={s.header}>
        <div className={s.headerStart}>
          {!isDesktop ? (
            <Button
              aria-label="打开导航"
              className={s.navigationButton}
              onClick={() => setDrawerOpen(true)}
              size="icon"
              variant="ghost"
            >
              <MenuIcon />
            </Button>
          ) : null}
          <Link aria-label="返回 Omnibox 首页" className={s.brand} href="/">
            <span className={s.logoFrame}>
              <Image
                alt=""
                className={s.logo}
                height={32}
                priority
                src={chaosLogo}
                width={32}
              />
            </span>
            <span className={s.wordmark}>OMNIBOX</span>
          </Link>
          <ToolSearch />
        </div>
        <div className={s.headerActions}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label={
                  theme === 'dark' ? '切换到浅色主题' : '切换到暗色主题'
                }
                onClick={toggleTheme}
                size="icon"
                variant="ghost"
              >
                {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {theme === 'dark' ? '切换到浅色主题' : '切换到暗色主题'}
            </TooltipContent>
          </Tooltip>
          <Button asChild variant="ghost">
            <a
              href="https://github.com/chaos-design/omnibox"
              rel="noreferrer"
              target="_blank"
            >
              <GitHubIcon data-icon="inline-start" />
              <span className={s.githubLabel}>GitHub</span>
            </a>
          </Button>
        </div>
      </header>

      <div className={s.workspace}>
        {isDesktop ? (
          <aside className={cn(s.sider, collapsed && s.siderCollapsed)}>
            <NavigationMenu collapsed={collapsed} />
            <div className={s.siderFooter}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label={collapsed ? '展开导航' : '收起导航'}
                    className={cn(
                      s.collapseButton,
                      collapsed && s.collapseButtonCollapsed,
                    )}
                    onClick={() => setSidebarCollapsed(!collapsed)}
                    variant="ghost"
                  >
                    {collapsed ? (
                      <PanelLeftOpenIcon data-icon="inline-start" />
                    ) : (
                      <PanelLeftCloseIcon data-icon="inline-start" />
                    )}
                    <span className={cn(collapsed && s.visuallyHidden)}>
                      {collapsed ? '展开导航' : '收起导航'}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {collapsed ? '展开导航' : '收起导航'}
                </TooltipContent>
              </Tooltip>
            </div>
          </aside>
        ) : null}

        <div className={s.main}>
          <div className={s.content}>{children}</div>
          <footer className={s.footer}>
            <Footer />
          </footer>
        </div>
      </div>

      <Sheet onOpenChange={setDrawerOpen} open={!isDesktop && drawerOpen}>
        <SheetContent className={s.drawer} side="left">
          <SheetTitle className={s.visuallyHidden}>工具导航</SheetTitle>
          <NavigationMenu onNavigate={closeDrawer} />
        </SheetContent>
      </Sheet>
      <Toaster closeButton position="top-right" theme={theme} />
    </div>
  );
}

export function AppShell({ children }: PropsWithChildren) {
  return <ShellContent>{children}</ShellContent>;
}
