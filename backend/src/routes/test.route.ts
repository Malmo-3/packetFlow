import { Router } from "express";
import { getTestMessage } from "../controllers/test.controller";

const testRoute = Router();

testRoute.get("/", getTestMessage);

export default testRoute;
