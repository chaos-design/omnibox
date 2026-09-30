'use client';

import MonacoEditor, {
  loader,
  DiffEditor as MonacoDiffEditor,
  type DiffEditorProps as MonacoDiffEditorProps,
  type EditorProps as MonacoEditorProps,
  type OnMount,
} from '@monaco-editor/react';
import {
  forwardRef,
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';

import { useTheme } from '../theme';

import s from './index.module.scss';

export { useMonaco } from '@monaco-editor/react';

// 自托管 monaco：资源由 scripts/sync-monaco.mjs 从 node_modules 复制到 public/monaco。
// 走 CDN 会在弱网下长时间白屏，且加载版本与依赖版本不一致。
const monacoBasePath = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/monaco/vs`;

if (typeof window !== 'undefined') {
  loader.config({ paths: { vs: monacoBasePath } });
}

export type EditorInstance = Parameters<OnMount>[0];

export interface EditorHandle {
  focus: () => void;
  formatDocument: () => Promise<void>;
  getEditor: () => EditorInstance | null;
  getLanguage: () => string;
  getValue: () => string;
  setValue: (value: string) => void;
}

export interface EditorProps
  extends Omit<
    MonacoEditorProps,
    'defaultLanguage' | 'language' | 'onChange' | 'onMount'
  > {
  className?: string;
  language?: string;
  onChange?: (value: string) => void;
  onMount?: (editor: EditorInstance) => void;
}

const defaultOptions: MonacoEditorProps['options'] = {
  automaticLayout: true,
  fontSize: 14,
  formatOnPaste: true,
  minimap: { enabled: false },
  padding: { top: 16 },
  scrollBeyondLastLine: false,
  smoothScrolling: true,
  wordWrap: 'on',
};

function EditorComponent(
  {
    className,
    language = 'json',
    onChange,
    onMount,
    options,
    theme: editorTheme,
    ...editorProps
  }: EditorProps,
  ref: Ref<EditorHandle>,
) {
  const { theme } = useTheme();
  const editorRef = useRef<EditorInstance | null>(null);
  const resolvedEditorTheme =
    editorTheme ?? (theme === 'dark' ? 'vs-dark' : 'light');
  // options 必须是稳定引用。@monaco-editor/react 内部用
  // `useUpdate(() => editor.updateOptions(options), [options])`，
  // 每次渲染传入新对象都会触发一次 updateOptions —— 而它在 monaco 内部
  // 会重算整份配置、广播 change 事件并触发重绘。大 JSON 上单次 updateOptions
  // 就是毫秒级开销，叠加每次击键的 React 重渲染就是肉眼可见的卡顿。
  const mergedOptions = useMemo(
    () => ({ ...defaultOptions, ...options }),
    [options],
  );
  // onChange 同理：@monaco-editor/react 会把它作为依赖重新订阅
  // onDidChangeModelContent。父组件每次渲染都传新函数会导致
  // 每次击键都 dispose + 重新订阅一次监听器。
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const formatDocument = useCallback(async () => {
    const action = editorRef.current?.getAction('editor.action.formatDocument');
    await action?.run();
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      focus: () => editorRef.current?.focus(),
      formatDocument,
      getEditor: () => editorRef.current,
      getLanguage: () =>
        editorRef.current?.getModel()?.getLanguageId() ?? language,
      getValue: () => editorRef.current?.getValue() ?? '',
      setValue: (value) => editorRef.current?.setValue(value),
    }),
    [formatDocument, language],
  );

  const handleChange = useCallback((value: string | undefined) => {
    onChangeRef.current?.(value ?? '');
  }, []);

  const handleMount = useCallback<OnMount>(
    (editor) => {
      editorRef.current = editor;
      onMount?.(editor);
    },
    [onMount],
  );

  return (
    <div className={[s.editorContainer, className].filter(Boolean).join(' ')}>
      <MonacoEditor
        height="100%"
        language={language}
        loading={<div className={s.editorLoading}>正在加载编辑器...</div>}
        options={mergedOptions}
        theme={resolvedEditorTheme}
        {...editorProps}
        onChange={handleChange}
        onMount={handleMount}
      />
    </div>
  );
}

export const Editor = forwardRef(EditorComponent);
Editor.displayName = 'Editor';

export interface DiffEditorProps extends MonacoDiffEditorProps {
  className?: string;
}

const defaultDiffOptions: MonacoDiffEditorProps['options'] = {
  automaticLayout: true,
  formatOnPaste: true,
  minimap: { enabled: false },
  originalEditable: true,
  renderSideBySide: true,
  scrollBeyondLastLine: false,
};

export function DiffEditor({
  className,
  language = 'json',
  options,
  theme: editorTheme,
  ...editorProps
}: DiffEditorProps) {
  const { theme } = useTheme();
  const resolvedEditorTheme =
    editorTheme ?? (theme === 'dark' ? 'vs-dark' : 'light');
  const mergedOptions = useMemo(
    () => ({ ...defaultDiffOptions, ...options }),
    [options],
  );

  return (
    <div className={[s.editorContainer, className].filter(Boolean).join(' ')}>
      <MonacoDiffEditor
        height="100%"
        language={language}
        loading={<div className={s.editorLoading}>正在加载对比编辑器...</div>}
        options={mergedOptions}
        theme={resolvedEditorTheme}
        {...editorProps}
      />
    </div>
  );
}

export const PureEditor = Editor;
