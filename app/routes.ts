import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index/index.tsx"),
  route("login", "routes/login/index.tsx"),
  route("auth/session", "routes/auth.session/index.tsx"),
  route("logout", "routes/logout/index.tsx"),
  route("quiz", "routes/quiz/layout/index.tsx", [
    route(":num", "routes/quiz/quiz.$num/index.tsx"),
    route("complete", "routes/quiz/quiz.complete/index.tsx"),
  ]),
  // Resource route for the sidebar's infinite scroll (no layout chrome).
  route("quiz/api/sidebar", "routes/quiz/api.sidebar/index.tsx"),

  // Generated mock-exam ("Generate Test") flow, mirroring the quiz block.
  route("test/generate", "routes/test/generate/index.tsx"), // action-only
  route("test/:testId/reset", "routes/test/reset/index.tsx"), // action-only
  route("test/:testId/retry-wrong", "routes/test/retry-wrong/index.tsx"), // action-only
  route("test", "routes/test/index/index.tsx"), // redirect → latest test
  route("test/:testId", "routes/test/layout/index.tsx", [
    route(":num", "routes/test/test.$num/index.tsx"),
    route("complete", "routes/test/test.complete/index.tsx"),
  ]),
  route("test/:testId/api/sidebar", "routes/test/api.sidebar/index.tsx"),
] satisfies RouteConfig;
