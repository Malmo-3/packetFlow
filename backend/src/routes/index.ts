//* combine all routes ..

import { Router } from "express";
import testRoute from "./test.route";
import packageRoute from "./package.route";
import tripRoutes from "./tripRoutes";
import deliveryRoutes from "./deliveryRoutes";
import authRoute from "./auth.route";

const router = Router();

router.use("/test", testRoute);
router.use("/auth", authRoute);
router.use("/packages", packageRoute);
router.use("/trips", tripRoutes);
router.use("/deliveries", deliveryRoutes);

export default router;
