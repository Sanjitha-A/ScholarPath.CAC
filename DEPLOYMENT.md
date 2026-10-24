# Persistent API Deployment

This guide configures the Express API, MySQL database, and optional API-backed frontend. Without `VITE_API_URL`, the frontend uses browser-local demo storage; password reset is available only when the frontend is connected to the API.

ScholarPath uses an Express API and MySQL for persistent accounts, student profiles, and newsletters. GitHub Pages hosts the frontend; the API connects to a hosted MySQL server. MySQL Workbench is a client for administering that server, not the public database host.

## Local MySQL Workbench

Create a database named `scholarpath`, then create the `users` and `newsletters` tables using the SQL in the setup instructions. Create a least-privilege user named `scholarpath_app` and grant it access to this database. Set local `.env` values for `MYSQL_HOST=127.0.0.1`, `MYSQL_PORT=3306`, `MYSQL_USER=scholarpath_app`, `MYSQL_PASSWORD`, `MYSQL_DATABASE=scholarpath`, and `MYSQL_SSL=false`.

Run `npm run dev:server` to start the API. It creates or upgrades the tables and admin record at startup. The API stores password hashes in `password_hash`; it does not store plain-text passwords. Student fields such as ethnicity, gender, age, GPA, and AP count are stored in the `profile` JSON column.

## Public deployment

For a public website, create a hosted MySQL instance and a restricted database user there. Do not point Render at `localhost`; that would refer to Render's own machine. Set these as secrets/environment values on the API host:

- `NODE_ENV=production`
- `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, and `MYSQL_DATABASE`
- `MYSQL_SSL=true` and `MYSQL_SSL_CA` if the provider requires its CA
- `ADMIN_USERNAME=admin`
- `ADMIN_PASSWORD` to a unique password of at least 16 characters
- `SESSION_SECRET` to a random secret of at least 32 characters
- `ALLOWED_ORIGINS` and `PUBLIC_FRONTEND_URL` to the exact public frontend origin
- `RESEND_API_KEY` from Resend
- `EMAIL_FROM` using a sender address verified with Resend, such as `ScholarPath <accounts@example.com>`

Set `VITE_API_URL` in the frontend build environment to the API origin, without a trailing slash, then rebuild and redeploy the frontend. `PUBLIC_FRONTEND_URL` must be the frontend origin because reset links return there. Use the included `render.yaml` for the API template and set the health check path to `/api/health`. Configure the exact frontend origin in the API's allowed-origin values.

Password reset requests use a single-use token that expires after one hour. Resend must be configured with a verified sender before the API can deliver reset emails. The reset-request response does not disclose whether an account exists for an email address.

Test registration, login, profile save, logout, admin newsletter creation, persistence after restart, and restore from backup before sharing publicly. Never commit `.env` or database secrets. Publish a real privacy notice and review rules for collecting student profile information, including ethnicity and gender.
