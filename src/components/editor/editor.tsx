'use client';

import MonacoEditor, {
  DiffEditor as MonacoDiffEditor,
  type DiffEditorProps as MonacoDiffEditorProps,
  type EditorProps as MonacoEditorProps,
  type OnMount,
} from '@monaco-editor/react';
import { usePathname } from 'next/navigation';
import {
  forwardRef,
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';

// 导入本模块即注册 monaco 的自托管 paths（顶层副作用），
// 必须早于任何 loader.init()。app-shell 的预热走同一条路径。
import '../../utils/monaco/loader';
import { Loading } from '../loading';
import { useTheme } from '../theme';

import s from './index.module.scss';
import { modelPath } from './model-path';

export { useMonaco } from '@monaco-editor/react';

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
    | 'defaultLanguage'
    | 'keepCurrentModel'
    | 'language'
    | 'onChange'
    | 'onMount'
    | 'path'
  > {
  className?: string;
  language?: string;
  onChange?: (value: string) => void;
  onMount?: (editor: EditorInstance) => void;
  /**
   * 同页多个编辑器时区分 model 缓存槽位。缺省用 0。
   * 见 modelPath：path 决定 model 是否复用。
   */
  modelKey?: number | string;
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
    modelKey = 0,
    onChange,
    onMount,
    options,
    theme: editorTheme,
    ...editorProps
  }: EditorProps,
  ref: Ref<EditorHandle>,
) {
  const { theme } = useTheme();
  const pathname = usePathname();
  const editorRef = useRef<EditorInstance | null>(null);
  const resolvedEditorTheme =
    editorTheme ?? (theme === 'dark' ? 'vs-dark' : 'light');
  const path = modelPath(pathname, modelKey);
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
        keepCurrentModel
        language={language}
        loading={
          <div className={s.editorLoading}>
            <Loading label="正在加载编辑器" />
          </div>
        }
        options={mergedOptions}
        path={path}
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

export interface DiffEditorProps
  extends Omit<MonacoDiffEditorProps, 'keepCurrentModel' | 'path'> {
  className?: string;
  modelKey?: number | string;
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
  modelKey = 0,
  language = 'json',
  options,
  theme: editorTheme,
  ...editorProps
}: DiffEditorProps) {
  const { theme } = useTheme();
  const pathname = usePathname();
  const resolvedEditorTheme =
    editorTheme ?? (theme === 'dark' ? 'vs-dark' : 'light');
  const mergedOptions = useMemo(
    () => ({ ...defaultDiffOptions, ...options }),
    [options],
  );
  const path = modelPath(pathname, modelKey);

  return (
    <div className={[s.editorContainer, className].filter(Boolean).join(' ')}>
      <MonacoDiffEditor
        height="100%"
        // 左右两侧是两个独立 model，各自都要 keep，否则回退时重新分词。
        keepCurrentModifiedModel
        keepCurrentOriginalModel
        language={language}
        loading={
          <div className={s.editorLoading}>
            <Loading label="正在加载对比编辑器" />
          </div>
        }
        modifiedModelPath={`${path}/modified`}
        options={mergedOptions}
        originalModelPath={`${path}/original`}
        theme={resolvedEditorTheme}
        {...editorProps}
      />
    </div>
  );
}

export const PureEditor = Editor;
