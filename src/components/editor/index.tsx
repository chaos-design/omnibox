import React, {
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import c from 'classnames';

import { omit } from 'lodash';

import MonacoEditor, {
  useMonaco,
  DiffEditor as MonacoDiffEditor,
  EditorProps as OriginEditorProps,
} from '@monaco-editor/react';
import { useMonacoEditor } from '../../utils/config/editor';

import s from './index.module.scss';

export { useMonaco };

type NotUndefined<T> = T extends undefined ? never : T;
type OnChangeType = NotUndefined<OriginEditorProps['onChange']>;
type OnMountType = NotUndefined<OriginEditorProps['onMount']>;

export type EventType = Parameters<OnChangeType>[1];
export type EditorType = Parameters<OnMountType>[0];

export type MonacoEditorProps = Parameters<typeof MonacoEditor>[0];

export interface EditorProps extends MonacoEditorProps {
  className?: string;
  language?: string;
  ref?: React.RefObject<unknown>;
}

const Editor = React.forwardRef(
  ({ className, ...monacoEditorProps }: EditorProps, ref) => {
    const [value, setValue] = useState();
    const editorRef = useRef<any>(null);
    const { setEditor } = useMonacoEditor();

    useLayoutEffect(() => {
      if (editorRef.current) {
        setEditor?.(editorRef.current);
      }
    }, [editorRef.current, setEditor]);

    const handleEditorChange = useCallback((_v: string | undefined) => {
      let v = value;
      if (!_v) {
        v = value;
      } else {
        try {
          v = JSON.parse(_v);
        } catch (error) {
          v = value;
        }
      }

      setValue(v);
    }, []);

    const getLanguage = React.useCallback(() => {
      if (editorRef.current) {
        // @ts-ignore
        return editorRef.current?.getModel().getLanguageId();
      }

      return 'json';
    }, []);

    const handleFormatDocument = React.useCallback(() => {
      if (editorRef.current) {
        // @ts-ignore
        editorRef.current?.getAction?.('editor.action.formatDocument').run();
      }
    }, [editorRef.current]);

    useImperativeHandle(ref, () => {
      return {
        getValue: () => value,
        setValue: (v: any) => setValue(v),
        handleFormatDocument,
        getLanguage,
        editor: editorRef.current,
      };
    }, [editorRef.current]);

    const handleEditorDidMount = React.useCallback((editor: EditorType) => {
      // @ts-ignore
      editorRef.current = editor;

      // @ts-ignore
      editor.handleFormatDocument = handleFormatDocument;
      // @ts-ignore
      editor.getLanguage = getLanguage;

      // @ts-ignore
      setEditor(editor);

      // 监听 paste 事件
      editor.onDidPaste(() => {
        handleFormatDocument();
      });
    }, []);

    const editorValue = React.useMemo(() => {
      try {
        return JSON.stringify(value, null, 2);
      } catch (error) {
        return `${value}`;
      }
    }, [value]);

    return (
      <div className={c(s.editorContainer, className)}>
        <MonacoEditor
          height="100%"
          defaultLanguage={monacoEditorProps?.defaultLanguage ?? 'json'}
          defaultValue={editorValue}
          theme={monacoEditorProps?.theme ?? 'vs-dark'}
          {...omit(monacoEditorProps || {}, 'defaultLanguage', 'theme')}
          // @ts-ignore
          onMount={handleEditorDidMount}
          onChange={handleEditorChange}
        />
      </div>
    );
  },
);

export type MonacoDiffEditorProps = Parameters<typeof MonacoDiffEditor>[0];

export interface DiffEditorProps extends MonacoDiffEditorProps {
  className?: string;
  format?: boolean;
}

const DiffEditor = ({
  className,
  language = 'json',
  ...monacoEditorProps
}: DiffEditorProps) => {
  const diffEditorRef = useRef<any>(null);

  const handleEditorDidMount = React.useCallback((editor: EditorType) => {
    diffEditorRef.current = editor;
    // console.log(editor);

    // 监听 onDidUpdateDiff 事件
    // editor.onDidUpdateDiff((e, ...args) => {
    //   console.log(e, ...args)
    //   handleFormatDocument(e);
    // });
  }, []);

  return (
    <div className={c(s.editorContainer, className)}>
      <MonacoDiffEditor
        theme={monacoEditorProps?.theme || 'vs-dark'}
        height="calc(100%)"
        language={language}
        original=""
        modified=""
        options={{
          originalEditable: true,
          formatOnPaste: true,
          // renderSideBySide: false,
        }}
        // @ts-ignore
        onMount={handleEditorDidMount}
      />
    </div>
  );
};

export { Editor, DiffEditor };
