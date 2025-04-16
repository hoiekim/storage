import { Server } from "./server";

export const getApiDocs = () => {
  type Route = { path: string; method: string; descriptions: string[] };
  const routes: Route[] = [];
  Server.app._router.stack.forEach(({ route }: any) => {
    if (route) {
      const methods = Object.keys(route.methods);
      if (methods.length !== 1) throw new Error("Routers must have exactly one method.");
      const method = methods[0];
      const descriptions = route.stack
        .map((layer: any) => layer.handle.description)
        .filter(Boolean);
      routes.push({ path: route.path, method, descriptions });
    }
  });
  return routes;
};

const main = () => {
  const docs = getApiDocs();
  console.log(docs);
};

if (require.main === module) {
  main();
}
