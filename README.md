# Life RPG

A self-improvement gamification app where you create a character and track your personal stats across 6 dimensions: Physique, Intelligence, Spirituality (Balance), Sociality, Success (Economic), and Ego (Self-Esteem).

## Project Structure

```
gamification-app/
├── backend/      # Node.js + Express REST API (TypeScript)
└── frontend/     # Angular 21 standalone app (TypeScript)
```

## Tech Stack

- **Backend**: Node.js, Express.js, TypeScript, better-sqlite3, bcrypt, jsonwebtoken, zod
- **Frontend**: Angular 21, TypeScript, Standalone Components, Reactive Forms, Angular Signals
- **Database**: SQLite (dev), Postgres-ready
- **Auth**: JWT + bcrypt password hashing
- **Design**: Dark RPG theme, sci-fi fonts (Orbitron, Rajdhani), SVG hexagon stats visualization

## Setup & Launch

### Docker VPS Deployment

Install Docker and Docker Compose on the VPS, then from the repository root:

```bash
cp .env.example .env
```

Set a long random `JWT_SECRET` and the email of the account that should be an admin in `.env`. Create that account through the app, then start the stack:

```bash
docker compose up -d --build
```

The app is available at `http://your-server-ip` (or the port configured by `APP_PORT`). SQLite is stored in the persistent `life-rpg-data` Docker volume. The backend is not exposed publicly; Nginx proxies `/api` to it internally.

To inspect deployment logs or stop the stack:

```bash
docker compose logs -f
docker compose down
```

### Admin Database Inspector

Admins can open `/admin` from the profile page. It displays the SQLite tables, columns, and up to 500 rows per table in read-only mode. Password hashes are never returned by the endpoint. Admin access is enforced by the backend using the `users.is_admin` flag; setting `ADMIN_EMAIL` promotes the matching account on backend startup. Log out and back in after changing admin configuration so the client receives a fresh token.

### Backend Setup

```bash
cd backend
```
```bash
npm install
```
```bash
cp .env.example .env
```
   - Default `JWT_SECRET` is suitable for local development
   - Default `PORT` is 3000
```bash
npm run dev
```

You should see:
```
🚀 Life RPG backend running on http://localhost:3000
```

The backend will:
- Initialize SQLite database with schema (users, profiles tables)
- Create API endpoints at `/api/auth` and `/api/profile`
- Accept CORS requests from `http://localhost:4200` (frontend)

### Frontend Setup

1. In a **new terminal**, navigate to the frontend directory:
```bash
cd frontend
```
```bash
npm install
```
```bash
ng serve
```
```
http://localhost:4200
```

## App Flow

1. **Landing** → Redirects to `/profile` (or `/login` if not authenticated)
2. **Sign Up** (`/register`) → Create account + display name → Auto-login → Redirect to onboarding
3. **Onboarding** (`/onboarding`) → Rate your 6 stats (1–10 scale) → Submit → Redirect to profile
4. **Profile** (`/profile`) → View character + stats hexagon on deep-space background
   - Stats stored as 0–100 (1–10 input × 10)
   - SVG hexagon renders all 6 stats in a radar/spider chart
   - Glowing neon aesthetic (Orbitron + Rajdhani sci-fi fonts)

## Features (v1)

✅ Email/password authentication (JWT)  
✅ User accounts + profiles  
✅ Onboarding questionnaire (6 free 1–10 scale inputs)  
✅ Profile page with 6-stat hexagon visualization  
✅ Dark RPG theme with deep-space background  
✅ Persistent session (localStorage)  
✅ Auth guards + interceptor  
✅ SQLite database (ready for Postgres migration)

## API Endpoints

### Auth
- `POST /api/auth/register` → `{ email, password, displayName }` → `{ token, userId, email }`
- `POST /api/auth/login` → `{ email, password }` → `{ token, userId, email }`

### Profile (all require Bearer token)
- `GET /api/profile` → `{ displayName, physique, intelligence, spirituality, sociality, success, ego, onboarded }`
- `PUT /api/profile/stats` → `{ physique?, intelligence?, ... }` (0–100) → `{ success: true }`
- `POST /api/profile/onboarding` → `{ physique, intelligence, ..., ego }` (0–100) → marks `onboarded=1`

## Database Schema

### users
```sql
id (INTEGER PRIMARY KEY)
email (TEXT UNIQUE)
password_hash (TEXT)
is_admin (INTEGER, default 0)
created_at (DATETIME)
```

### profiles
```sql
user_id (INTEGER PRIMARY KEY FK)
display_name (TEXT)
physique, intelligence, spirituality, sociality, success, ego (INTEGER, default 0)
onboarded (INTEGER, default 0)
```

## Development

### Making Changes

**Backend**:
- Edit files in `backend/src/`
- Dev server auto-restarts via `tsx watch`
- Restart manually if issues occur

**Frontend**:
- Edit files in `frontend/src/app/`
- Dev server auto-recompiles on save
- Page auto-refreshes

### Building for Production

**Backend**:
```bash
cd backend
npm run build
npm run start
```

**Frontend**:
```bash
cd frontend
ng build --configuration production
```

Output goes to `frontend/dist/`

## Troubleshooting

**Frontend won't start**
- Ensure backend is running on `http://localhost:3000`
- Check browser console for CORS errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`

**Backend won't start**
- Ensure port 3000 is not in use: `lsof -i :3000`
- Check `.env` file exists and `JWT_SECRET` is set
- Delete `life_rpg.db` to reset database

**Auth errors**
- Token expires every 7 days; login again
- Clear localStorage if stuck in logged-out state: `localStorage.clear()`

## Future Enhancements

- [ ] Edit stats UI in profile page
- [ ] Quests/tasks with XP rewards
- [ ] Skill tree and progression
- [ ] Achievement badges
- [ ] Social features (leaderboards, friend stats)
- [ ] Mobile app (React Native)
- [ ] Postgres migration
- [ ] Admin dashboard

## License

MIT

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
