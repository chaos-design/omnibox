'use client';

import { PaintbrushIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import type { EditorHandle } from '../../../components/editor';
import { Loading } from '../../../components/loading';
import { Toolbar } from '../../../components/toolbar';
import { Button } from '../../../components/ui/button';
import { Spinner } from '../../../components/ui/spinner';
import { formatCode } from '../../../utils/tools/format';

import s from './index.module.scss';

const Editor = dynamic(
  () =>
    import('../../../components/editor/editor').then((module) => module.Editor),
  {
    loading: () => (
      <div className={s.loading}>
        <Loading hint="正在加载编辑器" />
      </div>
    ),
    ssr: false,
  },
);

const demoCode = `const tools = [
  { name: 'JSON', enabled: true },
  { name: 'Diff', enabled: true },
];

console.log(tools);`;

export default function CodeFormatPage() {
  const editorRef = useRef<EditorHandle>(null);
  const [language, setLanguage] = useState('javascript');
  const [source, setSource] = useState(demoCode);
  const [formatting, setFormatting] = useState(false);
  const formatRequest = useRef(0);
  const latestLanguage = useRef(language);
  const latestSource = useRef(source);

  const handleFormat = useCallback(async () => {
    // 读 ref 而非 state：state 里可能是被节流掉的中间值。
    const currentSource = latestSource.current;

    if (!currentSource.trim()) {
      toast.info('请输入需要格式化的代码。');
      return;
    }

    latestLanguage.current = language;
    setFormatting(true);
    const request = formatRequest.current + 1;
    formatRequest.current = request;
    const isCurrentRequest = () =>
      request === formatRequest.current &&
      currentSource === latestSource.current &&
      language === latestLanguage.current;

    try {
      const formatted = await formatCode(currentSource, language);

      if (!isCurrentRequest()) {
        toast.info('内容或语言已变化，已忽略过期的格式化结果。');
        return;
      }

      if (formatted === null) {
        await editorRef.current?.formatDocument();
        toast.info('当前语言使用 Monaco 内置格式化能力。');
      } else {
        latestSource.current = formatted;
        setSource(formatted);
        toast.success('格式化完成');
      }
    } catch (error) {
      if (!isCurrentRequest()) {
        return;
      }

      const reason = error instanceof Error ? error.message : String(error);
      toast.error(`格式化失败：${reason}`);
    } finally {
      if (request === formatRequest.current) {
        setFormatting(false);
      }
    }
  }, [language]);

  const handleEditorChange = useCallback((value: string) => {
    latestSource.current = value;
    setSource(value);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        void handleFormat();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFormat]);

  return (
    <main className={s.page}>
      <Toolbar
        className={s.toolbar}
        language={language}
        onLanguageChange={(value) => {
          latestLanguage.current = value;
          setLanguage(value);
        }}
      >
        <Button disabled={formatting} onClick={() => void handleFormat()}>
          {formatting ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <PaintbrushIcon data-icon="inline-start" />
          )}
          格式化
        </Button>
      </Toolbar>
      <section aria-label="代码格式化编辑器" className={s.editor}>
        <Editor
          language={language}
          // 稳定引用：@monaco-editor/react 会以此为依赖重新订阅
          // onDidChangeModelContent，行内函数会让每次击键都重订阅一次。
          onChange={handleEditorChange}
          ref={editorRef}
          value={source}
        />
      </section>
    </main>
  );
}
