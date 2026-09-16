import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

export const ADMIN_COOKIE_NAME = "ask_me_admin_session";
const SESSION_SECONDS = 8 * 60 * 60;
const MINIMUM_SECRET_LENGTH = 16;

function configuredSecret() {
  const secret = process.env.ASK_ME_ADMIN_SECRET?.trim();
  return secret && secret.length >= MINIMUM_SECRET_LENGTH ? secret : null;
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function signature(expiresAt: string, secret: string) {
  return createHmac("sha256", secret).update(`admin:${expiresAt}`).digest("base64url");
}

export function isAdminSecretConfigured() {
  return configuredSecret() !== null;
}

export function validateAdminSecret(candidate: unknown) {
  const secret = configuredSecret();
  return typeof candidate === "string" && secret !== null && safeEqual(candidate, secret);
}

export function createAdminSessionToken() {
  const secret = configuredSecret();
  if (!secret) throw new Error("ASK_ME_ADMIN_SECRET is not configured.");

  const expiresAt = String(Date.now() + SESSION_SECONDS * 1_000);
  return `${expiresAt}.${signature(expiresAt, secret)}`;
}

export function verifyAdminSessionToken(token: string | undefined) {
  const secret = configuredSecret();
  if (!secret || !token) return false;

  const [expiresAt, candidateSignature, extra] = token.split(".");
  const expiration = Number(expiresAt);
  if (
    !expiresAt ||
    !/^\d+$/.test(expiresAt) ||
    !Number.isSafeInteger(expiration) ||
    !candidateSignature ||
    extra ||
    expiration <= Date.now()
  ) {
    return false;
  }
  return safeEqual(candidateSignature, signature(expiresAt, secret));
}

export async function hasAdminSession() {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

export function isAuthorizedAdminRequest(request: NextRequest) {
  return verifyAdminSessionToken(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
}

export function setAdminSessionCookie(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE_NAME, createAdminSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    priority: "high",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}
