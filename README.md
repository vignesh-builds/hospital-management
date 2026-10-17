# Hospital Management System

Spring Boot (backend) + React/Vite (frontend) + PostgreSQL.

## Run locally

### 1. Backend
```bash
cd backend
# needs PostgreSQL with a database named hospital_db
./mvnw spring-boot:run
```
Environment variables (all optional locally):

| Variable | Default | Purpose |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/hospital_db` | database |
| `DB_USERNAME` / `DB_PASSWORD` | `postgres` / `postgres` | database login |
| `JWT_SECRET` | dev value | **change in production** (min 32 chars) |
| `CORS_ALLOWED_ORIGINS` | localhost + render frontend | frontend URLs, comma separated |
| `APP_TIMEZONE` | `Asia/Kolkata` | time zone for past date/time checks |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `admin@hospital.com` / `Admin@123` | first admin (created only if no admin exists) |

### 2. Frontend
```bash
cd frontend
cp .env.example .env     # set VITE_API_URL to your backend URL
npm install
npm run dev
```

## Roles
- **Admin**: manages doctors (can create a doctor login), patients, all appointments.
- **Doctor**: sees own appointments, confirms/completes/cancels, manages own availability.
- **Patient**: registers, books and cancels own appointments.

## Deployment notes
- Set `VITE_API_URL` on the frontend host and `CORS_ALLOWED_ORIGINS`, `JWT_SECRET`, `ADMIN_PASSWORD` on the backend.
- Static hosting needs a rewrite rule `/*` -> `/index.html` for React Router.
