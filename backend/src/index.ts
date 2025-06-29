import 'dotenv/config'; 
import express, { ErrorRequestHandler } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import "dotenv/config";
import usersRoutes from "./routes/usersRoutes";
import stripsRoutes from "./routes/stripsRoutes";
import brandsRoutes from "./routes/brandsRoutes";
import parametersRoutes from "./routes/parametersRoutes";
import stripsParametersRoutes from "./routes/stripsParametersRoutes";
import colorsRoutes from "./routes/colorsRoutes";
import stripStatusRoutes from "./routes/stripStatusRoutes";
// Initialize the express app
const app = express();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: "*",
    // credentials: true,
  })
);
app.use(bodyParser.json());

// Routes
app.use("/api/users", usersRoutes);
app.use("/api/strips", stripsRoutes);
app.use("/api/brands", brandsRoutes);
app.use("/api/parameters", parametersRoutes);
app.use("/api/strips_parameter", stripsParametersRoutes);
app.use("/api/colors", colorsRoutes);
app.use("/api/strip-status", stripStatusRoutes);

// JSON Error Middleware
const jsonErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  let serializedError = JSON.stringify(err, Object.getOwnPropertyNames(err));
  serializedError = serializedError.replace(/\/+/g, "/");
  serializedError = serializedError.replace(/\\+/g, "/");
  res.status(500).send({ error: serializedError });
};
app.use(jsonErrorHandler);

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Handle validation errors (e.g., missing fields)
  if (err.message.startsWith("Missing required fields")) {
    res.status(400).json({ error: err.message });
    return;
  }

  // Handle not found errors
  if (err.message.includes("not found")) {
    res.status(404).json({ error: err.message });
    return;
  }

  // Handle invalid request errors
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: "Invalid JSON payload" });
    return;
  }

  // Database-related errors
  if (err.code === "23505") {
    res.status(409).json({ error: "Duplicate entry detected" });
    return;
  }

  if (err.code === "22P02") {
    res.status(400).json({ error: "Invalid input type" });
    return;
  }

  // Default to a generic 500 Internal Server Error
  res.status(500).json({
    error: "Internal Server Error",
    details: err.message,
  });
  return;
};

// Use the custom error handler
app.use(errorHandler);

// =================== Server ===================
const PORT = process.env.BackendPORT_IN;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
