# Hospital Management

Spring Boot (Java 21, PostgreSQL) backend + React (Vite) frontend.

## Run locally

Backend:
```
cd backend
SPRING_PROFILES_ACTIVE=dev mvn spring-boot:run
```
For production set the variables listed in `backend/.env.example`.

Frontend:
```
cd frontend
npm install
npm run dev
```
Set `VITE_API_URL` (see `frontend/.env.example`) if the API is not on http://localhost:8080.

## Tests
```
cd backend && mvn test
```

See `CHANGES.md` and `BED_MANAGEMENT_ROLES.md` for feature notes.
