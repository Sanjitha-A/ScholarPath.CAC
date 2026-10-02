# Public Deployment

ScholarPath runs as one web service: Express serves the built Vite app and the `/api` routes from the same origin. Deploy the included Dockerfile to a host that supports Docker and configure a persistent MySQL database separately. Do not expose MySQL publicly without network restrictions and TLS.

## Required environment

Set these as secret environment variables in the deployment provider, not in Git:

- `NODE_ENV=production`
- `PORT` to the port supplied by the host (if required)
- `VITE_API_URL` to the public API origin used by the web frontend (for example `https://api.example.com`)
- `ALLOWED_ORIGINS` to the allowed frontend domains, such as `https://app.example.com`
- `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, and `MYSQL_DATABASE`
- `MYSQL_SSL=true`; add `MYSQL_SSL_CA` if the provider requires its CA certificate
- `ADMIN_USERNAME=admin`
- `ADMIN_PASSWORD` to a unique password at least 16 characters long; `admin123` is rejected in production
- `SESSION_SECRET` to a random secret of at least 32 characters
- `TRUST_PROXY=1` when the host terminates HTTPS through one trusted proxy

The production API refuses to start without database credentials, MySQL TLS, and a strong admin password. Use a MySQL user scoped only to the `scholarpath` schema. The API creates/upgrades the two application tables at startup, so the DB account needs `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `CREATE`, and `ALTER` on that schema.

Generate a session secret locally with `openssl rand -hex 32`. Never commit `.env`, deployment secrets, or database backups.

## Build and run

The deployment host should build the image from the repository and run it with the environment variables above. The container exposes port `3001`; configure the provider to route public HTTPS traffic to that port. Set its health check to `GET /api/health`, which verifies the database connection too. Keep the web service and database in the same region when possible.

Run one application instance while using the default in-memory login/register rate limiter. Horizontal scaling requires a shared rate-limit store. The database must provide persistent storage and automated backups; ephemeral database containers are not suitable.

## Go-live checklist

- Configure HTTPS and a real public host name. The session cookie is `Secure` in production.
- Confirm the provider has persistent MySQL, TLS, backups, and an acceptable restore plan.
- Publish a real privacy notice and contact address, explain collection/use/retention of account and profile data, and review applicable rules for minors and sensitive demographic data (including ethnicity and gender). This repository cannot certify legal compliance or invent the service operator's policy.
- Test registration, login, profile save, logout, admin newsletter creation, restart persistence, and database restore against the hosted deployment before sharing it publicly.
- Use a unique production admin password; do not reuse the local development password.
