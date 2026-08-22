import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

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

let globalShowDialog: ((config: DialogConfig) => void) | null = null;

export function showAppAlert(config: DialogConfig) {
  if (globalShowDialog) {
    globalShowDialog(config);
  }
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogConfig, setDialogConfig] = useState<DialogConfig | null>(null);

  const showDialog = useCallback((config: DialogConfig) => {
    setDialogConfig(config);
  }, []);

  const hideDialog = useCallback(() => {
    setDialogConfig(null);
  }, []);

  useEffect(() => {
    globalShowDialog = showDialog;
    return () => {
      globalShowDialog = null;
    };
  }, [showDialog]);

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
