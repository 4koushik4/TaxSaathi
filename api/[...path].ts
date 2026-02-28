// Lazy-init the Express app so any import-time crash is caught inside the handler
let app: any;
let initError: string | null = null;

try {
  const { createServer } = require("../server");
  app = createServer();
} catch (err: any) {
  initError = err?.message || "Failed to initialize server";
  console.error("[Vercel Function] Init error:", err);
}

export default async function handler(req: any, res: any) {
  // Always set JSON content-type so Vercel never returns plain text HTML
  res.setHeader("Content-Type", "application/json");

  if (initError || !app) {
    return res.status(500).json({
      error: "Server initialization failed",
      details: initError || "Express app not available",
    });
  }

  try {
    // Vercel automatically parses the request body and consumes the raw stream.
    // Express's body-parser would try to re-read the (now empty) stream and
    // silently fail, leaving req.body undefined. Setting _body = true signals
    // to body-parser that parsing is already done.
    if (req.body !== undefined && req.body !== null) {
      (req as any)._body = true;
    }

    return await new Promise<void>((resolve, reject) => {
      // Intercept res.end to know when Express is done
      const originalEnd = res.end.bind(res);
      (res as any).end = function (...args: any[]) {
        originalEnd(...args);
        resolve();
      };

      try {
        app(req as any, res as any);
      } catch (syncErr: any) {
        reject(syncErr);
      }
    });
  } catch (err: any) {
    console.error("[Vercel Function] Handler error:", err);
    // If headers haven't been sent yet, send a JSON error
    if (!res.headersSent) {
      return res.status(500).json({
        error: err?.message || "Unexpected server error",
      });
    }
  }
}
