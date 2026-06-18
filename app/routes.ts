import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("login", "routes/login.tsx"),
  route("auth/session", "routes/auth.session.tsx"),
  route("logout", "routes/logout.tsx"),
  route("quiz", "routes/quiz/layout.tsx", [
    route(":num", "routes/quiz/quiz.$num.tsx"),
    route("complete", "routes/quiz/quiz.complete.tsx"),
  ]),
] satisfies RouteConfig;
