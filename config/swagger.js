import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const documentPath = path.resolve(currentDirectory, "../docs/openapi.json");
const swaggerDocument = JSON.parse(fs.readFileSync(documentPath, "utf8"));
const require = createRequire(import.meta.url);
const swaggerCss = fs.readFileSync(
  require.resolve("swagger-ui-dist/swagger-ui.css"),
  "utf8",
);
const swaggerBundle = fs.readFileSync(
  require.resolve("swagger-ui-dist/swagger-ui-bundle.js"),
  "utf8",
);
const swaggerStandalonePreset = fs.readFileSync(
  require.resolve("swagger-ui-dist/swagger-ui-standalone-preset.js"),
  "utf8",
);

const swaggerPage = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PermisGo API Documentation</title>
    <style>${swaggerCss}</style>
    <style>html{box-sizing:border-box;overflow-y:scroll}*,*:before,*:after{box-sizing:inherit}body{margin:0;background:#fafafa}.swagger-ui .topbar{display:none}</style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script>${swaggerBundle}</script>
    <script>${swaggerStandalonePreset}</script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "/openapi.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        plugins: [SwaggerUIBundle.plugins.DownloadUrl],
        layout: "StandaloneLayout",
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
        docExpansion: "none",
        tagsSorter: "alpha",
        operationsSorter: "alpha",
        syntaxHighlight: { activate: true, theme: "agate" }
      });
    </script>
  </body>
</html>`;

const docsContentSecurityPolicy = (req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http: https:;",
  );
  next();
};

export const mountSwagger = (app) => {
  const sendSpecification = (req, res) => {
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json(swaggerDocument);
  };

  app.get("/api-docs.json", sendSpecification);
  app.get("/openapi.json", sendSpecification);
  app.get("/docs", (req, res) => res.redirect(302, "/api-docs/"));
  app.get("/swagger", (req, res) => res.redirect(302, "/api-docs/"));
  // Keep all Swagger UI assets in one response. This avoids Vercel rewrites or
  // serverless asset routing turning the nested JS/CSS requests into 404s.
  app.get("/api-docs/", docsContentSecurityPolicy, (req, res) => {
    res.setHeader("Cache-Control", "public, max-age=300");
    res.type("html").send(swaggerPage);
  });
};
