import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.json({ message: "packetFlow API is running" });
});

export default app;