    import { Router } from "express";

const testRoute = Router();

testRoute.get("/test", (req, res) => {
  res.json({ message: "Backend is working" });
});

export default testRoute;