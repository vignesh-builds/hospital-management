# Hospital Management System — Render Deployment

## Architecture
- Frontend: Render Static Site
- Backend: Render Web Service (Spring Boot)
- Database: Existing Render PostgreSQL database

## Backend Render Web Service
Root Directory: `backend`
Build Command: `./mvnw clean package -DskipTests`
Start Command: `java -jar target/hospital-management-0.0.1-SNAPSHOT.jar`
Environment: Java 21

Set these environment variables:
- `DB_URL` = `jdbc:postgresql://<internal-host>:5432/<database>`
- `DB_USERNAME` = your Render PostgreSQL username
- `DB_PASSWORD` = your Render PostgreSQL password
- `JWT_SECRET` = a long random secret
- `JWT_EXPIRATION` = `3600000`
- `FRONTEND_URL` = your deployed Render frontend URL, e.g. `https://hospital-frontend-xxxx.onrender.com`

Health check URL: `/`

## Frontend Render Static Site
Root Directory: `frontend`
Build Command: `npm ci && npm run build`
Publish Directory: `dist`

Set environment variable:
- `VITE_API_URL` = your deployed backend URL, e.g. `https://hospital-backend-xxxx.onrender.com`

The included `public/_redirects` keeps React Router routes working on refresh.

## Important
Do not put PostgreSQL passwords or JWT secrets in source code or GitHub. Use Render Environment Variables.
