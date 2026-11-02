# Bed Management roles and workflows

- ADMIN: configure beds, create staff accounts, manage reservations and maintenance, admit/discharge, transfer, inspect transfer history.
- RECEPTIONIST: view beds/patients, reserve beds, admit/discharge patients, transfer patients.
- NURSE: view beds/admissions and patient details, update bed occupancy when appropriate, transfer patients; cannot create/delete beds or reserve them.
- WARD_IN_CHARGE: ward operations, reserve beds, admit/discharge, transfer, set/clear maintenance.
- DOCTOR: view bed status and perform admission/discharge under the existing clinical workflow.
- PATIENT: view bed availability only.

## New API routes
- `POST /auth/staff` (ADMIN): create RECEPTIONIST, NURSE or WARD_IN_CHARGE login. Temporary password must be changed at first login.
- `POST /beds/{id}/reserve` (ADMIN, RECEPTIONIST, WARD_IN_CHARGE): JSON `{ "patientId": 1, "reservedUntil": "2026-11-02T18:00:00" }`; reservedUntil may be null.
- `DELETE /beds/{id}/reservation` (ADMIN, RECEPTIONIST, WARD_IN_CHARGE): cancel reservation.
- `PUT /beds/{id}/maintenance?enabled=true|false` (ADMIN, WARD_IN_CHARGE): set/clear maintenance.
- `POST /beds/transfer` (ADMIN, RECEPTIONIST, NURSE, WARD_IN_CHARGE): JSON `{ "admissionId": 1, "toBedId": 2, "reason": "Clinical requirement" }`.
- `GET /beds/transfers` (ADMIN, WARD_IN_CHARGE): transfer audit history.

Bed lifecycle statuses: AVAILABLE, RESERVED, OCCUPIED, MAINTENANCE. Reservation and maintenance are mutually exclusive with occupied beds. Transfer keeps the admission active and records an audit row in `bed_transfers`.

## Setup
Back up your database before upgrading. JPA schema update should create the new columns/table automatically if `spring.jpa.hibernate.ddl-auto=update` is configured. Admin creates staff accounts from **Staff accounts** in the web app. The new staff member logs in with the supplied temporary password and changes it immediately.
