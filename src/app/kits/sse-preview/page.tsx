'use client';

import type { Monaco } from '@monaco-editor/react';
import {
  BracesIcon,
  CheckIcon,
  ClipboardIcon,
  Code2Icon,
  ExpandIcon,
  FileWarningIcon,
  Maximize2Icon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  TerminalIcon,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { EditorInstance } from '../../../components/editor';
import {
  ToolGrid,
  ToolPanel,
  ToolWorkbench,
} from '../../../components/tool-workbench';
import { Button } from '../../../components/ui/button';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '../../../components/ui/sheet';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../components/ui/tabs';
import { copyToClipboard } from '../../../utils/tools/copy';
import {
  buildSseClientCode,
  parseSseStream,
  type SseFrame,
  ssePresets,
} from '../../../utils/tools/sse';

import s from './index.module.scss';
import { isPayloadOverflowing, payloadLanguage } from './payload-view';
import { registerSseLanguage, SSE_LANGUAGE_ID } from './sse-language';

const Editor = dynamic(
  () => import('../../../components/editor').then((module) => module.Editor),
  {
    loading: () => <div className={s.editorLoading}>正在加载编辑器...</div>,
    ssr: false,
  },
);

type CodeType = keyof ReturnType<typeof buildSseClientCode>;
type ViewType = 'events' | 'diagnostics';

/** 取自 monaco 的 IModelDeltaDecoration，避免直接依赖未声明的传递依赖。 */
type LineDecoration = Parameters<EditorInstance['deltaDecorations']>[1][number];

const defaultUrl = 'https://api.example.com/stream';

/** 每个事件的播放时长，播放时才生效，与事件流内容无关。 */
const EVENT_INTERVALS = [
  { label: '200 ms', value: 200 },
  { label: '500 ms', value: 500 },
  { label: '1000 ms', value: 1000 },
  { label: '2000 ms', value: 2000 },
] as const;

type EventInterval = (typeof EVENT_INTERVALS)[number]['value'];

const codeLabels: Record<CodeType, string> = {
  curl: 'cURL',
  eventSource: 'EventSource',
  fetch: 'Fetch 流式',
};

/**
 * 事件 data 展示块：超出最大高度时内部滚动，
 * 并提供放大按钮在右侧抽屉中查看完整内容。
 */
function PayloadBlock({
  frame,
  partial,
}: {
  frame: SseFrame;
  partial: boolean;
}) {
  const [zoomed, setZoomed] = useState(false);
  const boxRef = useRef<HTMLPreElement>(null);
  const [scrollable, setScrollable] = useState(false);

  const text = partial ? frame.data : frame.payload.text;

  useEffect(() => {
    const node = boxRef.current;
    if (!node) {
      return;
    }

    const measure = () => {
      setScrollable(isPayloadOverflowing(node.scrollHeight, node.clientHeight));
    };

    measure();
    // 文本变化可能不改变盒子尺寸，因此同时监听内容与尺寸两条路径。
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [text]);

  return (
    <>
      <div className={s.payloadBox}>
        <pre
          className={s.payload}
          data-json={!partial && frame.payload.isJson}
          data-partial={partial}
          ref={boxRef}
        >
          {text === '' ? '（空 data）' : text}
        </pre>
        {scrollable ? (
          <Button
            aria-label={`在抽屉中查看第 ${frame.index} 帧完整数据`}
            className={s.payloadExpand}
            onClick={() => setZoomed(true)}
            size="icon-xs"
            variant="ghost"
          >
            <Maximize2Icon />
          </Button>
        ) : null}
      </div>

      <Sheet onOpenChange={setZoomed} open={zoomed}>
        <SheetContent className={s.payloadSheet} side="right">
          <SheetHeader>
            <SheetTitle>
              第 {frame.index} 帧 · {frame.type}
            </SheetTitle>
            <SheetDescription>
              {`Last-Event-ID ${frame.lastEventId === '' ? '（空）' : frame.lastEventId} · 第 ${frame.startLine}-${frame.endLine} 行 · ${frame.bytes} B${partial ? ' · 接收中' : ''}`}
            </SheetDescription>
          </SheetHeader>

          <div className={s.fullPayload}>
            <Editor
              language={payloadLanguage(frame, partial)}
              loading={<div className={s.fullPayloadLoading}>正在加载...</div>}
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                readOnly: true,
                renderLineHighlight: 'none',
                scrollBeyondLastLine: false,
                // 换行开启：SSE 的 data 常是超长单行 JSON，
                // 关闭换行会把内容推到横向滚动区里，等于没展示。
                wordWrap: 'on',
              }}
              value={text === '' ? '（空 data）' : text}
            />
          </div>

          <SheetFooter>
            <Button
              disabled={text === ''}
              onClick={() => {
                void copyToClipboard(text)
                  .then(() => toast.success('data 已复制'))
                  .catch((reason: unknown) =>
                    toast.error(
                      reason instanceof Error ? reason.message : String(reason),
                    ),
                  );
              }}
              size="lg"
            >
              <ClipboardIcon data-icon="inline-start" />
              复制 data
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

function FrameCard({
  active,
  frame,
  onSelect,
}: {
  active: boolean;
  frame: SseFrame;
  onSelect: () => void;
}) {
  const state = frame.dispatched
    ? '已派发'
    : frame.streaming
      ? '接收中'
      : frame.silent
        ? '无事件'
        : '未派发';

  return (
    <li
      className={s.frame}
      data-active={active}
      data-silent={frame.silent}
      data-state={frame.dispatched ? 'sent' : frame.streaming ? 'live' : 'idle'}
    >
      <button
        aria-pressed={active}
        className={s.frameButton}
        onClick={onSelect}
        type="button"
      >
        <span className={s.frameIndex}>#{frame.index}</span>
        <span className={s.frameType} data-kind={frame.type}>
          {frame.type}
        </span>
        <span className={s.frameState}>{state}</span>
        <span className={s.frameLines}>
          L{frame.startLine}-{frame.endLine}
        </span>
      </button>

      <div className={s.frameBody}>
        {frame.dispatched ? (
          <PayloadBlock frame={frame} partial={false} />
        ) : frame.data === '' ? (
          <p className={s.frameReason}>{frame.reason}</p>
        ) : (
          <>
            <PayloadBlock frame={frame} partial />
            <p className={s.frameReason}>{frame.reason}</p>
          </>
        )}
      </div>
    </li>
  );
}

export default function SsePreviewPage() {
  const [stream, setStream] = useState(ssePresets[0].value);
  const [url, setUrl] = useState(defaultUrl);
  const [view, setView] = useState<ViewType>('events');
  const [codeType, setCodeType] = useState<CodeType>('eventSource');
  const [codeOpen, setCodeOpen] = useState(false);
  const [activeFrame, setActiveFrame] = useState<number | null>(null);
  const [revealLines, setRevealLines] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [interval, setInterval] = useState<EventInterval>(500);

  const editorRef = useRef<EditorInstance | null>(null);
  const [editorReady, setEditorReady] = useState(false);

  const result = useMemo(
    () =>
      revealLines === null
        ? parseSseStream(stream)
        : parseSseStream(stream, { revealLines }),
    [revealLines, stream],
  );
  const code = useMemo(
    () => buildSseClientCode({ events: result.frames, url }),
    [result.frames, url],
  );

  const beforeMount = useCallback((monaco: Monaco) => {
    registerSseLanguage(monaco);
  }, []);

  const handleMount = useCallback((editor: EditorInstance) => {
    editorRef.current = editor;
    setEditorReady(true);
  }, []);

  // 播放：每次间隔推进一个事件边界，让「空行到达才派发」的过程可见。
  useEffect(() => {
    if (!playing || revealLines === null || revealLines >= result.totalLines) {
      return;
    }

    // 跳到下一个帧边界（含其结尾空行），而不是逐字符推进。
    const boundary = result.frames.find((frame) => frame.endLine > revealLines);
    const next = boundary ? boundary.endLine : revealLines + 1;

    const timer = setTimeout(() => setRevealLines(next), interval);
    return () => clearTimeout(timer);
  }, [interval, playing, result.frames, result.totalLines, revealLines]);

  useEffect(() => {
    if (playing && revealLines !== null && revealLines >= result.totalLines) {
      setPlaying(false);
    }
  }, [playing, revealLines, result.totalLines]);

  // 把帧的派发结果与选中态映射回源码行，形成可点击的双向链路。
  useEffect(() => {
    const editor = editorRef.current;
    const model = editor?.getModel();

    if (!editor || !model) {
      return;
    }

    const lineCount = model.getLineCount();
    const next: LineDecoration[] = [];

    for (const line of result.lines) {
      if (line.index > lineCount) {
        break;
      }

      const frame =
        line.frame === null
          ? undefined
          : result.frames.find((item) => item.index === line.frame);

      if (frame && !frame.dispatched && !frame.silent && !frame.streaming) {
        next.push({
          range: {
            endColumn: 1,
            endLineNumber: line.index,
            startColumn: 1,
            startLineNumber: line.index,
          },
          options: { className: 'sse-line-dropped', isWholeLine: true },
        });
      }

      if (frame && activeFrame === frame.index) {
        next.push({
          range: {
            endColumn: 1,
            endLineNumber: Math.min(line.index, lineCount),
            startColumn: 1,
            startLineNumber: line.index,
          },
          options: { className: 'sse-line-active', isWholeLine: true },
        });
      }
    }

    const ids = editor.deltaDecorations([], next);
    return () => {
      editor.deltaDecorations(ids, []);
    };
  }, [activeFrame, editorReady, result]);

  const selectFrame = (index: number) => {
    setActiveFrame((current) => (current === index ? null : index));

    const frame = result.frames.find((item) => item.index === index);
    editorRef.current?.revealLineInCenter?.(frame?.startLine ?? 1);
  };

  const loadPreset = (value: string) => {
    setStream(value);
    setActiveFrame(null);
    setRevealLines(null);
    setPlaying(false);
  };

  const startPlayback = () => {
    setActiveFrame(null);
    setRevealLines(0);
    setPlaying(true);
  };

  const resetPlayback = () => {
    setPlaying(false);
    setRevealLines(null);
  };

  const copyCode = async () => {
    try {
      await copyToClipboard(code[codeType]);
      toast.success('代码已复制');
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const dropped =
    result.frames.length -
    result.dispatched.length -
    (result.truncated ? 1 : 0);
  const received = revealLines ?? result.totalLines;

  return (
    <ToolWorkbench
      className={s.page}
      description="按 WHATWG 规范解析 SSE 事件流，还原分帧、字段累积与事件派发全过程，并可模拟数据逐块到达的效果"
      title="SSE Preview"
    >
      <ToolGrid>
        <ToolPanel description="事件流原文，可直接编辑" title="SSE 输入">
          <div className={s.presets}>
            {ssePresets.map((preset) => (
              <Button
                key={preset.id}
                onClick={() => loadPreset(preset.value)}
                size="sm"
                variant="outline"
              >
                {preset.label}
              </Button>
            ))}
            <Button onClick={() => loadPreset('')} size="sm" variant="ghost">
              清空
            </Button>
          </div>

          <div className={s.editorWrap}>
            <Editor
              beforeMount={beforeMount}
              language={SSE_LANGUAGE_ID}
              onChange={(value) => {
                setStream(value);
                setActiveFrame(null);
                setRevealLines(null);
                setPlaying(false);
              }}
              onMount={handleMount}
              options={{
                fontSize: 12,
                lineNumbersMinChars: 3,
                renderLineHighlight: 'all',
                scrollBeyondLastLine: false,
                wordWrap: 'off',
              }}
              value={stream}
            />
          </div>

          <p className={s.editorHint}>
            <CheckIcon />
            <span>蓝色为标准字段、灰色为注释、红色为未知字段。</span>
          </p>
        </ToolPanel>

        <ToolPanel
          actions={
            <Button
              onClick={() => setCodeOpen(true)}
              size="sm"
              variant="outline"
            >
              <Code2Icon data-icon="inline-start" />
              客户端代码
            </Button>
          }
          description="浏览器 EventSource 实际收到的结果"
          title="解析结果"
        >
          <div className={s.playback}>
            <div className={s.playbackControls}>
              {playing ? (
                <Button onClick={() => setPlaying(false)} size="sm">
                  <PauseIcon data-icon="inline-start" />
                  暂停
                </Button>
              ) : (
                <Button onClick={startPlayback} size="sm">
                  <PlayIcon data-icon="inline-start" />
                  模拟发送
                </Button>
              )}
              <Button
                disabled={revealLines === null}
                onClick={resetPlayback}
                size="sm"
                variant="ghost"
              >
                <RotateCcwIcon data-icon="inline-start" />
                重置
              </Button>
              <label className={s.interval}>
                <span>事件延时</span>
                <select
                  aria-label="每个事件的播放时间"
                  onChange={(event) =>
                    setInterval(Number(event.target.value) as EventInterval)
                  }
                  value={interval}
                >
                  {EVENT_INTERVALS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <span className={s.progressLabel}>
              {received}/{result.totalLines} 行
            </span>
          </div>

          <p className={s.summary}>
            <span>
              事件 <strong>{result.dispatched.length}</strong>
            </span>
            <span data-tone={dropped > 0 ? 'warn' : undefined}>
              未派发 <strong>{dropped}</strong>
            </span>
            <span>
              注释 <strong>{result.comments}</strong>
            </span>
            <span>
              Last-Event-ID{' '}
              <strong>
                {result.lastEventId === '' ? '（空）' : result.lastEventId}
              </strong>
            </span>
            <span>
              重连{' '}
              <strong>
                {result.reconnectionTime === null
                  ? '默认'
                  : `${result.reconnectionTime}ms`}
              </strong>
            </span>
            <span>
              换行{' '}
              <strong>
                {`${result.terminators.crlf}/${result.terminators.lf}/${result.terminators.cr}`}
              </strong>
            </span>
          </p>

          <Tabs
            className={s.tabs}
            onValueChange={(value) => setView(value as ViewType)}
            value={view}
          >
            <TabsList className={s.tabsList}>
              <TabsTrigger value="events">
                <BracesIcon />
                事件
                <span className={s.tabCount}>{result.dispatched.length}</span>
              </TabsTrigger>
              <TabsTrigger value="diagnostics">
                <FileWarningIcon />
                诊断
                <span className={s.tabCount}>{result.diagnostics.length}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="events">
              {result.frames.length > 0 ? (
                <ol className={s.frames}>
                  {result.frames.map((frame) => (
                    <FrameCard
                      active={activeFrame === frame.index}
                      frame={frame}
                      key={frame.index}
                      onSelect={() => selectFrame(frame.index)}
                    />
                  ))}
                </ol>
              ) : (
                <p className={s.empty}>
                  {result.truncated
                    ? '正在等待第一帧数据...'
                    : '没有解析到任何帧。在左侧粘贴事件流，或点击上方示例。'}
                </p>
              )}
            </TabsContent>

            <TabsContent value="diagnostics">
              {result.diagnostics.length > 0 ? (
                <ul className={s.diagnostics}>
                  {result.diagnostics.map((item) => (
                    <li data-level={item.level} key={item.message}>
                      <FileWarningIcon />
                      <span>
                        {item.line === null ? null : `第 ${item.line} 行 · `}
                        {item.message}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={s.empty}>没有发现协议问题</p>
              )}
            </TabsContent>
          </Tabs>
        </ToolPanel>
      </ToolGrid>

      <Sheet onOpenChange={setCodeOpen} open={codeOpen}>
        <SheetContent className={s.codeSheet} side="right">
          <SheetHeader>
            <SheetTitle>客户端消费代码</SheetTitle>
            <SheetDescription>
              依据解析出的事件类型生成，事件监听器已按实际类型展开。
            </SheetDescription>
          </SheetHeader>

          <div className={s.codeBody}>
            <Field>
              <FieldLabel htmlFor="sse-url">接口地址</FieldLabel>
              <Input
                id="sse-url"
                onChange={(event) => setUrl(event.target.value)}
                placeholder={defaultUrl}
                value={url}
              />
              <FieldDescription>仅用于生成代码，不会被访问。</FieldDescription>
            </Field>

            <Tabs
              className={s.codeTabs}
              onValueChange={(value) => setCodeType(value as CodeType)}
              value={codeType}
            >
              <TabsList>
                {(Object.keys(codeLabels) as CodeType[]).map((type) => (
                  <TabsTrigger key={type} value={type}>
                    {type === 'curl' ? <TerminalIcon /> : null}
                    {codeLabels[type]}
                  </TabsTrigger>
                ))}
              </TabsList>
              {(Object.keys(codeLabels) as CodeType[]).map((type) => (
                <TabsContent key={type} value={type}>
                  <Editor
                    language={type !== 'curl' ? 'javascript' : 'shell'}
                    loading={<div className={s.codeLoading}>正在加载...</div>}
                    options={{
                      fontSize: 12,
                      lineNumbersMinChars: 3,
                      minimap: { enabled: false },
                      readOnly: true,
                      scrollBeyondLastLine: false,
                      wordWrap: 'off',
                    }}
                    value={code[type]}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <SheetFooter>
            <Button onClick={() => void copyCode()} size="lg">
              <ClipboardIcon data-icon="inline-start" />
              复制当前代码
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </ToolWorkbench>
  );
}
