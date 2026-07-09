import { RouterProvider } from "react-router-dom";
import { appRouter } from "./routing/router";

export function App() {
  return <RouterProvider router={appRouter} />;
}
