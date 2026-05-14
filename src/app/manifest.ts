import type { MetadataRoute } from "next";
import { APP_NAME } from "@/lib/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description:
      "Turn long school notes into calendar items, tasks, and prep lists.",
    start_url: "/calendar",
    display: "standalone",
    background_color: "#f7f2ea",
    theme_color: "#f7f2ea",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
