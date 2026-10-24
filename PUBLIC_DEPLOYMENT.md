# ScholarPath Standalone Deployment

The Vercel standalone build is a static Vite app. It makes no API requests and stores accounts, profiles, roadmap progress, saved scholarships, and estimator values in the current browser's local storage. Data does not sync between browsers or devices and can be erased when browser site data is cleared. This is not secure authentication or cloud storage. Do not enter real student, financial, or other sensitive information.

## Deploy on Vercel

1. Import this GitHub repository into Vercel.
2. Use the Vite framework preset, `pnpm run build` as the build command, and `dist` as the output directory. These settings are also in `vercel.json`.
3. No API URL, database credentials, or environment variables are required for the standalone app.
4. Deploy and open the generated `vercel.app` URL. Register an account in that browser to try the app.

There is no preloaded admin account in standalone mode. Browser-side roles cannot be secured, so admin newsletter publishing is disabled. Previously saved admin accounts are downgraded on load.

For persistent, private accounts shared across devices, deploy the Express API and MySQL database using the separate production checklist in `DEPLOYMENT.md`. A static Vercel deployment alone cannot provide that storage or authentication.
