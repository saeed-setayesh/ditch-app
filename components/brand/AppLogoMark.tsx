"use client";

/** Live ping brand mark (Logo07): favicon/mark asset in `public/brand/live-ping-mark.svg`. */
export default function AppLogoMark({
  className,
  size = 36,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <img
      src="/brand/live-ping-mark.svg"
      alt=""
      width={size}
      height={size}
      decoding="async"
      className={["pointer-events-none select-none shrink-0", className].filter(Boolean).join(" ")}
      aria-hidden
    />
  );
}
