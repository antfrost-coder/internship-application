# Internship Application (IAp)

Web platform that connects **students**, **companies** and **school staff** around internships: students search and apply to offers, recruiters publish offers and manage applications, school staff follow each student's internship search, and administrators manage accounts.

The product is specified in [`docs/`](docs): `BRD.pdf` (why), `SRS.pdf` (what) and `SDD.pdf` (how). Work is tracked in the Jira project **SCRUM**.

| Layer | Technology |
|---|---|
| Backend | Node.js 20+, Express, REST + JSON |
| Database | PostgreSQL 16 |
| Auth | bcrypt password hashes, JWT bearer tokens, role-based access control |
| Tests | Vitest + Supertest |
| Frontend | React (planned, `frontend/`) |

## Repository layout

```
backend/
  src/
    app.js            Express app (dependencies injected, easy to test)
    index.js          Server entry point
    config.js         Environment variables
    domain/           Roles
    routes/           HTTP layer
    services/         Business rules
    repositories/     SQL (PostgreSQL)
    middleware/       authenticate, authorize, error handling
    db/               migrations/*.sql, migrate.js, seedAdmin.js
  test/               Integration tests (test/*.test.js) and unit tests (test/unit)
docs/                 BRD, SRS, SDD
.github/workflows/    CI
```

## Getting started

```bash
docker compose up -d                 # PostgreSQL on localhost:5432 (or use your own server)
cd backend
cp .env.example .env                 # then set JWT_SECRET to a long random value
npm ci
npm run migrate                      # create the tables
npm run seed:admin                   # first administrator (ADMIN_EMAIL / ADMIN_PASSWORD from .env)
npm run dev                          # http://localhost:3000
```

Other commands: `npm test`, `npm run test:coverage`, `npm run lint`.
Tests do not need a database: they run against an in-memory repository.

## API

Errors always look like `{ "error": { "code": "...", "message": "...", "details": [...] } }`.

| Method | Path | Access | Jira | Description |
|---|---|---|---|---|
| POST | `/api/auth/register` | public | SCRUM-13 | Create an account. `role` must be `student` or `recruiter`. |
| POST | `/api/auth/login` | public | SCRUM-14 | Returns `{ token, user }`. Send the token as `Authorization: Bearer <token>`. |
| GET | `/api/auth/me` | any signed-in user | SCRUM-14 | Current user. |
| GET | `/api/users` | admin | SCRUM-15 | List accounts. |
| PATCH | `/api/users/:id/role` | admin | SCRUM-15 | Change a user's role (`student`, `recruiter`, `school_staff`, `admin`). |
| GET | `/health` | public | | Liveness check. |

Rules worth knowing:
- `school_staff` and `admin` accounts cannot be self-registered; an administrator assigns them. The first administrator comes from `npm run seed:admin`.
- Roles are read from the database on every request, so a role change applies immediately to tokens already issued.
- An administrator cannot change their own role (prevents locking everyone out).
- Login answers identically for an unknown email and a wrong password.

## Team workflow

Every piece of work starts from a Jira story (`SCRUM-<number>`):

- Branch: `feature/SCRUM-14-login`
- Commit: `feat(SCRUM-14): add login endpoint`
- Pull request title: `SCRUM-14 | Implement login`
- CI must be green before merging into `main`. It lints, runs the tests (coverage thresholds: lines, functions, statements 80 %, branches 70 %) and applies the SQL migrations on a real PostgreSQL.
