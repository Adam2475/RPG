# JWT Secret Configuration and Rotation

This checklist explains where the JWT signing secret is configured for local development and Docker/VPS deployment. The secret must be private, stable between restarts, and identical for signing and verifying tokens. Do not put a real secret in source code, commit it, or paste it into chat.

## Files involved

- `backend/src/auth.ts` reads `process.env.JWT_SECRET` for both token creation and verification. It currently has a development fallback; always set `JWT_SECRET` explicitly, especially in production.
- `backend/src/index.ts` loads `backend/.env` for local development through `dotenv/config`.
- `backend/.env` is the local backend environment file. It is not the environment file Docker Compose reads.
- `backend/.env.example` is the corrected local-development template. It contains placeholders only.
- `.env` in the repository root is the Docker Compose environment file on the VPS. Compose reads the `JWT_SECRET` value from here.
- `.env.example` in the repository root is the Docker/VPS template.
- `docker-compose.yml` requires the root `JWT_SECRET` and injects it into the backend container. No secret value should be written directly into this YAML file.

## Local development: configure or rotate the key

1. From the repository root, create the local backend environment file if it does not exist:

   ```sh
   cp backend/.env.example backend/.env
   ```

2. Generate a strong random secret locally. For example:

   ```sh
   openssl rand -hex 48
   ```

3. Put the generated value after `JWT_SECRET=` in `backend/.env`. Keep the quotes off unless the value requires them. Do not edit `backend/.env.example` with a real secret.
4. Restart the backend from the repository root using `npm --prefix backend run dev`, or change directory to `backend/` before running `npm run dev`.
5. Sign in again in the app. Changing the secret invalidates all JWTs signed with the previous key.

## Docker/VPS: configure or rotate the key

1. On the VPS, change to the repository directory containing `docker-compose.yml`.
2. Create the Compose environment file if needed:

   ```sh
   cp .env.example .env
   ```

3. Generate a strong random secret on the VPS (the OpenSSL command above is suitable) and set it as `JWT_SECRET` in this root `.env`. Set `ADMIN_EMAIL` there as well, and optionally set `APP_PORT`.
4. Keep the root `.env` private and out of version control. The checked-in `.env.example` should contain placeholders only.
5. Apply the setting by recreating the backend container:

   ```sh
   docker compose up -d --force-recreate backend
   ```

   Use `docker compose up -d --build` instead when backend source or its image needs rebuilding too.
6. Verify the deployment without printing secrets:

   ```sh
   docker compose ps
   docker compose logs --tail=100 backend
   ```

7. Sign in again in the app. A key rotation immediately makes every existing token invalid, so users (including the admin) must authenticate again.

## If authentication still uses the old key

- Confirm you edited the environment file that matches the run mode: `backend/.env` for local development, or repository-root `.env` for Docker Compose.
- Confirm the Compose command was run from the directory containing `docker-compose.yml`.
- Recreate/restart the backend after changing the environment value. Editing `.env` alone does not change an already-running process.
- Do not run `npm start` from the repository root; that directory has no backend `package.json`. Use `npm --prefix backend start` from the repository root, or run `npm start` after changing into `backend/`.
- Remove the browser's saved `auth_token` or log out and log back in after rotation.
