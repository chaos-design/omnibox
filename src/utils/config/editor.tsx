import { createContext, useContext } from 'react';

export interface EditorProps {
  editor: any;
  setEditor: React.Dispatch<React.SetStateAction<undefined>>;
}

export const MonacoEditor = createContext<EditorProps | undefined>(undefined);

export const useMonacoEditor = () => {
  const context = useContext(MonacoEditor);

  if (!context) {
    throw new Error(
      'useMonacoEditor must be used within an MonacoEditor.Provider',
    );
  }

  return context;
};
