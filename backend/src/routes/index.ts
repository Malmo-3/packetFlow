//* combine all routes ..

import { Router } from "express";
import testRoute from "./test.route";
import packageRoute from "./package.route";
import authRoute from "./auth.route";

const router = Router();

router.use("/test", testRoute);
router.use("/packages", packageRoute);
router.use("/auth", authRoute);

export default router;
