import { createServer } from "../server";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const app = createServer();

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel automatically parses the request body and consumes the raw stream.
  // Express's body-parser would try to re-read the (now empty) stream and
  // silently fail, leaving req.body undefined. Setting _body = true signals
  // to body-parser that parsing is already done.
  if (req.body !== undefined && req.body !== null) {
    (req as any)._body = true;
  }

  return app(req as any, res as any);
}
