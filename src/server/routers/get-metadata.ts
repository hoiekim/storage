import { RequestHandler } from "express";
import { database, Metadata } from "server";
import { Router } from "./common";

interface GetMetadataHandlerOptions {
  description: string;
  parameterName?: "id" | "filekey" | "item_id";
}

const getMetadataHandler = (options: GetMetadataHandlerOptions) => {
  const { description, parameterName } = options;
  const metadataHandler: RequestHandler & { description?: string } = async (req, res) => {
    const user = req.user!;
    const user_id = user.id;

    const metadataQuery: Partial<Metadata> = { user_id };
    if (parameterName) {
      const parameterValue = req.params[parameterName];
      const id = +parameterValue;
      if (parameterName === "id" && !isNaN(id)) {
        metadataQuery[parameterName] = id;
      } else {
        metadataQuery[parameterName as "filekey" | "item_id"] = parameterValue;
      }
    }

    try {
      const metadataFoundById = database.getMetadata(metadataQuery);
      if (metadataFoundById.length) {
        res.status(200).json({ body: metadataFoundById });
        return;
      }
      res.status(204).end();
    } catch (err: any) {
      const message = "message" in err ? err.message : "Unknown error";
      res.status(404).json({ message: `Metadata not found: ${message}` });
    }
  };

  metadataHandler.description = description;

  return metadataHandler;
};

export const allMetadataRouter: Router = {
  method: "GET",
  route: "/metadata",
  handlers: [
    getMetadataHandler({
      description: "Returns all metadata owned by the request user.",
    }),
  ],
};

export const metadataByIdRouter: Router = {
  method: "GET",
  route: "/metadata-by-id/:id",
  handlers: [
    getMetadataHandler({
      description: "Returns metadata found by 'id'.",
      parameterName: "id",
    }),
  ],
};

export const metadataByFilekeyRouter: Router = {
  method: "GET",
  route: "/metadata-by-filekey/:filekey",
  handlers: [
    getMetadataHandler({
      description: "Returns metadata found by 'filekey'.",
      parameterName: "filekey",
    }),
  ],
};

export const metadataByItemIdRouter: Router = {
  method: "GET",
  route: "/metadata-by-item-id/:item_id",
  handlers: [
    getMetadataHandler({
      description: "Returns metadata found by 'item_id'.",
      parameterName: "item_id",
    }),
  ],
};
