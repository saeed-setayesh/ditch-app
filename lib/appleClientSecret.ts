import { SignJWT, importPKCS8 } from "jose";

let cache: { key: string; secret: string; exp: number } | null = null;

/** Apple Sign In client_secret is a short-lived ES256 JWT signed with the .p8 key. */
export async function createAppleClientSecretCached(params: {
  teamId: string;
  clientId: string;
  keyId: string;
  privateKeyPem: string;
}): Promise<string> {
  const cacheKey = `${params.teamId}:${params.clientId}:${params.keyId}`;
  const now = Date.now();
  if (cache && cache.key === cacheKey && cache.exp > now + 60_000) {
    return cache.secret;
  }

  const pem = params.privateKeyPem.includes("BEGIN")
    ? params.privateKeyPem.trim()
    : params.privateKeyPem.replace(/\\n/g, "\n").trim();

  const key = await importPKCS8(pem, "ES256");
  const secret = await new SignJWT({})
    .setAudience("https://appleid.apple.com")
    .setIssuer(params.teamId)
    .setSubject(params.clientId)
    .setIssuedAt()
    .setExpirationTime(Math.floor(now / 1000) + 86400 * 150)
    .setProtectedHeader({ alg: "ES256", kid: params.keyId })
    .sign(key);

  cache = { key: cacheKey, secret, exp: now + 23 * 60 * 60 * 1000 };
  return secret;
}
