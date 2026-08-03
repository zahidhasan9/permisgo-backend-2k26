import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import swaggerUi from "swagger-ui-express";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const documentPath = path.resolve(currentDirectory, "../docs/openapi.json");
const swaggerDocument = JSON.parse(fs.readFileSync(documentPath, "utf8"));

const docsContentSecurityPolicy = (req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http: https:;",
  );
  next();
};

export const mountSwagger = (app) => {
  app.get("/api-docs.json", (req, res) => res.json(swaggerDocument));
  app.get("/docs", (req, res) => res.redirect(302, "/api-docs"));
  app.use(
    "/api-docs",
    docsContentSecurityPolicy,
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      explorer: true,
      customSiteTitle: "PermisGo API Documentation",
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
        docExpansion: "none",
        tagsSorter: "alpha",
        operationsSorter: "alpha",
      },
    }),
  );
};
