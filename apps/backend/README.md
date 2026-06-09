# PacketFlow backend — fixed

This backend merges the two prior backends and fixes the issues from the audit:

- **Base / architecture** comes from **final backend**: Zod request validation
  (`validateRequest` + `src/schemas`), a typed error hierarchy (`src/errors`)
  with a single central `errorHandler`, and a clean module layout.
- **Features** come from **test backend** (the one wired to the web app):
  notifications, user listing, carrier package transitions (`/arrive`,
  `/pickup`), carrier trip endpoints (`/trips/my`, `/trips/:id/status`), Skåne
  city validation, server-resolved drop-off / pick-up depots, and the public
  package intake form.
- **Contract** is locked to `@packetflow/backend-client` (the package the web app
  imports), so the running frontend keeps working: wrapped `{ success, data }`
  responses for auth / packages / notifications, and raw arrays/objects for
  trips / deliveries / users.

The shared `@packetflow/types` constants (`SKANE_CITIES`, `DROP_OFF_POINTS`) are
vendored into `src/shared/skane.ts` so this service builds and runs standalone.

## Security fixes (from the audit)

| Audit finding | Fix |
|---|---|
| **Critical — privilege escalation**: registration trusted a client `role`, so anyone could become `admin`. | Self-registration accepts only `sender` / `recipient` (defaults to `sender`). `carrier` now requires admin approval via the admin-only `POST /users`; `admin` is created only via `npm run create-admin`. |
| **Carrier identity was spoofable**: the old carrier flow trusted an `x-carrier-id` header. | The carrier module now derives identity from the JWT (`req.user`); all carrier routes require the `carrier` role. |
| **High — IDOR** on `GET /packages/:id`. | Ownership check: admin sees any; sender sees own (`senderId`); recipient sees own (`recipientEmail`); carrier sees only packages on their trips. Others get 403. |
| **High — `GET /packages` leaked everything**. | List is role-scoped server-side (sender → own, recipient → own by email, carrier → trip chain, admin → all). |
| **High — no request validation**. | Every route runs Zod `validateRequest` for body/params. |
| **High — raw `error` objects leaked**. | All controllers forward errors via `next()` to the central `errorHandler`, which returns generic messages (no internals). |
| **High — wide-open CORS**. | CORS allowlist from `CORS_ORIGINS` (see `.env.example`). |
| **Low — `validlateJson.ts` typo / 415 on body-less calls**. | Renamed `validateJson.ts` and made it skip body-less requests so carrier `/arrive`, `/pickup`, and `read-all` work. |
| **Low — few tests, tracked `.DS_Store`**. | Vitest suite covering registration lockdown, package authorization, and trip RBAC; `.gitignore` added. |

> **Rotate secrets**: the old `test backend/.env` committed a live MongoDB URI
> and JWT secret. Those should be rotated. This project ships only `.env.example`.

## Run

```bash
npm install
cp .env.example .env   # then fill in MONGO_URI + a strong JWT_SECRET
npm run create-admin   # seed the first admin (set ADMIN_EMAIL / ADMIN_PASSWORD)
npm run dev            # start on PORT (default 3001), API under /api/v1
```

Other scripts: `npm run build`, `npm run start`, `npm run typecheck`,
`npm test`, `npm run clear-packages`.

## Extended modules

The seven modules from *final backend* are now ported onto the new package
contract and final's architecture (Zod validation, typed errors, central handler).
None of these were wired in `@packetflow/backend-client`, so they return RAW or
`{ success, data }` shapes as their original implementation did — adapt when the
web app's `src/api/*` skeletons are connected.

| Module | Endpoints | Access |
|---|---|---|
| Carrier flow | `GET /carrier/trip`, `GET /carrier/trips/:tripId/packages`, `PATCH .../check-in`, `PATCH .../check-out`, `PATCH .../end-shift`, `POST .../scans`, `POST .../scans/validate` | carrier (JWT) |
| Checkpoints | `GET/POST /checkpoints`, `GET/PATCH/DELETE /checkpoints/:id` | read: auth · write: admin |
| Scans | `POST/GET /scans`, `GET /scans/:id`, `GET /scans/package/:packageId` | admin / carrier |
| Tracking | `GET /tracking/:trackingNumber` | authenticated |
| Import | `POST /import/packages/json`, `POST /import/packages/csv` | admin |
| Webhooks | `GET/POST /webhooks`, `GET/PATCH/DELETE /webhooks/:id` | admin |
| Delivery estimates | `GET/POST /delivery-estimates`, `GET/PATCH/DELETE /delivery-estimates/:id`, `GET /delivery-estimates/package/:packageId` | read: auth · write: admin |

Notes while porting:
- Import now resolves drop-off / pick-up depots and generates tracking numbers
  on the new contract (CSV columns: `senderName, recipientName, recipientEmail,
  recipientPhone?, recipientAddress?, pickupCity, destinationCity, weight,
  length, width, height`).
- Scan records drive package + delivery status and fire webhooks; the
  `packageStatusAfter` enum now covers `out_for_delivery` / `exception`.
- The carrier scan flow no longer requires a `checkpoint`, so `checkpoint`,
  `latitude`, `longitude` are optional on the scan-record model.
