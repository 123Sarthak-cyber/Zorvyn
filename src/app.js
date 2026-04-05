import express from "express";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import routes from "./routes/index.js";
import authRoutes from "./routes/auth.routes.js";
import { authenticate } from "./middleware/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const rootDir = path.resolve(__dirname, "..");

const apiLimiter = rateLimit({
  windowMs: Number(process.env.API_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  limit: Number(process.env.API_RATE_LIMIT_MAX || 120),
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  limit: Number(process.env.AUTH_RATE_LIMIT_MAX || 10),
  standardHeaders: true,
  legacyHeaders: false
});

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Finance Dashboard Backend API",
      version: "1.0.0",
      description: "Role-based finance records and dashboard summary API"
    },
    servers: [{ url: "http://localhost:4000" }]
  },
  apis: []
});

app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok"
  });
});

app.get("/openapi.json", (_req, res) => {
  res.json(swaggerSpec);
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(express.static(rootDir));

app.get("/", (_req, res) => {
  res.sendFile(path.join(rootDir, "index.html"));
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api", apiLimiter, authenticate, routes);
app.use(notFound);
app.use(errorHandler);

export default app;
