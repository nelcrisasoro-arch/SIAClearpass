# SIA ClearPass cloud deployment

## Proposed free setup

- Render Free Web Service for the Node.js + Vite app and API.
- TiDB Cloud Starter for a free-quota MySQL-compatible database (`DB_PORT=4000`, TLS enabled).

This is suitable for evaluation, not dependable production hosting. Render Free services sleep after 15 minutes without traffic and can take about a minute to wake. TiDB Starter has monthly free quotas; when exhausted, new connections are blocked until the quota resets or is changed. See the provider documentation before using real student records.

## Required account setup

1. Put this project in a GitHub repository and connect that repository to Render. Keep the repository private if it contains school-specific source or data. `.env` files are ignored by Git; never add database passwords to source control.
2. Create a TiDB Cloud Starter cluster. Use its public endpoint, TLS connection details, database username and password as Render environment variables. Keep the spending limit at zero to remain within the no-cost quota.
3. Import a MySQL-compatible schema before connecting the app. `database_schema.sql` is PostgreSQL-specific, while `mysql_schema.sql` is not a schema (it only queries `personnel`). The app's MySQL tables and fields therefore need to be reconciled before account creation/signatures can persist in cloud MySQL.
4. In Render, create a Blueprint from the repository and select `render.yaml`. Set the prompted `DB_HOST`, `DB_USER`, and `DB_PASSWORD` values in Render's secret environment settings. Do not put credentials in chat or commit them.
5. Once deployed, test `/api/health`, admin login, an admin-created test account, and a signature update from a phone on mobile data. Replace demo data with real data only after authentication and database permissions are reviewed.

## Public-data security gate

The current `/api/state` endpoint reads and replaces the full application state without an authenticated session. Do not publish real student/personnel data until this API and the other write routes enforce role-based authentication. The Render blueprint only prepares hosting; it does not make the existing API safe for public school data.
