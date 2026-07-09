import { createContext, type PropsWithChildren, useContext } from "react";

type NotificationContextValue = {
  push: (message: string) => void;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const notificationContextValue: NotificationContextValue = {
  push: (_message: string) => {
  },
};

export function NotificationContextProvider({ children }: PropsWithChildren) {
  return (
    <NotificationContext.Provider value={notificationContextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotificationContext must be used inside NotificationContextProvider.");
  }

  return context;
}
