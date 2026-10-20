# SIA ClearPass cloud deployment

## Proposed free setup

- Render Free Web Service for the Node.js + Vite app and API.
- TiDB Cloud Starter for a free-quota MySQL-compatible database (`DB_PORT=4000`, TLS enabled).

This is suitable for evaluation, not dependable production hosting. Render Free services sleep after 15 minutes without traffic and can take about a minute to wake. TiDB Starter has monthly free quotas; when exhausted, new connections are blocked until the quota resets or is changed. See the provider documentation before using real student records.

## Required account setup

1. Put this project in a GitHub repository and connect that repository to Render. Keep the repository private if it contains school-specific source or data. `.env` files are ignored by Git; never add database passwords to source control.
2. Create a TiDB Cloud Starter cluster. Use its public endpoint, TLS connection details, database username and password as Render environment variables. Keep the spending limit at zero to remain within the no-cost quota.
3. Import `mysql_schema.sql` into the new MySQL-compatible database before the first app startup. The server creates the admin `users` table if needed, but the clearance tables must already exist.
4. In Render, create a Blueprint from the repository and select `render.yaml`. Set the prompted database secrets and `ADMIN_USERNAME`, `ADMIN_PASSWORD` (unique, 8+ characters), `ADMIN_EMAIL`, and `CORS_ORIGINS` in the host's secret settings. The app creates the first Administrator account only if the `users` table contains no Administrator. Changing the env password later does not reset an existing account.
5. The first production launch intentionally has an empty student/personnel app state. Sign in as the configured admin and add accounts with unique temporary passwords of at least 12 characters. Test registration, login, account deletion, dashboard sync, and realtime signature updates from a phone on mobile data before importing real records.

## Public-data security gate

The backend now requires a server session token for API/realtime access, removes demo admin credentials, hashes passwords with scrypt (and upgrades legacy plaintext passwords after a successful login), rate-limits login attempts, and limits account provisioning/deletion APIs to Administrators. However, the current UI still synchronizes a shared whole-app state snapshot; it is not yet a strict per-student data-isolation model. Use only test records until that data model is replaced with per-role/per-user API queries and writes. Do not claim school-data production readiness based only on the hosting blueprint.
