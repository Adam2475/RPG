# Database Navigation Instructions

This backend uses SQLite and stores its database in `backend/life_rpg.db`.

## Open the database locally

If you have the SQLite CLI installed:

```bash
cd /home/adam/Desktop/gamification-app/backend
sqlite3 life_rpg.db
```

Inside the SQLite shell, use:

```sql
-- List all tables
.tables

-- Show schema for a table
.schema users
.schema profiles

-- Run a query
SELECT * FROM users LIMIT 10;
SELECT * FROM profiles LIMIT 10;
```

Exit the shell with:

```sql
.exit
```

## Common queries

```sql
-- Find a user by email
SELECT * FROM users WHERE email = 'user@example.com';

-- Find a profile by user ID
SELECT * FROM profiles WHERE user_id = 1;

-- Join users with profiles
SELECT u.id, u.email, p.display_name, p.physique, p.intelligence
FROM users u
JOIN profiles p ON p.user_id = u.id
LIMIT 20;
```

## Tables used by the app

- `users`
  - `id` INTEGER PRIMARY KEY
  - `email` TEXT UNIQUE
  - `password_hash` TEXT
  - `created_at` DATETIME

- `profiles`
  - `user_id` INTEGER PRIMARY KEY
  - `display_name` TEXT
  - `physique`, `intelligence`, `spirituality`, `sociality`, `success`, `ego` INTEGER
  - `onboarded` INTEGER

## Notes

- The backend enables foreign keys in `db.ts` with `PRAGMA foreign_keys = ON`.
- The database file is created automatically when the server runs if it does not already exist.
- If you need a graphical viewer, use a SQLite browser such as `DB Browser for SQLite`.
