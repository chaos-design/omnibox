'use client';

import {
  ALargeSmallIcon,
  ArrowDownAZIcon,
  ArrowRightLeftIcon,
  BinaryIcon,
  CheckIcon,
  ClipboardIcon,
  DownloadIcon,
  FileTextIcon,
  LanguagesIcon,
  type LucideIcon,
  Minimize2Icon,
  PlusIcon,
  Share2Icon,
  TextQuoteIcon,
  Trash2Icon,
  Undo2Icon,
  UploadIcon,
  XIcon,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import {
  type ChangeEvent,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';

import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Separator } from '../../../components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { storageStringifyParseValue } from '../../../utils/storage/json';
import { copyToClipboard } from '../../../utils/tools/copy';
import { downloadText } from '../../../utils/tools/download';
import * as json from '../../../utils/tools/json';

import s from './index.module.scss';
import {
  createJsonShareHash,
  decodeJsonShareHash,
  type JsonShareTab,
} from './share';

const Editor = dynamic(
  () =>
    import('../../../components/editor/editor').then((module) => module.Editor),
  {
    loading: () => <div className={s.loading}>正在加载 JSON 编辑器...</div>,
    ssr: false,
  },
);

const demoText = `{
  "name": "Omnibox",
  "github": "https://github.com/chaos-design/omnibox",
  "info": {
    "active": true,
    "description": "保留字符串中的空格"
  }
}`;

type JsonTab = JsonShareTab;

enum Operation {
  Format,
  CompressAndEscape,
  Compress,
  Escape,
  Unescape,
  UnicodeToChinese,
  ChineseToUnicode,
  Punctuation,
  SortKeys,
  Copy,
  Clear,
  Demo,
}

const defaultTabs: JsonTab[] = [
  { key: 'tab-1', label: 'Tab 1', value: demoText },
];

const operations: Array<{
  icon?: LucideIcon;
  label: string;
  operation: Operation;
  primary?: boolean;
}> = [
  {
    icon: CheckIcon,
    label: '格式化',
    operation: Operation.Format,
    primary: true,
  },
  {
    icon: Minimize2Icon,
    label: '压缩',
    operation: Operation.Compress,
  },
  {
    icon: ArrowRightLeftIcon,
    label: '压缩并转义',
    operation: Operation.CompressAndEscape,
  },
  {
    icon: TextQuoteIcon,
    label: '转义',
    operation: Operation.Escape,
  },
  {
    icon: Undo2Icon,
    label: '去除转义',
    operation: Operation.Unescape,
  },
  {
    icon: LanguagesIcon,
    label: 'Unicode 转中文',
    operation: Operation.UnicodeToChinese,
  },
  {
    icon: BinaryIcon,
    label: '中文转 Unicode',
    operation: Operation.ChineseToUnicode,
  },
  {
    icon: ALargeSmallIcon,
    label: '中文标点转英文',
    operation: Operation.Punctuation,
  },
  {
    icon: ArrowDownAZIcon,
    label: '键排序',
    operation: Operation.SortKeys,
  },
  {
    icon: ClipboardIcon,
    label: '复制',
    operation: Operation.Copy,
  },
  {
    icon: Trash2Icon,
    label: '清空',
    operation: Operation.Clear,
  },
  {
    icon: FileTextIcon,
    label: '示例',
    operation: Operation.Demo,
  },
];

// options 必须是模块级常量。@monaco-editor/react 内部是
// `useUpdate(() => editor.updateOptions(options), [options])`，
// 传行内对象会让每次击键都触发一次 updateOptions（重算配置 + 全量重绘）。
const editorOptions = { minimap: { enabled: true } };

function isJsonTabs(value: unknown): value is JsonTab[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof Reflect.get(item, 'key') === 'string' &&
        typeof Reflect.get(item, 'label') === 'string' &&
        typeof Reflect.get(item, 'value') === 'string',
    )
  );
}

export default function JsonWorkbenchPage() {
  const cache = useMemo(
    () => storageStringifyParseValue<JsonTab[]>('tabs-v2'),
    [],
  );
  const tabIndex = useRef(2);
  const tabsRevision = useRef(0);
  const importRequest = useRef(0);
  const persistTimer = useRef<number | null>(null);
  const pendingTabs = useRef<JsonTab[] | null>(null);
  const [tabs, setTabs] = useState(defaultTabs);
  const [activeKey, setActiveKey] = useState(defaultTabs[0].key);

  const persistTabs = useCallback(
    (nextTabs: JsonTab[]) => {
      const error = cache.setItem(nextTabs);

      if (error) {
        toast.error(`标签页保存失败：${error.message}`);
      }
    },
    [cache],
  );

  const commitTabs = useCallback(
    (nextTabs: JsonTab[]) => {
      if (persistTimer.current !== null) {
        window.clearTimeout(persistTimer.current);
        persistTimer.current = null;
      }

      pendingTabs.current = null;
      tabsRevision.current += 1;
      setTabs(nextTabs);
      persistTabs(nextTabs);
    },
    [persistTabs],
  );

  const schedulePersist = useCallback(
    (nextTabs: JsonTab[]) => {
      if (persistTimer.current !== null) {
        window.clearTimeout(persistTimer.current);
      }

      pendingTabs.current = nextTabs;
      persistTimer.current = window.setTimeout(() => {
        persistTimer.current = null;
        const pending = pendingTabs.current;
        pendingTabs.current = null;

        if (pending) {
          persistTabs(pending);
        }
      }, 300);
    },
    [persistTabs],
  );

  useEffect(() => {
    let restoreRequest = 0;
    let disposed = false;

    const restoreState = async () => {
      const currentRequest = restoreRequest + 1;
      restoreRequest = currentRequest;
      let sharedTabs: JsonTab[] | null = null;
      let sharedActiveKey: string | null = null;

      try {
        const sharedState = await decodeJsonShareHash(
          window.location.hash,
          window.localStorage,
        );

        if (disposed || currentRequest !== restoreRequest) {
          return;
        }

        if (sharedState) {
          sharedTabs = sharedState.tabs;
          sharedActiveKey = sharedState.activeKey;
          persistTabs(sharedState.tabs);
        }
      } catch (error) {
        if (disposed || currentRequest !== restoreRequest) {
          return;
        }

        const reason = error instanceof Error ? error.message : String(error);
        toast.error(reason);
      }

      const nextTabs = sharedTabs ?? cache.getItem();

      if (isJsonTabs(nextTabs)) {
        tabsRevision.current += 1;
        setTabs(nextTabs);
        setActiveKey(sharedActiveKey ?? nextTabs[0].key);
        tabIndex.current = nextTabs.length + 1;
      }
    };

    const handleHashChange = () => void restoreState();
    const timer = window.setTimeout(handleHashChange, 0);
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      disposed = true;
      restoreRequest += 1;
      importRequest.current += 1;
      window.clearTimeout(timer);
      window.removeEventListener('hashchange', handleHashChange);

      if (persistTimer.current !== null) {
        window.clearTimeout(persistTimer.current);
        persistTimer.current = null;
      }

      if (pendingTabs.current) {
        cache.setItem(pendingTabs.current);
        pendingTabs.current = null;
      }
    };
  }, [cache, persistTabs]);

  const activeTab = tabs.find((tab) => tab.key === activeKey) ?? tabs[0];

  // activeValue 是编辑器内容的唯一真实来源（ref），React state 只做降频镜像。
  // 所有读当前内容的操作（格式化/压缩/分享/导出/复制）一律读 ref，
  // 保证不会读到被 rAF 节流掉的中间态。
  const latestValue = useRef(activeTab.value);
  const activeValueRef = useRef(activeTab.value);
  const frameRef = useRef<number | null>(null);

  const updateActiveValue = useCallback(
    (value: string) => {
      latestValue.current = value;
      activeValueRef.current = value;

      const nextTabs = tabs.map((tab) =>
        tab.key === activeTab.key ? { ...tab, value } : tab,
      );

      tabsRevision.current += 1;
      setTabs(nextTabs);
      schedulePersist(nextTabs);
    },
    [activeTab.key, schedulePersist, tabs],
  );

  // 把被 rAF 节流、尚未落到 React state 的输入立即提交。
  // 切换/新增标签页与组件卸载前必须调用，否则会丢掉最后一帧的击键。
  const settlePendingValue = useCallback(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (latestValue.current !== activeValueRef.current) {
      updateActiveValue(latestValue.current);
    }
  }, [updateActiveValue]);

  // 卸载时结算。用 ref 持有最新的实现，避免因 tabs 变化而反复重挂 effect。
  const settleRef = useRef(settlePendingValue);
  settleRef.current = settlePendingValue;

  useEffect(
    () => () => {
      settleRef.current();
    },
    [],
  );

  // 切换标签页：先结算旧标签，再把 ref 指向新标签的内容。
  // 依赖只放 activeTab.key —— 若把 activeTab.value 也列进依赖，
  // 每次提交都会重置 ref，从而吞掉「提交与下一次击键之间」的输入。
  const tabValueRef = useRef(activeTab.value);
  tabValueRef.current = activeTab.value;

  useEffect(() => {
    latestValue.current = tabValueRef.current;
    activeValueRef.current = tabValueRef.current;
  }, [activeTab.key]);

  // 编辑器是 onChange 高频回调（每次击键触发）。如果直接把 onChange
  // 透传给 Editor，@monaco-editor/react 会因引用变化在每次击键时
  // dispose + 重新订阅 onDidChangeModelContent。用 ref 转接后
  // 传给编辑器的函数引用恒定，同时把 React 状态更新降频到一帧一次。
  const handleEditorChange = useCallback(
    (value: string) => {
      latestValue.current = value;

      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        const latest = latestValue.current;

        if (latest !== activeValueRef.current) {
          activeValueRef.current = latest;
          updateActiveValue(latest);
        }
      });
    },
    [updateActiveValue],
  );

  const handleOperation = useCallback(
    async (operation: Operation) => {
      const value = latestValue.current;

      try {
        switch (operation) {
          case Operation.Format:
            updateActiveValue(json.formatJSON(value));
            break;
          case Operation.CompressAndEscape:
            updateActiveValue(json.compressAndEscapeJSON(value));
            break;
          case Operation.Compress:
            updateActiveValue(json.compressJSON(value));
            break;
          case Operation.Escape:
            updateActiveValue(json.escapeJSON(value));
            break;
          case Operation.Unescape:
            updateActiveValue(json.unescapeJSON(value));
            break;
          case Operation.UnicodeToChinese:
            updateActiveValue(json.unicodeToChinese(value));
            break;
          case Operation.ChineseToUnicode:
            updateActiveValue(json.chineseToUnicode(value));
            break;
          case Operation.Punctuation:
            updateActiveValue(json.chinesePunctuationToEnglish(value));
            break;
          case Operation.SortKeys:
            updateActiveValue(json.sortJSONKeys(value));
            break;
          case Operation.Copy:
            await copyToClipboard(value);
            toast.success('已复制到剪贴板');
            return;
          case Operation.Clear:
            updateActiveValue('');
            return;
          case Operation.Demo:
            updateActiveValue(demoText);
            return;
        }

        toast.success('处理完成');
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        toast.error(`处理失败：${reason}`);
      }
    },
    [updateActiveValue],
  );

  const handleImport = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.currentTarget;
      const file = input.files?.[0];
      input.value = '';

      if (!file) {
        return;
      }

      const request = importRequest.current + 1;
      const revision = tabsRevision.current;
      importRequest.current = request;

      try {
        const value = json.formatJSON(await file.text());

        if (
          request !== importRequest.current ||
          revision !== tabsRevision.current
        ) {
          toast.info('标签页已变化，已忽略过期的导入结果。');
          return;
        }

        updateActiveValue(value);
        toast.success(`已导入 ${file.name}`);
      } catch (error) {
        if (
          request !== importRequest.current ||
          revision !== tabsRevision.current
        ) {
          return;
        }

        const reason = error instanceof Error ? error.message : String(error);
        toast.error(`导入失败：${reason}`);
      }
    },
    [updateActiveValue],
  );

  const handleExport = useCallback(() => {
    try {
      const content = json.formatJSON(latestValue.current);
      const fileName = `${activeTab.label.replace(/[^\w-]+/gu, '-').toLowerCase() || 'omnibox'}.json`;
      downloadText(content, fileName);
      toast.success('JSON 下载已开始');
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      toast.error(`导出失败：${reason}`);
    }
  }, [activeTab.label]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) {
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        void handleOperation(Operation.Format);
      }

      if (event.shiftKey && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        void handleOperation(Operation.Copy);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleOperation]);

  // 切换标签页前先结算未落地的输入，否则最后一帧的击键会跟着旧标签一起留在 ref 里。
  const switchTab = useCallback(
    (nextKey: string) => {
      if (nextKey !== activeKey) {
        settlePendingValue();
      }

      setActiveKey(nextKey);
    },
    [activeKey, settlePendingValue],
  );

  const addTab = useCallback(() => {
    const index = tabIndex.current;
    tabIndex.current += 1;
    const key = `tab-${Date.now().toString(36)}-${index}`;
    const nextTabs = [...tabs, { key, label: `Tab ${index}`, value: demoText }];

    settlePendingValue();
    commitTabs(nextTabs);
    setActiveKey(key);
  }, [commitTabs, settlePendingValue, tabs]);

  const removeTab = useCallback(
    (targetKey: string) => {
      if (tabs.length === 1) {
        toast.info('至少保留一个标签页。');
        return;
      }

      const targetIndex = tabs.findIndex((tab) => tab.key === targetKey);

      if (targetIndex === -1) {
        return;
      }

      const nextTabs = tabs.filter((tab) => tab.key !== targetKey);
      commitTabs(nextTabs);

      if (activeKey === targetKey) {
        const nextIndex = Math.max(0, targetIndex - 1);
        switchTab(nextTabs[nextIndex].key);
      }
    },
    [activeKey, commitTabs, switchTab, tabs],
  );

  const handleShare = useCallback(async () => {
    try {
      // 直接用 ref 里的最新值拼 tabs：settlePendingValue 走的是 setState，
      // 同一 tick 内 this closure 里的 tabs 仍是旧值。
      const shareTabs = tabs.map((tab) =>
        tab.key === activeKey ? { ...tab, value: latestValue.current } : tab,
      );
      const hash = await createJsonShareHash({
        activeKey,
        tabs: shareTabs,
        version: 1,
      });
      const url = new URL(window.location.href);
      url.hash = hash;
      window.history.replaceState(null, '', url);
      await copyToClipboard(url.toString());
      toast.success('分享链接已复制');
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      toast.error(`生成分享链接失败：${reason}`);
    }
  }, [activeKey, tabs]);

  return (
    <main className={s.page}>
      <div className={s.tabsBar}>
        <Tabs className={s.tabs} onValueChange={switchTab} value={activeKey}>
          <TabsList className={s.tabsList} variant="line">
            {tabs.map((tab) => (
              <Fragment key={tab.key}>
                <TabsTrigger className={s.tabTrigger} value={tab.key}>
                  {tab.label}
                </TabsTrigger>
                {tabs.length > 1 ? (
                  <Button
                    aria-label={`关闭 ${tab.label}`}
                    className={s.tabClose}
                    onClick={() => removeTab(tab.key)}
                    size="icon-xs"
                    variant="ghost"
                  >
                    <XIcon />
                  </Button>
                ) : null}
              </Fragment>
            ))}
          </TabsList>
        </Tabs>
        <Button
          aria-label="新增标签页"
          className={s.addTab}
          onClick={addTab}
          size="icon-sm"
          variant="ghost"
        >
          <PlusIcon />
        </Button>
      </div>

      <section aria-label="JSON 编辑器" className={s.workspace}>
        <aside aria-label="JSON 操作区" className={s.actions}>
          {operations.map((item, index) => {
            const Icon = item.icon;

            return (
              <Fragment key={item.operation}>
                {index === 3 || index === 9 ? (
                  <Separator className={s.divider} />
                ) : null}
                <Button
                  onClick={() => void handleOperation(item.operation)}
                  variant={item.primary ? 'default' : 'outline'}
                >
                  {Icon ? <Icon data-icon="inline-start" /> : null}
                  {item.label}
                </Button>
              </Fragment>
            );
          })}
          <Separator className={s.divider} />
          <Button onClick={() => void handleShare()} variant="outline">
            <Share2Icon data-icon="inline-start" />
            分享
          </Button>
          <Input
            accept=".json,application/json"
            aria-label="导入 JSON 文件"
            className={s.fileInput}
            id="json-file-input"
            onChange={(event) => void handleImport(event)}
            type="file"
          />
          <Button asChild variant="outline">
            <label htmlFor="json-file-input">
              <UploadIcon data-icon="inline-start" />
              导入
            </label>
          </Button>
          <Button onClick={handleExport} variant="outline">
            <DownloadIcon data-icon="inline-start" />
            导出
          </Button>
        </aside>
        <div className={s.panel}>
          <div className={s.editor}>
            <Editor
              language="json"
              onChange={handleEditorChange}
              options={editorOptions}
              value={activeTab.value}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
