'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

import { Loading } from '../../../components/loading';
import { Toolbar } from '../../../components/toolbar';

import s from './index.module.scss';

const DiffEditor = dynamic(
  () =>
    import('../../../components/editor/editor').then(
      (module) => module.DiffEditor,
    ),
  {
    loading: () => (
      <div className={s.loading}>
        <Loading hint="正在加载对比编辑器" />
      </div>
    ),
    ssr: false,
  },
);

const originalDemo = `const greet = (name) => {
  return 'Hello, ' + name;
};`;

const modifiedDemo = `function greet(name: string): string {
  return \`Hello, \${name}!\`;
}`;

export default function CodeDiffPage() {
  const [language, setLanguage] = useState('typescript');

  // 刻意不做受控：@monaco-editor/react 内部对 original/modified 各有一个
  // useEffect，依赖变化时调用 model.setValue()。若把编辑内容回灌成 state，
  // 每次击键都会触发一次 setValue —— 整篇文档重解析、撤销栈被清空、
  // 光标跳到末尾。这里让 diff 模型的初始内容就是 demo 值，之后完全交给
  // monaco 自己维护。
  return (
    <main className={s.page}>
      <Toolbar
        className={s.toolbar}
        language={language}
        onLanguageChange={setLanguage}
      />
      <section aria-label="代码对比编辑器" className={s.editor}>
        <DiffEditor
          language={language}
          modified={modifiedDemo}
          original={originalDemo}
        />
      </section>
    </main>
  );
}
