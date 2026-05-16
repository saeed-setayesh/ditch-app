import { NextResponse } from "next/server";
import {
  loadPlatformSettingsMap,
  PLATFORM_KEYS,
  settingTruthy,
} from "@/lib/platformSettings";

export const dynamic = "force-dynamic";

/** Which OAuth buttons to show on /login (no secrets exposed). */
export async function GET() {
  const map = await loadPlatformSettingsMap();

  const googleOk =
    settingTruthy(map.get(PLATFORM_KEYS.OAUTH_GOOGLE_ENABLED)) &&
    Boolean(
      map.get(PLATFORM_KEYS.OAUTH_GOOGLE_CLIENT_ID)?.trim() &&
        map.get(PLATFORM_KEYS.OAUTH_GOOGLE_CLIENT_SECRET)?.trim(),
    );

  const appleId = map.get(PLATFORM_KEYS.OAUTH_APPLE_CLIENT_ID)?.trim();
  const appleManualSecret = map
    .get(PLATFORM_KEYS.OAUTH_APPLE_CLIENT_SECRET)
    ?.trim();
  const applePem = map.get(PLATFORM_KEYS.OAUTH_APPLE_PRIVATE_KEY)?.trim();
  const appleTeam = map.get(PLATFORM_KEYS.OAUTH_APPLE_TEAM_ID)?.trim();
  const appleKeyId = map.get(PLATFORM_KEYS.OAUTH_APPLE_KEY_ID)?.trim();
  const appleOk =
    settingTruthy(map.get(PLATFORM_KEYS.OAUTH_APPLE_ENABLED)) &&
    Boolean(
      appleId &&
        (appleManualSecret ||
          (appleTeam && appleKeyId && applePem)),
    );

  const microsoftOk =
    settingTruthy(map.get(PLATFORM_KEYS.OAUTH_MICROSOFT_ENABLED)) &&
    Boolean(
      map.get(PLATFORM_KEYS.OAUTH_MICROSOFT_CLIENT_ID)?.trim() &&
        map.get(PLATFORM_KEYS.OAUTH_MICROSOFT_CLIENT_SECRET)?.trim(),
    );

  return NextResponse.json({
    google: googleOk,
    apple: appleOk,
    microsoftEntraId: microsoftOk,
  });
}
