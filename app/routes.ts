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
] satisfies RouteConfig;
