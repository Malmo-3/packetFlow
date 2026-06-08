//* combine all routes ..

import { Router } from "express";
import testRoute from "./test.route";
import packageRoute from "./package.route";
import tripRoutes from "./trip.route";
import deliveryRoutes from "./delivery.route";
import authRoute from "./auth.route";
import carrierRoute from "./carrier.route";
import checkpointRoute from "./checkpoint.route";
import scanRecordRoute from "./scanRecord.route";
import trackingRoute from "./tracking.route";
import importRoute from "./import.route";
import webhookRoute from "./webhook.route";
import deliveryEstimateRoute from "./deliveryEstimate.route";

const router = Router();

router.use("/test", testRoute);
router.use("/auth", authRoute);
router.use("/packages", packageRoute);
router.use("/trips", tripRoutes);
router.use("/deliveries", deliveryRoutes);
router.use("/carrier", carrierRoute);
router.use("/checkpoints", checkpointRoute);
router.use("/scans", scanRecordRoute);
router.use("/tracking", trackingRoute);
router.use("/import", importRoute);
router.use("/webhooks", webhookRoute);
router.use("/delivery-estimates", deliveryEstimateRoute);

export default router;
