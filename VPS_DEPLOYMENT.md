# Life RPG VPS Deployment

This guide deploys Life RPG with Docker Compose:

- Frontend: Angular served by Nginx on port 80
- Backend: Node.js API on the private Docker network
- Database: SQLite in a persistent Docker volume

## 1. Prepare the VPS

Use an Ubuntu/Debian VPS with a domain pointing to its public IP.

Install Git, Docker, and the Compose plugin:

```bash
sudo apt update
sudo apt install -y git docker.io docker-compose-plugin
sudo systemctl enable --now docker
```

Optional: allow the current user to run Docker without `sudo`:

```bash
sudo usermod -aG docker "$USER"
```

Log out and back in after running that command.

Allow SSH, HTTP, and HTTPS through the firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 2. Clone the repository

```bash
git clone <repository-url> gamification-app
cd gamification-app
```

Replace `<repository-url>` with the repository's Git URL.

## 3. Apply the SQLite persistence fix

The Compose file mounts `/app/data`, so the backend must read its database path from `DB_PATH`.

In `backend/src/db.ts`, make sure the database path is defined like this:

```ts
const dbPath = process.env.DB_PATH ||
  path.join(__dirname, '..', 'life_rpg.db');
```

Without this change, the database is created outside the mounted volume and can be lost when the backend container is recreated.

If you changed the source file, rebuild the image during the launch step below.

## 4. Configure environment variables

Create a root `.env` file. The root Compose file reads it from the repository root:

```bash
nano .env
```

Add:

```env
JWT_SECRET=replace-with-a-long-random-secret
ADMIN_EMAIL=your-email@example.com
APP_PORT=80
```

Generate a secure JWT secret with:

```bash
openssl rand -base64 48
```

Replace the placeholder value. Do not commit `.env` to Git.

`ADMIN_EMAIL` is used by the backend to promote the matching account to admin on startup. Register that email through the app (or use an existing account with that email), then log in again after deployment/configuration changes.

## 5. Start the application

From the repository root:

```bash
docker compose up -d --build
```

Check container status:

```bash
docker compose ps
```

View logs:

```bash
docker compose logs -f
```

Open the application at:

```text
http://your-domain.example
```

or use the VPS IP address if DNS is not configured yet.

## 6. Verify the deployment

Check the backend health endpoint through the frontend Nginx proxy:

```bash
curl http://your-domain.example/health
```

Expected response:

```json
{"status":"ok"}
```

Then verify the user flow in a browser:

1. Open the application.
2. Create an account at `/register`.
3. Complete the six onboarding stat sliders.
4. Confirm the profile hexagon appears.
5. Log out and log back in.
6. Confirm the profile remains available after a page refresh.

## 7. Enable HTTPS

The included frontend Nginx container serves HTTP. For production, place a TLS reverse proxy in front of the Compose stack, or update the deployment to use a tool such as Caddy, Traefik, or a host-level Nginx installation.

At minimum:

- Point the domain's DNS A record to the VPS.
- Redirect HTTP traffic to HTTPS.
- Obtain a Let's Encrypt certificate.
- Keep the backend private; do not publish port 3000 publicly.

The existing `frontend/nginx.conf` already proxies `/api/` and `/health` to the internal `backend:3000` service.

## 8. Updating the application

From the repository root:

```bash
git pull
docker compose up -d --build
```

Inspect the latest logs:

```bash
docker compose logs --tail=100
```

The SQLite data remains in the `life-rpg-data` Docker volume when containers are rebuilt.

## 9. Backup the database

Create a compressed backup of the named volume:

```bash
docker run --rm \
  -v gamification-app_life-rpg-data:/data:ro \
  -v "$PWD":/backup \
  alpine \
  tar czf /backup/life-rpg-data-$(date +%Y%m%d-%H%M%S).tar.gz -C /data .
```

The volume name may differ if the Compose project directory has a different name. Check it with:

```bash
docker volume ls
```

## 10. Stop or reset the application

Stop containers without deleting database data:

```bash
docker compose down
```

To permanently delete the database volume as well, use this only when you intend to reset all accounts and profiles:

```bash
docker compose down -v
```

## Troubleshooting

### Containers do not start

```bash
docker compose config
sudo systemctl status docker
```

`docker compose config` reports missing or invalid environment variables.

### Frontend cannot reach the API

```bash
docker compose logs backend frontend
curl http://localhost/health
```

Confirm that the frontend uses relative `/api` requests in production and that the backend container is healthy.

### Database data disappeared

Confirm that `backend/src/db.ts` uses `process.env.DB_PATH` and that the Compose volume is mounted at `/app/data`:

```bash
docker compose config
```

### Port 80 is already in use

Choose another host port in `.env`:

```env
APP_PORT=8080
```

Then access the app at `http://your-domain.example:8080`, or configure a host-level reverse proxy to forward ports 80/443 to that port.
