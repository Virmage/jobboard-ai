import { cookies } from "next/headers";

// ---------------------------------------------------------------------------
// JWT-like session tokens using Web Crypto (no external deps)
// ---------------------------------------------------------------------------

const COOKIE_NAME = "employer_session";
const TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");
  return new TextEncoder().encode(secret);
}

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    getSecret().buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

interface SessionPayload {
  employerId: string;
  email: string;
  exp: number;
}

export async function signToken(payload: Omit<SessionPayload, "exp">): Promise<string> {
  const key = await getKey();
  const data: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL,
  };
  const encoded = btoa(JSON.stringify(data));
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(encoded),
  );
  const sigHex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${encoded}.${sigHex}`;
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const [encoded, sigHex] = token.split(".");
    if (!encoded || !sigHex) return null;

    const key = await getKey();
    const sigBytes = new Uint8Array(
      sigHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)),
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(encoded),
    );
    if (!valid) return null;

    const payload: SessionPayload = JSON.parse(atob(encoded));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(employerId: string, email: string): Promise<void> {
  const token = await signToken({ employerId, email });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: TOKEN_TTL,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
