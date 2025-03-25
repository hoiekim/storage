import { Server } from "./server";

const main = () => {
  type Route = { path: string; methods: string[]; descriptions: string[] };
  const routes: Route[] = [];
  Server.app._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      const methods = Object.keys(middleware.route.methods);
      const descriptions = middleware.route.stack
        .map((layer: any) => layer.handle.description)
        .filter(Boolean);
      routes.push({ path: middleware.route.path, methods, descriptions });
    } else if (middleware.name === "router") {
      middleware.handle.stack.forEach((nestedMiddleware: any) => {
        if (nestedMiddleware.route) {
          const methods = Object.keys(nestedMiddleware.route.methods);
          const descriptions = nestedMiddleware.route.stack
            .map((layer: any) => layer.handle.description)
            .filter(Boolean);
          routes.push({ path: nestedMiddleware.route.path, methods, descriptions });
        }
      });
    }
  });
  console.log(routes);
};

main();
