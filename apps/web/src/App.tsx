import { createBrowserRouter, RouterProvider } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { HomePage } from "./pages/HomePage";

import "./index.css";

const router = createBrowserRouter([
  {
    Component: RootLayout,
    children: [HomePage],
  },
]);

const App = () => {
  return <RouterProvider router={router} />;
};
export default App;
