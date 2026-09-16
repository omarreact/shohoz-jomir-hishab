import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LandBD — সহজ জমির হিসাব",
    short_name: "LandBD",
    description: "বাংলাদেশের জমি, খতিয়ান, ফারায়েজ ও মানচিত্রভিত্তিক ভূমি তথ্যের ডিজিটাল সহায়ক।",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7f9f8",
    theme_color: "#006A3D",
    lang: "bn-BD",
    dir: "ltr",
    icons: [
      { src: "/brand/landbd-symbol.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/brand/landbd-symbol.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
