import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  accountId: "815dd6892edc628128dc65a992086cf9",
  worker: defineWorker({
    name: "landbd-vinext-stage",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-29",
    compatibilityFlags: ["nodejs_compat"],
    workersDev: true,
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      LANDBD_PLATFORM: bindings.text("cloudflare-workers"),
      LANDBD_ENV: bindings.text("staging"),
      NEXTJS_ENV: bindings.text("production"),
      LAND_EXPORT_STORAGE_PROVIDER: bindings.text("cloudflare"),
      LANDBD_FILES: bindings.r2({ name: "landbd-vinext-stage-files" }),
      IMAGES: bindings.images(),
    },
  }),
});
