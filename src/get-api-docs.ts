import { app } from "./server";

const main = () => {
  type Route = { path: string; methods: any };
  const routes: Route[] = [];
  app._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      const methods = Object.keys(middleware.route.methods);
      routes.push({ path: middleware.route.path, methods });
    } else if (middleware.name === "router") {
      middleware.handle.stack.forEach((nestedMiddleware: any) => {
        if (nestedMiddleware.route) {
          const methods = Object.keys(nestedMiddleware.route.methods);
          routes.push({ path: nestedMiddleware.route.path, methods });
        }
      });
    }
  });
  console.log(routes);
};

main();
