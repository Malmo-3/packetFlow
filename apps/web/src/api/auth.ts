/**
 * Auth API
 *
 * BACKEND CONTRACT:
 *   POST /api/v1/auth/register    body: SignUpInput              -> { user, token }
 *   POST /api/v1/auth/login       body: { email, password }      -> { user, token }
 *   POST /api/v1/auth/carrier     body: CarrierSignupInput       -> { user, token }
 *   POST /api/v1/auth/logout                                     -> 204
 *   GET  /api/v1/auth/me                                         -> { user }
 */

import type { User } from "@packetflow/types";
import type { CarrierSignupInput, SignUpInput } from "@packetflow/types";

export interface AuthResult {
  user: User;
  token: string;
}

export async function login(_email: string, _password: string): Promise<AuthResult> {
  throw new Error("TODO: POST /api/v1/auth/login");
}

export async function register(_input: SignUpInput): Promise<AuthResult> {
  throw new Error("TODO: POST /api/v1/auth/register");
}

export async function registerCarrier(_input: CarrierSignupInput): Promise<AuthResult> {
  throw new Error("TODO: POST /api/v1/auth/carrier");
}

export async function logout(): Promise<void> {
  throw new Error("TODO: POST /api/v1/auth/logout");
}

export async function me(): Promise<User | null> {
  throw new Error("TODO: GET /api/v1/auth/me");
}
