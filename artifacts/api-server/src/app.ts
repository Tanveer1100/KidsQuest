import express, { type Express, type ErrorRequestHandler } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import { CLERK_PROXY_PATH, clerkProxyMiddleware, getClerkProxyHost } from "./middlewares/clerkProxyMiddleware";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
app.use(cors({ credentials: true, origin: true }));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(clerkMiddleware((req) => ({
  publishableKey: publishableKeyFromHost(
    getClerkProxyHost(req) ?? "",
    process.env.CLERK_PUBLISHABLE_KEY,
  ),
})));

app.use("/api", router);

const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  // Do not log request bodies: child-profile fields and auth credentials are private.
  req.log.error({ name: error?.name, code: error?.code }, "Request failed");
  const badRequest = error?.type === "entity.parse.failed";
  const tooLarge = error?.type === "entity.too.large";
  res.status(badRequest ? 400 : tooLarge ? 413 : 500).json({
    error: badRequest ? "Invalid JSON request." : tooLarge ? "Request is too large." : "Something went wrong. Please try again.",
  });
};
app.use(errorHandler);

export default app;
