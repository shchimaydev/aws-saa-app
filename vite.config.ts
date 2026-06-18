import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [reactRouter()],
  // Expose PUBLIC_*-prefixed vars to client code via import.meta.env (in
  // addition to Vite's default VITE_*). Firebase web keys are public.
  envPrefix: ["VITE_", "PUBLIC_"],
  // styled-components is CJS; externalized in the SSR build its default export
  // resolves to the module namespace ("styled.main is not a function").
  // Bundling it for SSR applies correct interop.
  ssr: {
    noExternal: ["styled-components"],
  },
  resolve: {
    tsconfigPaths: true,
  },
});
