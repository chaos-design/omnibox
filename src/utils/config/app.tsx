import { createContext, useContext } from 'react';

export interface AppConfigParams {
  language?: string;
}

export interface AppConfigProps extends AppConfigParams {
  language?: string;
  setAppConfig: React.Dispatch<React.SetStateAction<Partial<AppConfigParams> | undefined>>
}

export const AppConfig = createContext<AppConfigProps | undefined>(undefined);

export const useAppConfig = () => {
  const context = useContext(AppConfig);

  if (!context) {
    throw new Error(
      'useAppConfig must be used within an AppConfig.Provider',
    );
  }

  return context;
};
