# ScholarPath Demo Deployment

This version is for demonstration only. The app uses a fake browser-local database and makes no API requests. Each browser has its own isolated accounts, profiles, and newsletters; clearing that browser's site data resets the demo. Do not enter real student or personal information.

## Deploy on Vercel

1. Import the GitHub repository into Vercel.
2. Keep the detected Vite framework settings. The included `vercel.json` sets the build command to `pnpm run build` and output directory to `dist`.
3. Deploy. No API URL, database credentials, or environment variables are required for this demo.

Only a demo admin account is preloaded so the newsletter manager can be shown:

- Username: `admin`
- Password: `ScholarPathAdminDemo2026!`

No student accounts or newsletters are preloaded. Use **Get started** to register a student account, then log in with the credentials you created. Accounts and profile edits are stored only in the current browser. This is not secure authentication or shared cloud storage and must not be used for real accounts.

For a later production release with the MySQL API, use the separate checklist in `DEPLOYMENT.md` and replace the demo store with the hosted API configuration.
