//* combine all routes ..

import { Router } from "express";
import testRoute from "./test.route";
import packageRoute from "./package.route";
import tripRoutes from "./trip.route";
import deliveryRoutes from "./delivery.route";
import authRoute from "./auth.route";

const router = Router();

router.use("/test", testRoute);
router.use("/auth", authRoute);
router.use("/packages", packageRoute);
router.use("/trips", tripRoutes);
router.use("/deliveries", deliveryRoutes);

export default router;
