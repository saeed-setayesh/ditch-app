import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DitchApp Accident Alert",
    short_name: "DitchApp",
    description:
      "Live traffic incidents for tow drivers in DitchApp. Get notified when accidents happen near you.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#E8F4FC",
    theme_color: "#1F6FB2",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
