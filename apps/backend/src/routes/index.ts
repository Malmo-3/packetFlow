// Combine all route modules under /api/v1.

import { Router } from "express";
import testRoute from "./test.route";
import authRoute from "./auth.route";
import packageRoute from "./package.route";
import tripRoute from "./trip.route";
import deliveryRoute from "./delivery.route";
import userRoute from "./user.route";
import notificationRoute from "./notification.route";
import carrierRoute from "./carrier.route";
import carrierEntityRoute from "./carrierEntity.route";
import checkpointRoute from "./checkpoint.route";
import scanRecordRoute from "./scanRecord.route";
import trackingRoute from "./tracking.route";
import importRoute from "./import.route";
import webhookRoute from "./webhook.route";
import deliveryEstimateRoute from "./deliveryEstimate.route";
import gdprRoute from "./gdpr.route";
import carrierApplicationRoute from "./carrierApplication.route";

const router = Router();

// Core (wired to the web app via @packetflow/backend-client)
router.use("/test", testRoute);
router.use("/auth", authRoute);
router.use("/packages", packageRoute);
router.use("/trips", tripRoute);
router.use("/deliveries", deliveryRoute);
router.use("/users", userRoute);
router.use("/notifications", notificationRoute);

// Extended modules
router.use("/carrier", carrierRoute);
router.use("/carriers", carrierEntityRoute);
router.use("/checkpoints", checkpointRoute);
router.use("/scans", scanRecordRoute);
router.use("/tracking", trackingRoute);
router.use("/import", importRoute);
router.use("/webhooks", webhookRoute);
router.use("/delivery-estimates", deliveryEstimateRoute);
router.use("/gdpr", gdprRoute);
router.use("/carrier-applications", carrierApplicationRoute);

export default router;
