import React, { createContext, useContext, useState } from 'react';

export type DialogAction = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

export type DialogConfig = {
  title: string;
  message?: string;
  actions?: DialogAction[];
};

type DialogContextType = {
  showDialog: (config: DialogConfig) => void;
  hideDialog: () => void;
  dialogConfig: DialogConfig | null;
};

const DialogContext = createContext<DialogContextType | null>(null);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogConfig, setDialogConfig] = useState<DialogConfig | null>(null);

  const showDialog = (config: DialogConfig) => {
    setDialogConfig(config);
  };

  const hideDialog = () => {
    setDialogConfig(null);
  };

  return (
    <DialogContext.Provider value={{ showDialog, hideDialog, dialogConfig }}>
      {children}
    </DialogContext.Provider>
  );
}

export function useAppDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useAppDialog must be used within a DialogProvider');
  }
  return context;
}
