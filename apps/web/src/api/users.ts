/**
 * Users API
 *
 * BACKEND CONTRACT:
 *   GET  /api/v1/users                           -> User[]
 *   GET  /api/v1/users/:id                       -> User
 *   GET  /api/v1/users?email=<email>             -> User | 404
 *   GET  /api/v1/users?role=recipient&q=<query>  -> User[]
 */

import type { User } from "@packetflow/types";

export async function listUsers(): Promise<User[]> {
  throw new Error("TODO: GET /api/v1/users");
}

export async function getUserById(_id: string): Promise<User | undefined> {
  throw new Error("TODO: GET /api/v1/users/:id");
}

export async function getUserByEmail(_email: string): Promise<User | undefined> {
  throw new Error("TODO: GET /api/v1/users?email=");
}

export async function findRecipientByNameOrEmail(_query: string): Promise<User | undefined> {
  throw new Error("TODO: GET /api/v1/users?role=recipient&q=");
}
