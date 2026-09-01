import { createContext, type PropsWithChildren, useContext } from "react";

type AppContextValue = {
  appName: string;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

const appContextValue: AppContextValue = {
  appName: "QAScan",
};

export function AppContextProvider({ children }: PropsWithChildren) {
  return <AppContext.Provider value={appContextValue}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext must be used inside AppContextProvider.");
  }

  return context;
}

