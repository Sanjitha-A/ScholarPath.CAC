# ScholarPath

ScholarPath is a React + Vite application that helps students discover scholarships, understand financial-aid options, and organize the next steps in paying for college.

## What it includes

- Student profiles with academic background, interests, goals, and financial context
- Profile-based scholarship and financial-aid recommendations
- Saved scholarship opportunities and deadline/status tracking
- A funding roadmap with personalized tasks and completion progress
- A funding estimator for comparing expected costs and available support
- ScholarBot guidance for common scholarship and profile questions
- Account registration, sign-in, and password reset flows when the API is configured
- Responsive styling built with Tailwind CSS v4

## Tech stack

- React 19 and React DOM
- TypeScript
- Vite 8
- Tailwind CSS v4
- Express 5 API server
- MySQL support through `mysql2`
- Vitest tests

## Getting started

Requirements: Node.js 22.12 or newer and pnpm 12.6 or newer.

```bash
pnpm install
pnpm dev
```

Open the local Vite URL shown in the terminal. The development server is configured for the frontend only; the app can still be explored using browser-local demo storage.

Useful commands:

```bash
pnpm run build       # Create a production frontend build
pnpm run preview     # Preview the production build
pnpm run format      # Format the project with oxfmt
pnpm run dev:all     # Run the Vite frontend and Express API together
```

## Data and API modes

Without `VITE_API_URL`, ScholarPath runs in browser-only demo mode. Accounts, profiles, saved scholarships, roadmap progress, and estimator values are stored in the current browser's local storage. This data does not sync across devices and should not contain real sensitive information.

To connect the frontend to the Express API, copy `.env.example` to `.env` and set:

```env
VITE_API_URL=http://localhost:3001
```

The API also requires its server and database settings, including MySQL credentials, `SESSION_SECRET`, and the configured frontend origin. See [DEPLOYMENT.md](./DEPLOYMENT.md) for database setup, environment variables, and production deployment guidance.

For a static deployment, see [PUBLIC_DEPLOYMENT.md](./PUBLIC_DEPLOYMENT.md). Static hosting uses browser-local storage and does not provide secure cloud authentication or synchronization.

## Project structure

```text
src/
  App.tsx                 Main application UI and client-side flows
  index.css               Tailwind entrypoint and global styles
  main.tsx                React application entrypoint
  lib/auth.ts             Profile and account helpers
  lib/demoDatabase.ts     Browser-local demo API behavior
  lib/fundingRoadmap.ts   Roadmap task generation and progress logic
  lib/recommendations.ts  Scholarship and aid matching logic
server.js                 Optional Express API and MySQL integration
```

## Testing

Run the test suite with the project’s Vitest configuration:

```bash
pnpm exec vitest run
```

Tests currently cover authentication helpers, demo database behavior, recommendations, and funding-roadmap logic.

## Important note

ScholarPath provides educational planning and discovery support. Scholarship availability, eligibility, deadlines, and financial-aid rules can change. Students should verify details with each official provider and their school’s financial-aid office before applying or making financial decisions.
