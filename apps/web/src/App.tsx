import { createBrowserRouter, RouterProvider } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { ProtectedRouteLayout } from "./layouts/ProtectedRouteLayout";

import "./index.css";

const router = createBrowserRouter([
  {
    Component: RootLayout,
    children: [
      {
        Component: ProtectedRouteLayout,
        children: [
          {
            index: true,
            Component: HomePage,
          },
        ],
      },
    ],
  },
  {
    path: "/login",
    Component: LoginPage,
  },
]);

const App = () => {
  return <RouterProvider router={router} />;
};
export default App;
