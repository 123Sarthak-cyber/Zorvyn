import express from "express";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import routes from "./routes/index.js";
import { mockAuth } from "./middleware/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";

const app = express();

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

app.use("/api", mockAuth, routes);
app.use(notFound);
app.use(errorHandler);

export default app;
