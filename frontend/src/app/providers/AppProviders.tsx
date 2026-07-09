import type { PropsWithChildren } from "react";
import "styles/globals.css";
import { MuiThemeProvider } from "./MuiThemeProvider";
import { QueryProvider } from "./QueryProvider";
import { AppContextProvider } from "contexts/AppContext";
import { AuthContextProvider } from "contexts/AuthContext";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <MuiThemeProvider>
      <QueryProvider>
        <AppContextProvider>
          <AuthContextProvider>{children}</AuthContextProvider>
        </AppContextProvider>
      </QueryProvider>
    </MuiThemeProvider>
  );
}
