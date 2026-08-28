import express from "express";
import { errorHandler } from "./middlewares/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
import rbacRoutes from "./routes/rbac.routes.js";

const app = express();

//middlewares
app.use(express.json());
app.use(cookieParser());

//routes
app.use("/api/auth", authRoutes);
app.use("/api/rbac/", rbacRoutes);

//centralized error handler
app.use(errorHandler);

export default app;
