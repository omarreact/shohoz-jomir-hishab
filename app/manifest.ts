import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "সহজ জমির হিসাব",
    short_name: "জমির হিসাব",
    description: "বাংলাদেশের জমি, খতিয়ান ও ফারায়েজ হিসাবের অফলাইন-সক্ষম টুল।",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#006a4e",
    lang: "bn-BD",
    dir: "ltr",
  };
}
