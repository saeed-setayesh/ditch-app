/**
 * Driver-visible wording combining drive-time ETA with incident freshness confidence.
 * Not a probability model — labels stay transparent about data quality.
 */
export function describeEtaShot(
  etaMinutes: number | null | undefined,
  confidence?: "high" | "medium" | "low",
): { line: string; toneClass: string } | null {
  if (etaMinutes == null || etaMinutes < 0 || !Number.isFinite(etaMinutes))
    return null;
  const c = confidence ?? "medium";
  if (c === "high" && etaMinutes <= 18) {
    return { line: "Strong arrival window", toneClass: "text-deep" };
  }
  if (c === "high") {
    return { line: "Solid ETA signal", toneClass: "text-deep/90" };
  }
  if (c === "medium") {
    return { line: "Fair ETA signal", toneClass: "text-muted" };
  }
  return { line: "Treat ETA as indicative", toneClass: "text-muted italic" };
}
