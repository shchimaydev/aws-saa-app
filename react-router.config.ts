import type { Config } from "@react-router/dev/config";

export default {
  // Server-side render by default; set to `false` for SPA mode.
  ssr: true,
  // Firebase App Hosting serves on a public *.hosted.app CDN domain but proxies
  // to an internal *.run.app host, so the request `Origin` never matches
  // `request.url` host. Without this, React Router's action CSRF guard rejects
  // every POST (sign-in, submit, restart) with "Bad Request". Allowlist the
  // public domain(s). Add any custom domains you map to the backend here too.
  allowedActionOrigins: [
    "be-aws-saa-app--aws-saa-app-39b9c.europe-west4.hosted.app",
    "**.hosted.app",
  ],
} satisfies Config;
