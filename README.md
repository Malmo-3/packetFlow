# PacketFlow

A delivery platform for Skåne. Senders create shipments, admins organise carriers into trips, carriers drive packages to drop-off depots, and recipients collect them — all tracked in real time.

---

## Monorepo layout

```
packetFlowTest/
├── apps/
│   ├── api/          Express + Mongoose backend
│   └── web/          React + Vite frontend
├── packages/
│   ├── api-client/   Typed HTTP client shared by web and mobile
│   └── types/        Shared domain types and Skåne city constants
```

---

## Package lifecycle

```mermaid
flowchart TD
  A[Sender creates package]
  B[registered]
  C{Admin assigns carrier}
  D[assigned]
  E[in_transit]
  F[out_for_delivery]
  G[delivered]
  K[exception]

  A --> B
  B --> C
  C -->|Yes| D
  D --> E
  E --> F
  F --> G
  B -->|Error| K
  D -->|Error| K
  E -->|Error| K
  F -->|Error| K
```

---

## Notification flow

```mermaid
flowchart LR
  A[Package event]
  B{Event type}
  N1[Notify recipient - registered]
  N2[Notify recipient - status update]
  N3[Notify sender and recipient - at depot]
  N4[Notify sender and recipient - picked up]
  DB[(Notification DB)]
  Bell[Bell badge - polls every 30s]

  A --> B
  B -->|registered| N1
  B -->|status changed| N2
  B -->|arrived at depot| N3
  B -->|picked up| N4
  N1 --> DB
  N2 --> DB
  N3 --> DB
  N4 --> DB
  DB --> Bell
```

---

## Role access

```mermaid
flowchart TD
  U[User]
  R{Role}
  S[Sender - create packages, view shipments]
  RE[Recipient - track packages, save codes]
  C[Carrier - view trips, mark arrive and pickup]
  AD[Admin - full CRUD, trips, deliveries, webhooks]

  U --> R
  R -->|sender| S
  R -->|recipient| RE
  R -->|carrier| C
  R -->|admin| AD
```

---

## Sender creates a package

```mermaid
sequenceDiagram
  participant Sender
  participant Web
  participant API
  participant DB
  participant Notification

  Sender ->> Web: Fill create-package form
  Web ->> API: POST /api/v1/packages
  API ->> API: Validate cities
  API ->> API: Generate tracking code
  API ->> DB: Package.create()
  DB -->> API: Saved package
  API ->> Notification: Notify recipient by email
  Notification -->> API: Saved
  API -->> Web: 201 package
  Web -->> Sender: Toast + redirect to detail
```

---

## Admin assigns a delivery

```mermaid
sequenceDiagram
  participant Admin
  participant Web
  participant API
  participant DB

  Admin ->> Web: Open packages page
  Web ->> API: GET /api/v1/packages
  API -->> Web: All packages
  Admin ->> Web: Create delivery for package
  Web ->> API: POST /api/v1/deliveries
  API ->> DB: Delivery.create()
  DB -->> API: Saved
  API ->> DB: Package status = assigned
  DB -->> API: Updated
  API -->> Web: 201 delivery
  Admin ->> Web: Assign delivery to trip
  Web ->> API: PATCH /api/v1/trips/:id/deliveries
  API ->> DB: Delivery.trip = tripId
  DB -->> API: Updated
  API -->> Web: 200 ok
```

---

## Carrier advances a trip

```mermaid
sequenceDiagram
  participant Carrier
  participant Web
  participant API
  participant DB
  participant Notification

  Carrier ->> Web: Open My Trips
  Web ->> API: GET /api/v1/trips/my
  API -->> Web: Assigned trips

  Carrier ->> Web: Mark trip Active
  Web ->> API: PATCH /api/v1/trips/:id/status
  API ->> DB: trip.status = active
  DB -->> API: Saved
  API -->> Web: Updated trip

  Carrier ->> Web: Mark package Arrived
  Web ->> API: POST /api/v1/packages/:id/arrive
  API ->> DB: package.status = out_for_delivery
  DB -->> API: Saved
  API ->> Notification: Notify sender and recipient
  API -->> Web: 200 updated package

  Carrier ->> Web: Mark package Picked up
  Web ->> API: POST /api/v1/packages/:id/pickup
  API ->> DB: package.status = delivered
  DB -->> API: Saved
  API ->> Notification: Notify sender and recipient
  API -->> Web: 200 updated package
```

---

## Recipient tracks a package

```mermaid
sequenceDiagram
  participant Recipient
  participant Web
  participant API
  participant localStorage

  Recipient ->> Web: Visit /track/PKT-XXXXXXXX
  Web ->> API: GET /api/v1/packages
  API -->> Web: Package data
  Web -->> Recipient: Status and progress bar

  Recipient ->> Web: Click Save
  Web ->> localStorage: Write tracking code
  Web -->> Recipient: Saved to your list

  loop Every 30 seconds
    Web ->> API: Refetch package
    API -->> Web: Updated package
    Web -->> Recipient: Refresh status
  end
```

---

## Auth flow

```mermaid
sequenceDiagram
  participant User
  participant Web
  participant API
  participant DB
  participant localStorage

  User ->> Web: Submit login form
  Web ->> API: POST /api/v1/auth/login
  API ->> DB: Find user
  DB -->> API: User record
  API ->> API: Sign JWT
  API -->> Web: token + user data
  Web ->> localStorage: Store token and user
  Web -->> User: Redirect to dashboard

  Note over Web,API: On every page load
  Web ->> API: GET /api/v1/auth/me
  API -->> Web: userId, email, role
```

---

## API reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | Public | Create account |
| `POST` | `/auth/login` | Public | Get JWT |
| `GET` | `/auth/me` | Bearer | Verify token |
| `POST` | `/packages` | Optional | Create shipment |
| `GET` | `/packages` | Bearer | List (role-filtered) |
| `GET` | `/packages/:id` | Bearer | Single package |
| `PATCH` | `/packages/:id` | Admin / Carrier | Update |
| `DELETE` | `/packages/:id` | Admin | Delete |
| `POST` | `/packages/:id/arrive` | Carrier | Mark at drop-off |
| `POST` | `/packages/:id/pickup` | Carrier | Mark delivered |
| `GET` | `/trips` | Bearer | All trips |
| `GET` | `/trips/my` | Carrier | Own trips |
| `POST` | `/trips` | Admin | Create trip |
| `PATCH` | `/trips/:id` | Admin | Update trip |
| `PATCH` | `/trips/:id/status` | Carrier | Advance status |
| `DELETE` | `/trips/:id` | Admin | Delete trip |
| `GET` | `/trips/:id/deliveries` | Bearer | Trip deliveries |
| `PATCH` | `/trips/:id/deliveries` | Admin | Bulk-assign deliveries |
| `GET` | `/deliveries` | Admin / Carrier | All deliveries |
| `POST` | `/deliveries` | Admin | Create delivery |
| `PATCH` | `/deliveries/:id` | Admin | Update delivery |
| `DELETE` | `/deliveries/:id` | Admin | Delete delivery |
| `GET` | `/users` | Admin | User directory |
| `GET` | `/notifications` | Bearer | My notifications |
| `PATCH` | `/notifications/read-all` | Bearer | Mark all read |
| `PATCH` | `/notifications/:id/read` | Bearer | Mark one read |

---

## Running locally

```bash
# Install all workspaces
npm install

# Start backend (port 3001)
npm run dev --workspace=apps/api

# Start frontend (port 8080)
npm run dev --workspace=apps/web

# Run API tests
npm test --workspace=apps/api
```
