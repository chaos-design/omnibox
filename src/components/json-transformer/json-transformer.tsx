'use client';

import {
  CircleAlertIcon,
  ClipboardIcon,
  FileTextIcon,
  PaintbrushIcon,
  SettingsIcon,
  WandSparklesIcon,
  XIcon,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { storageStringifyParseValue } from '../../utils/storage/json';
import { copyToClipboard } from '../../utils/tools/copy';
import {
  compileJSON,
  formatJSON,
  json2Schema,
  parseJSON,
} from '../../utils/tools/json';
import { Loading } from '../loading';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Field, FieldGroup, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { Spinner } from '../ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

import s from './index.module.scss';

const Editor = dynamic(
  () => import('../editor/editor').then((module) => module.Editor),
  {
    loading: () => (
      <div className={s.loading}>
        <Loading hint="正在加载编辑器" />
      </div>
    ),
    ssr: false,
  },
);

const demoText = `{
  "name": "Omnibox",
  "version": 1,
  "features": [
    {
      "name": "JSON",
      "enabled": true
    }
  ]
}`;

type TransformMode = 'schema' | 'typescript';

interface JsonTransformerProps {
  mode: TransformMode;
}

const modeConfig = {
  schema: {
    defaultName: 'OmniboxSchema',
    nameLabel: 'Schema 名称',
    outputLanguage: 'json',
    outputTitle: 'JSON Schema',
    pageLabel: 'JSON 转 Schema',
  },
  typescript: {
    defaultName: 'RootInterface',
    nameLabel: '根类型名称',
    outputLanguage: 'typescript',
    outputTitle: 'TypeScript',
    pageLabel: 'JSON 转 TypeScript',
  },
} as const;

async function transformSource(
  mode: TransformMode,
  source: string,
  name: string,
): Promise<string> {
  const value = parseJSON(source);

  if (mode === 'schema') {
    const schema = await json2Schema(value as Record<string, unknown>, name);
    return JSON.stringify(schema, null, 2);
  }

  return compileJSON(value, { name });
}

export function JsonTransformer({ mode }: JsonTransformerProps) {
  const config = modeConfig[mode];
  const sourceCache = useMemo(
    () => storageStringifyParseValue(`${mode}-source-v2`),
    [mode],
  );
  const requestId = useRef(0);
  const persistTimer = useRef<number | null>(null);
  const [source, setSource] = useState(demoText);
  const [output, setOutput] = useState('');
  const [name, setName] = useState<string>(config.defaultName);
  const [draftName, setDraftName] = useState<string>(config.defaultName);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const runTransform = useCallback(
    async (notify = false) => {
      const currentRequest = requestId.current + 1;
      requestId.current = currentRequest;
      setLoading(true);

      try {
        const result = await transformSource(mode, source, name);

        if (requestId.current !== currentRequest) {
          return;
        }

        setOutput(result);
        setError(null);

        if (notify) {
          toast.success('转换完成');
        }
      } catch (transformError) {
        if (requestId.current !== currentRequest) {
          return;
        }

        const reason =
          transformError instanceof Error
            ? transformError.message
            : String(transformError);
        setError(reason);

        if (notify) {
          toast.error(`转换失败：${reason}`);
        }
      } finally {
        if (requestId.current === currentRequest) {
          setLoading(false);
        }
      }
    },
    [mode, name, source],
  );

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      const cachedSource = sourceCache.getItem();

      if (cachedSource) {
        setSource(cachedSource);
      }
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [sourceCache]);

  useEffect(() => {
    const transformTimer = window.setTimeout(() => {
      void runTransform();
    }, 450);

    return () => {
      window.clearTimeout(transformTimer);
      requestId.current += 1;
    };
  }, [runTransform]);

  useEffect(
    () => () => {
      if (persistTimer.current !== null) {
        window.clearTimeout(persistTimer.current);
      }
    },
    [],
  );

  const updateSource = useCallback(
    (value: string) => {
      setSource(value);

      if (persistTimer.current !== null) {
        window.clearTimeout(persistTimer.current);
      }

      persistTimer.current = window.setTimeout(() => {
        sourceCache.setItem(value);
      }, 300);
    },
    [sourceCache],
  );

  const handleFormat = useCallback(() => {
    try {
      updateSource(formatJSON(source));
      toast.success('格式化完成');
    } catch (formatError) {
      const reason =
        formatError instanceof Error
          ? formatError.message
          : String(formatError);
      toast.error(`格式化失败：${reason}`);
    }
  }, [source, updateSource]);

  const handleCopy = useCallback(async () => {
    try {
      await copyToClipboard(output);
      toast.success('已复制到剪贴板');
    } catch (copyError) {
      const reason =
        copyError instanceof Error ? copyError.message : String(copyError);
      toast.error(`复制失败：${reason}`);
    }
  }, [output]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) {
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        void runTransform(true);
      }

      if (event.shiftKey && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        void handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCopy, runTransform]);

  const saveSettings = () => {
    const nextName = draftName.trim();

    if (!nextName) {
      toast.error(`请输入${config.nameLabel}`);
      return;
    }

    setName(nextName);
    setSettingsOpen(false);
  };

  return (
    <main aria-label={config.pageLabel} className={s.page}>
      <div aria-label={`${config.pageLabel}操作`} className={s.actions}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="格式化输入"
              onClick={handleFormat}
              size="icon"
              variant="outline"
            >
              <PaintbrushIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>格式化输入</TooltipContent>
        </Tooltip>
        <Button onClick={() => updateSource(demoText)} variant="outline">
          <FileTextIcon data-icon="inline-start" />
          示例
        </Button>
        <Button
          onClick={() => {
            setDraftName(name);
            setSettingsOpen(true);
          }}
          variant="outline"
        >
          <SettingsIcon data-icon="inline-start" />
          设置
        </Button>
        <Button disabled={loading} onClick={() => void runTransform(true)}>
          {loading ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <WandSparklesIcon data-icon="inline-start" />
          )}
          转换
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>输入无法转换</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <AlertAction>
            <Button
              aria-label="关闭错误提示"
              onClick={() => setError(null)}
              size="icon-sm"
              variant="ghost"
            >
              <XIcon />
            </Button>
          </AlertAction>
        </Alert>
      ) : null}

      <section className={s.workspace}>
        <div className={s.panel}>
          <div className={s.panelHeader}>
            <div className={s.panelIdentity}>
              <span className={s.panelTag}>INPUT</span>
              <span className={s.panelMeta}>JSON / Object</span>
            </div>
          </div>
          <div className={s.editor}>
            <Editor
              language="json"
              modelKey="input"
              onChange={updateSource}
              value={source}
            />
          </div>
        </div>

        <div className={s.panel}>
          <div className={s.panelHeader}>
            <div className={s.panelIdentity}>
              <span className={s.panelTag}>OUTPUT</span>
              <span className={s.panelMeta}>{config.outputTitle}</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label="复制输出"
                  disabled={!output}
                  onClick={() => void handleCopy()}
                  size="icon-sm"
                  variant="ghost"
                >
                  <ClipboardIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>复制输出</TooltipContent>
            </Tooltip>
          </div>
          <div className={s.editor}>
            <Editor
              language={config.outputLanguage}
              modelKey="output"
              options={{ readOnly: true }}
              value={output}
            />
            {loading ? (
              <div aria-live="polite" className={s.editorBusy}>
                <Spinner />
                <span>正在转换...</span>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <Dialog onOpenChange={setSettingsOpen} open={settingsOpen}>
        <DialogContent>
          <form
            className={s.settingsForm}
            onSubmit={(event) => {
              event.preventDefault();
              saveSettings();
            }}
          >
            <DialogHeader>
              <DialogTitle>转换设置</DialogTitle>
              <DialogDescription>
                设置生成结果使用的顶层名称。
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={`${mode}-root-name`}>
                  {config.nameLabel}
                </FieldLabel>
                <Input
                  autoFocus
                  id={`${mode}-root-name`}
                  onChange={(event) => setDraftName(event.target.value)}
                  value={draftName}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  取消
                </Button>
              </DialogClose>
              <Button type="submit">应用</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
