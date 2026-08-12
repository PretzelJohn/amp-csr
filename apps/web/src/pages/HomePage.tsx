import type { RouteObject } from "react-router";

const Component = () => {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <h1 className="text-3xl font-bold">Home Page</h1>
    </div>
  );
};

export const HomePage: RouteObject = {
  index: true,
  path: "/",
  Component,
};
