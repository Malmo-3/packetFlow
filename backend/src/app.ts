import express from "express";
import cors from "cors";
import requestLogger from "./middleware/requestLogger";
import validateJson from "./middleware/validlateJson";
import notFound from "./middleware/notFound";
import routes from "./routes";

const app = express();

// middleware ..
app.use(requestLogger); // Runs MORGan loggin middleware on every request..
app.use(cors()); // CORS = cross-origin resource sharing.. "Allows cross-origin request"
app.use(validateJson); // Checks that body-based request use JSON.
app.use(express.json()); // it let express read JSON request bodies,, without express.json, express would not parse it properly into req.body

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "PacketFlow API is running",
  });
});

app.use("/api/v1", routes);

app.use(notFound);

export default app;

//controller = contains what the endpoint does
//route = contains endpoint path
//middleware = code that runs before the controller
//routes/index.ts = combines route files
//app.ts = builds the Express app
// server.ts = starts the app
