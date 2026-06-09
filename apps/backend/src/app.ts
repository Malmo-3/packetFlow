import express from "express";
import cors, { type CorsOptions } from "cors";
import requestLogger from "./middleware/requestLogger";
import validateJson from "./middleware/validateJson";
import notFound from "./middleware/notFound";
import errorHandler from "./middleware/errorHandler";
import routes from "./routes";

const app = express();

// CORS allowlist from CORS_ORIGINS (comma-separated), with local dev defaults.
const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  "http://localhost:5173,http://localhost:8080"
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // No Origin = non-browser client (curl, mobile, server-to-server).
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(requestLogger);
app.use(express.json());
app.use(validateJson);

app.get("/", (_req, res) => {
  res.status(200).json({ success: true, message: "PacketFlow API is running" });
});

app.use("/api/v1", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
