# Public deployment setup

This app is designed to deploy in two parts:

- GitHub Pages hosts the static frontend
- a separate backend host runs the Express API and keeps the database connection

## 1) Frontend on GitHub Pages

1. Push the repo to GitHub.
2. Open GitHub repository settings.
3. Go to Pages.
4. Set source to GitHub Actions.
5. The workflow in `.github/workflows/deploy-pages.yml` will build and deploy the site.

Set this repository secret:

- `VITE_API_URL=https://your-api-domain.com`

This should point to your deployed backend origin.

## 2) Backend on Render

Create a Render web service from this repository, or use the included `render.yaml` file.

Required environment variables:

- `NODE_ENV=production`
- `PORT=3001`
- `MYSQL_HOST=...`
- `MYSQL_PORT=3306`
- `MYSQL_USER=...`
- `MYSQL_PASSWORD=...`
- `MYSQL_DATABASE=...`
- `MYSQL_SSL=true`
- `ADMIN_USERNAME=admin`
- `ADMIN_PASSWORD=your-very-long-production-password`
- `SESSION_SECRET=your-long-random-session-secret`
- `ALLOWED_ORIGINS=https://your-github-pages-domain.com`
- `PUBLIC_FRONTEND_URL=https://your-github-pages-domain.com`

The backend will create the required MySQL tables automatically on startup.

## 3) Database

Use a managed MySQL service. Example providers:

- Railway MySQL
- PlanetScale
- Render MySQL
- a managed Azure/MySQL host

The database must be a real persistent MySQL instance; local SQLite or purely local-only storage is not enough for a public app.

## 4) How sign-in works in production

- The frontend sends auth requests to the public backend URL.
- The backend checks credentials against the MySQL users table.
- The backend creates a secure HTTP-only session cookie.
- Profile and newsletter data persist in MySQL.

## 5) Important

GitHub Pages cannot handle user login, session management, or database access directly. It is only the frontend host. The backend must remain on a separate public service.
