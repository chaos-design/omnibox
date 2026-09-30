'use client';

import { ChevronsUpDownIcon } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { cn } from '../../lib/utils';
import { language as languages } from '../../utils/language';
import { Button } from '../ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

import s from './index.module.scss';

export interface ToolbarProps {
  children?: ReactNode;
  className?: string;
  language: string;
  onLanguageChange: (language: string) => void;
}

export function Toolbar({
  children,
  className,
  language,
  onLanguageChange,
}: ToolbarProps) {
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);

  return (
    <div className={cn(s.toolbar, className)}>
      <Popover onOpenChange={setLanguagePickerOpen} open={languagePickerOpen}>
        <PopoverTrigger asChild>
          <Button
            aria-expanded={languagePickerOpen}
            aria-label="选择代码语言"
            className={s.languageSelect}
            role="combobox"
            variant="outline"
          >
            <span className={s.languageValue}>{language.toUpperCase()}</span>
            <ChevronsUpDownIcon data-icon="inline-end" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className={s.languagePopover}>
          <Command defaultValue={language}>
            <CommandInput placeholder="搜索语言..." />
            <CommandList>
              <CommandEmpty>未找到匹配语言</CommandEmpty>
              <CommandGroup>
                {languages.map((item) => (
                  <CommandItem
                    data-checked={item === language}
                    key={item}
                    onSelect={() => {
                      onLanguageChange(item);
                      setLanguagePickerOpen(false);
                    }}
                    value={item}
                  >
                    {item.toUpperCase()}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {children ? <div className={s.actions}>{children}</div> : null}
    </div>
  );
}
