import React, { createContext, useContext, useState, ReactNode } from 'react';
// Have to create this context to manage the state of file type previews in the LogView component
// This allows us to trigger a reload of the file type preview when a new file is uploaded....
// ...without having to pass down props through multiple components.
interface LogViewContextType {
  reloadFileTypePreview: () => void;
  reloadKey: number;
}

const LogViewContext = createContext<LogViewContextType | undefined>(undefined);

interface LogViewProviderProps {
  children: ReactNode;
}

export const LogViewProvider: React.FC<LogViewProviderProps> = ({ children }) => {
  const [reloadKey, setReloadKey] = useState<number>(0);

  const reloadFileTypePreview = () => {
    setReloadKey(prev => prev + 1);
  };

  return (
    <LogViewContext.Provider value={{ reloadFileTypePreview, reloadKey }}>
      {children}
    </LogViewContext.Provider>
  );
};

export const useLogView = () => {
  const context = useContext(LogViewContext);
  if (context === undefined) {
    throw new Error('useLogView must be used within a LogViewProvider');
  }
  return context;
};
