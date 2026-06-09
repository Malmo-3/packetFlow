/**
 * GDPR retention: anonymize delivery data after a configured period.
 *
 * Targets records that are finished (status `delivered`) and older than the
 * retention window, redacting personal data (names, email, phone, address,
 * sender link) while keeping non-personal fields (tracking number, cities,
 * depots, weight, dimensions, status) for analytics. Notifications older than
 * the window are deleted outright since their message text contains PII.
 *
 * Idempotent: anonymized records are stamped with `anonymizedAt` and skipped on
 * subsequent runs.
 */

import Package from "../models/package.model";
import { Delivery } from "../models/delivery.model";
import { Notification } from "../models/notification.model";

const REDACTED = "[anonymized]";
const REDACTED_EMAIL = "anonymized@redacted.invalid";

export interface AnonymizeResult {
  retentionDays: number;
  cutoff: string;
  packagesAnonymized: number;
  deliveriesAnonymized: number;
  notificationsDeleted: number;
}

export const getRetentionDays = (override?: number): number =>
  override ?? (Number(process.env.DATA_RETENTION_DAYS) || 365);

export const anonymizeExpiredData = async (
  retentionDays?: number,
): Promise<AnonymizeResult> => {
  const days = getRetentionDays(retentionDays);
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const now = new Date();

  const pkgResult = await Package.updateMany(
    {
      status: "delivered",
      updatedAt: { $lt: cutoff },
      anonymizedAt: { $exists: false },
    },
    {
      $set: {
        senderName: REDACTED,
        recipientName: REDACTED,
        recipientEmail: REDACTED_EMAIL,
        anonymizedAt: now,
      },
      $unset: { recipientPhone: 1, recipientAddress: 1, senderId: 1 },
    },
  );

  const deliveryResult = await Delivery.updateMany(
    {
      status: "delivered",
      updatedAt: { $lt: cutoff },
      anonymizedAt: { $exists: false },
    },
    {
      $set: {
        senderName: REDACTED,
        recipientName: REDACTED,
        recipientEmail: REDACTED_EMAIL,
        anonymizedAt: now,
      },
    },
  );

  const notifResult = await Notification.deleteMany({
    createdAt: { $lt: cutoff },
  });

  return {
    retentionDays: days,
    cutoff: cutoff.toISOString(),
    packagesAnonymized: pkgResult.modifiedCount ?? 0,
    deliveriesAnonymized: deliveryResult.modifiedCount ?? 0,
    notificationsDeleted: notifResult.deletedCount ?? 0,
  };
};
