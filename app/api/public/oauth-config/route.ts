import { NextResponse } from "next/server";
import { loadPlatformSettingsMap } from "@/lib/platformSettings";
import {
  resolveAppleOAuthCredentials,
  resolveGoogleOAuth,
  resolveMicrosoftOAuth,
} from "@/lib/oauthCredentialResolution";

export const dynamic = "force-dynamic";

/** Which OAuth buttons to show on /login (no secrets exposed). */
export async function GET() {
  const map = await loadPlatformSettingsMap();

  const google = resolveGoogleOAuth(map);
  const microsoft = resolveMicrosoftOAuth(map);
  const apple = await resolveAppleOAuthCredentials(map);

  return NextResponse.json({
    google: google.active,
    apple: Boolean(apple),
    microsoftEntraId: microsoft.active,
  });
}
