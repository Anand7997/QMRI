import { createBrowserRouter } from "react-router-dom";
import { privateRoutes } from "./routes/privateRoutes";
import { publicRoutes } from "./routes/publicRoutes";

export const appRouter = createBrowserRouter([...publicRoutes, ...privateRoutes]);
