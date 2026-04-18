import { Router } from "express";
import testRoute from "./test.route";
import packageRoute from "./package.route";

const router = Router();

router.use("/test", testRoute);
router.use("/packages", packageRoute);

export default router;
