'use client';

import { CornerDownLeftIcon, SearchIcon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { toolCatalog, toolGroups } from '../../utils/tool-catalog';
import { Button } from '../ui/button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '../ui/command';

import s from './index.module.scss';

interface SearchShortcutEvent {
  altKey: boolean;
  ctrlKey: boolean;
  key: string;
  metaKey: boolean;
  repeat: boolean;
}

export function isToolSearchShortcut(event: SearchShortcutEvent): boolean {
  return (
    !event.repeat &&
    !event.altKey &&
    (event.metaKey || event.ctrlKey) &&
    event.key.toLowerCase() === 'k'
  );
}

const groupedTools = toolGroups
  .map((group) => ({
    ...group,
    tools: toolCatalog.filter((tool) => tool.group === group.key),
  }))
  .filter((group) => group.tools.length > 0);

function normalizePath(path: string): string {
  return path === '/' ? path : path.replace(/\/+$/u, '');
}

export function ToolSearch() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isToolSearchShortcut(event)) {
        return;
      }

      event.preventDefault();
      if (open) {
        setQuery('');
      }
      setOpen(!open);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setQuery('');
    }
    setOpen(nextOpen);
  };

  const navigateToTool = (href: string) => {
    setQuery('');
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <Button
        aria-label="搜索工具，快捷键 Command K"
        className={s.trigger}
        onClick={() => setOpen(true)}
        variant="outline"
      >
        <SearchIcon data-icon="inline-start" />
        <span className={s.triggerLabel}>搜索工具</span>
        <kbd className={s.triggerShortcut}>⌘K</kbd>
      </Button>

      <CommandDialog
        className={s.dialog}
        description="搜索并打开 Omnibox 中的工具"
        onOpenChange={handleOpenChange}
        open={open}
        overlayClassName={s.overlay}
        title="全局工具搜索"
      >
        <Command className={s.command}>
          <CommandInput
            onValueChange={setQuery}
            placeholder="搜索工具、功能或路径..."
            value={query}
          />
          <CommandList className={s.list}>
            <CommandEmpty>没有找到匹配的工具</CommandEmpty>
            {groupedTools.map((group) => (
              <CommandGroup heading={group.label} key={group.key}>
                {group.tools.map((tool) => {
                  const Icon = tool.icon;
                  const active =
                    normalizePath(pathname) === normalizePath(tool.href);
                  const searchValue = [
                    tool.title,
                    tool.description,
                    tool.href,
                    group.label,
                    ...tool.keywords,
                  ].join(' ');

                  return (
                    <CommandItem
                      key={tool.href}
                      onSelect={() => navigateToTool(tool.href)}
                      value={searchValue}
                    >
                      <span className={s.itemIcon}>
                        <Icon aria-hidden="true" />
                      </span>
                      <span className={s.itemCopy}>
                        <strong>{tool.title}</strong>
                        <span>{tool.description}</span>
                      </span>
                      <CommandShortcut>
                        {active ? '当前' : tool.href}
                      </CommandShortcut>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
          <div aria-hidden="true" className={s.footer}>
            <span>
              <kbd>↑↓</kbd>
              选择
            </span>
            <span>
              <kbd>
                <CornerDownLeftIcon />
              </kbd>
              打开
            </span>
            <span>
              <kbd>Esc</kbd>
              关闭
            </span>
          </div>
        </Command>
      </CommandDialog>
    </>
  );
}
