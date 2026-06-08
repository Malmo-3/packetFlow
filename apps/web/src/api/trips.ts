/**
 * Trips API
 *
 * BACKEND CONTRACT:
 *   GET    /api/v1/trips                        -> Route[]
 *   GET    /api/v1/trips/:id                    -> Route
 *   POST   /api/v1/trips                        body: { name, carrierId?, checkpointIds: string[] }  -> Route
 *   PATCH  /api/v1/trips/:id                    body: Partial<Route>  -> Route
 *   DELETE /api/v1/trips/:id                    -> 204
 *   GET    /api/v1/checkpoints                  -> Checkpoint[]
 */

import type { Checkpoint, Route } from "@packetflow/types";

export async function listRoutes(): Promise<Route[]> {
  throw new Error("TODO: GET /api/v1/trips");
}

export async function getRouteById(_id: string): Promise<Route | undefined> {
  throw new Error("TODO: GET /api/v1/trips/:id");
}

export async function createRoute(_input: { name: string; carrierId?: string; checkpointIds: string[] }): Promise<Route> {
  throw new Error("TODO: POST /api/v1/trips");
}

export async function updateRoute(_id: string, _patch: Partial<Omit<Route, "id" | "createdAt">>): Promise<Route> {
  throw new Error("TODO: PATCH /api/v1/trips/:id");
}

export async function deleteRoute(_id: string): Promise<void> {
  throw new Error("TODO: DELETE /api/v1/trips/:id");
}

export async function listCheckpoints(): Promise<Checkpoint[]> {
  throw new Error("TODO: GET /api/v1/checkpoints");
}
