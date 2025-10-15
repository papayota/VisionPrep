import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { UPLOAD_LIMIT_CONFIG } from "./config";

export async function createApp() {
  const app = express();

  app.use(express.json({ limit: `${UPLOAD_LIMIT_CONFIG.maxUploadMb}mb` }));
  app.use(
    express.urlencoded({
      limit: `${UPLOAD_LIMIT_CONFIG.maxUploadMb}mb`,
      extended: true,
    }),
  );

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }

        log(logLine);
      }
    });

    next();
  });

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (res.headersSent) {
      return;
    }

    const statusFromError = err.status ?? err.statusCode;
    const status = err.type === "entity.too.large" ? 413 : statusFromError ?? 500;

    if (status === 413) {
      res.status(413).json({
        error: "payload_too_large",
        hint: UPLOAD_LIMIT_CONFIG.hint,
      });
      return;
    }

    const message = err.message || "Internal Server Error";
    const code = err.code || "internal_error";

    console.error("Unhandled error while processing request", err);
    res.status(status).json({ error: code, message });
  });

  return { app, server };
}


if (process.env.NODE_ENV !== "test") {
  (async () => {
    const { app, server } = await createApp();

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  })();
}
