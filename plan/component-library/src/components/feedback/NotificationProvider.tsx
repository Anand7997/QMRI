import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  SnackbarProvider,
  useSnackbar,
  type OptionsObject,
  type SnackbarKey,
} from "notistack";

interface NotificationContextValue {
  notify: (message: string, options?: OptionsObject) => SnackbarKey;
  close: (key?: SnackbarKey) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

interface NotificationBridgeProps {
  children: ReactNode;
}

function NotificationBridge({ children }: NotificationBridgeProps) {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const value = useMemo<NotificationContextValue>(
    () => ({
      notify: (message, options) => enqueueSnackbar(message, options),
      close: (key) => closeSnackbar(key),
    }),
    [enqueueSnackbar, closeSnackbar],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export interface AppNotificationProviderProps {
  children: ReactNode;
  maxSnack?: number;
}

export function AppNotificationProvider({
  children,
  maxSnack = 4,
}: AppNotificationProviderProps) {
  return (
    <SnackbarProvider
      maxSnack={maxSnack}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      autoHideDuration={3500}
      preventDuplicate
    >
      <NotificationBridge>{children}</NotificationBridge>
    </SnackbarProvider>
  );
}

export function useAppNotification() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useAppNotification must be used inside AppNotificationProvider.");
  }

  return context;
}
