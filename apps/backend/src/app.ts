import express from "express";
import cors, { type CorsOptions } from "cors";
import requestLogger from "./middleware/requestLogger";
import validateJson from "./middleware/validateJson";
import notFound from "./middleware/notFound";
import errorHandler from "./middleware/errorHandler";
import routes from "./routes";

const app = express();

// CORS allowlist: origins from CORS_ORIGINS (comma-separated) merged with local
// dev defaults. Outside production we always allow the common local dev ports —
// Vite (5173), the web app (8080), and Expo web (8081 / 19006) — so the Expo
// web build can reach the API without extra config.
const LOCAL_DEV_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://localhost:19006",
];

const PRODUCTION_ORIGINS = ["https://packetflow-web.vercel.app"];

const allowedOrigins = Array.from(
  new Set([
    ...PRODUCTION_ORIGINS,
    ...(process.env.CORS_ORIGINS || "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
    ...(process.env.NODE_ENV === "production" ? [] : LOCAL_DEV_ORIGINS),
  ]),
);

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
