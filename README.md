# AWS SAA Quiz

A web app for studying the **AWS Certified Solutions Architect – Associate (SAA)** exam. Sign in with Google, work through a bank of **684 multiple-choice questions** one at a time, submit your answer, and immediately see whether you were right — with a per-option explanation. Your progress (score, answered questions, last position) is saved so you can pick up where you left off, and a searchable sidebar shows every question with its correct/wrong status.

## Live version

A deployed instance is available at:

**https://be-aws-saa-app--aws-saa-app-39b9c.europe-west4.hosted.app/**

> A Google account is required to sign in and use the app.

## Tech stack

- **React Router v8** (framework mode) + **React 19** + **TypeScript**
- **Vite** (build/dev) and **Vitest** (tests)
- **styled-components** for styling
- **Firebase** — Google Auth (server-verified session cookies) and Firestore for per-user progress
- Deployed on **Firebase App Hosting**

## Running in dev mode

Requirements: Node.js 20+ and npm.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# then fill in the Firebase credentials in .env

# 3. Start the dev server
npm run dev
```

The app runs at `http://localhost:5173` by default.

> Auth and progress need a Firebase project (Authentication with Google enabled, plus Firestore). Add the project's config to `.env` — see `.env.example` for the required keys.

### Other commands

| Command             | Description                                  |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Start the dev server                         |
| `npm run build`     | Production build                             |
| `npm run start`     | Serve the production build                   |
| `npm run typecheck` | Generate route types and run `tsc`           |
| `npm test`          | Run the test suite (Vitest)                  |
