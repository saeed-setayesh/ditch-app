import { createAppleClientSecretCached } from "@/lib/appleClientSecret";
import { PLATFORM_KEYS, settingTruthy } from "@/lib/platformSettings";

/** First non-empty trimmed env value among keys. */
function trimEnv(...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = process.env[k]?.trim();
    if (v) return v;
  }
  return undefined;
}

/**
 * OAuth client wiring: Admin UI (platform_setting / DB) OR classic env vars.
 * Env credentials imply “use OAuth even if DB toggle is off”, so deploy works without DB seeds.
 */
export function resolveGoogleOAuth(map: Map<string, string>): {
  active: boolean;
  clientId?: string;
  clientSecret?: string;
} {
  const dbEnabled = settingTruthy(map.get(PLATFORM_KEYS.OAUTH_GOOGLE_ENABLED));
  const dbId = map.get(PLATFORM_KEYS.OAUTH_GOOGLE_CLIENT_ID)?.trim();
  const dbSecret = map.get(PLATFORM_KEYS.OAUTH_GOOGLE_CLIENT_SECRET)?.trim();

  const envId = trimEnv(
    "AUTH_GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_ID",
    "AUTH_GOOGLE_ID",
  );
  const envSecret = trimEnv(
    "AUTH_GOOGLE_CLIENT_SECRET",
    "GOOGLE_CLIENT_SECRET",
  );

  const clientId = envId ?? dbId;
  const clientSecret = envSecret ?? dbSecret;

  const envForceEnable = settingTruthy(process.env.AUTH_GOOGLE_ENABLED);
  const credsFullyFromEnv = Boolean(envId && envSecret);
  const active =
    Boolean(clientId?.length && clientSecret?.length) &&
    (dbEnabled || envForceEnable || credsFullyFromEnv);

  return { active, clientId, clientSecret };
}

export function resolveMicrosoftOAuth(map: Map<string, string>): {
  active: boolean;
  clientId?: string;
  clientSecret?: string;
  issuer: string;
} {
  const dbEnabled = settingTruthy(map.get(PLATFORM_KEYS.OAUTH_MICROSOFT_ENABLED));
  const dbId = map.get(PLATFORM_KEYS.OAUTH_MICROSOFT_CLIENT_ID)?.trim();
  const dbSecret = map.get(PLATFORM_KEYS.OAUTH_MICROSOFT_CLIENT_SECRET)?.trim();
  const dbIssuer = map.get(PLATFORM_KEYS.OAUTH_MICROSOFT_ISSUER)?.trim();

  const envId = trimEnv(
    "AUTH_MICROSOFT_CLIENT_ID",
    "MICROSOFT_CLIENT_ID",
    "AZURE_AD_CLIENT_ID",
  );
  const envSecret = trimEnv(
    "AUTH_MICROSOFT_CLIENT_SECRET",
    "MICROSOFT_CLIENT_SECRET",
    "AZURE_AD_CLIENT_SECRET",
  );
  const envIssuer = trimEnv(
    "AUTH_MICROSOFT_ISSUER",
    "MICROSOFT_ISSUER",
  );

  const clientId = envId ?? dbId;
  const clientSecret = envSecret ?? dbSecret;
  const issuer =
    (envIssuer ?? dbIssuer)?.trim() ||
    "https://login.microsoftonline.com/common/v2.0/";

  const envForceEnable = settingTruthy(process.env.AUTH_MICROSOFT_ENABLED);
  const credsFullyFromEnv = Boolean(envId && envSecret);
  const active =
    Boolean(clientId?.length && clientSecret?.length) &&
    (dbEnabled || envForceEnable || credsFullyFromEnv);

  return { active, clientId, clientSecret, issuer };
}

type AppleMerged = {
  clientId?: string;
  manualSecret?: string;
  teamId?: string;
  keyId?: string;
  privateKey?: string;
};

function mergeAppleFields(map: Map<string, string>): AppleMerged {
  const envPemRaw = trimEnv("AUTH_APPLE_PRIVATE_KEY");
  let privateKey = envPemRaw ?? undefined;
  if (!privateKey && process.env.AUTH_APPLE_PRIVATE_KEY_BASE64) {
    try {
      privateKey = Buffer.from(
        process.env.AUTH_APPLE_PRIVATE_KEY_BASE64.trim(),
        "base64",
      ).toString("utf8");
    } catch {
      // ignore
    }
  }

  return {
    clientId:
      trimEnv("AUTH_APPLE_CLIENT_ID", "APPLE_CLIENT_ID") ??
      map.get(PLATFORM_KEYS.OAUTH_APPLE_CLIENT_ID)?.trim(),
    manualSecret:
      trimEnv("AUTH_APPLE_CLIENT_SECRET") ??
      map.get(PLATFORM_KEYS.OAUTH_APPLE_CLIENT_SECRET)?.trim(),
    teamId:
      trimEnv("AUTH_APPLE_TEAM_ID") ??
      map.get(PLATFORM_KEYS.OAUTH_APPLE_TEAM_ID)?.trim(),
    keyId:
      trimEnv("AUTH_APPLE_KEY_ID") ??
      map.get(PLATFORM_KEYS.OAUTH_APPLE_KEY_ID)?.trim(),
    privateKey:
      privateKey ??
      map.get(PLATFORM_KEYS.OAUTH_APPLE_PRIVATE_KEY)?.trim(),
  };
}

/** Apple client_secret: manual JWT string, or generated from .p8 via jose (server-only). */
export async function resolveAppleOAuthCredentials(
  map: Map<string, string>,
): Promise<{ clientId: string; clientSecret: string } | null> {
  const dbEnabled = settingTruthy(map.get(PLATFORM_KEYS.OAUTH_APPLE_ENABLED));
  const envForceEnable = settingTruthy(process.env.AUTH_APPLE_ENABLED);
  const envClientPrimed = Boolean(trimEnv("AUTH_APPLE_CLIENT_ID", "APPLE_CLIENT_ID"));

  const m = mergeAppleFields(map);
  const clientId = m.clientId?.trim();
  if (!clientId) return null;

  let clientSecret = m.manualSecret?.trim();
  if (
    !clientSecret &&
    m.teamId &&
    m.keyId &&
    m.privateKey &&
    clientId
  ) {
    try {
      clientSecret = await createAppleClientSecretCached({
        teamId: m.teamId,
        keyId: m.keyId,
        clientId,
        privateKeyPem: m.privateKey,
      });
    } catch (e) {
      console.error("[auth] Apple ES256 client secret failed:", e);
      return null;
    }
  }

  if (!clientSecret) return null;

  const ready =
    dbEnabled ||
    envForceEnable ||
    envClientPrimed ||
    Boolean(
      trimEnv("AUTH_APPLE_CLIENT_SECRET") ||
        (trimEnv("AUTH_APPLE_TEAM_ID") &&
          trimEnv("AUTH_APPLE_KEY_ID") &&
          (trimEnv("AUTH_APPLE_PRIVATE_KEY") ||
            process.env.AUTH_APPLE_PRIVATE_KEY_BASE64)),
    );

  if (!ready) return null;

  return { clientId, clientSecret };
}
