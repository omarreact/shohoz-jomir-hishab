import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { imagesOptimizer } from "@vinext/cloudflare/images/images-optimizer";

export default defineConfig({
  // Workers disallow new Function() during requests. Prefer the Firestore web
  // SDK entry in SSR to avoid its Node/gRPC protobuf codegen path. This only
  // affects vinext builds; Next/Vercel keep their existing resolver.
  ssr: {
    resolve: {
      conditions: ["browser", "module", "development|production"],
    },
  },
  plugins: [
    vinext({
      images: { optimizer: imagesOptimizer() },
    }),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
