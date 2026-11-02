# What was added

## Security fixes
- `AccessGuard` (new): one place that decides who may see which patient's data.
  - Bills: ADMIN or the patient themself (doctors never).
  - Prescriptions / history: ADMIN, the patient themself, or a doctor who has an appointment with that patient.
- `/bills/patient/{id}`, `/bills/{id}`, `/prescriptions/**`, `/history/**` now enforce this. Before, any logged-in user could read any patient's data.
- `GET /beds` no longer leaks the occupying patient's phone/address to everyone (only staff see the patient name).
- Prescription create/update: doctor must own the appointment, appointment must be CONFIRMED/COMPLETED, diagnosis + medicines required.
- Bill totals and payment status are always computed on the server (client-sent values are ignored).
- `JWT_SECRET` and `ADMIN_PASSWORD` have **no defaults** any more. The app refuses to start without a 32+ char secret, and without an admin password the first time it runs on an empty database.
  - Local development: `SPRING_PROFILES_ACTIVE=dev` (uses `application-dev.properties`).
  - Production: set env vars, see `backend/.env.example`.

## New features
| Feature | Backend | Frontend |
|---|---|---|
| Prescriptions (write, edit, view, print / save as PDF) | `PrescriptionService`, `/prescriptions` | `/prescription/:appointmentId` |
| Bed admission + discharge | `Admission`, `/admissions` | `Beds.jsx` |
| Discharge auto-creates a room-charge bill (days x daily rate, min 1 day) | `AdmissionService` | `Beds.jsx` |
| Bill from a completed appointment (doctor fee + prescription medicine charges) | `POST /bills/from-appointment/{id}` | `Billing.jsx` |
| Invoice / receipt page, print / save as PDF | `GET /bills/{id}` | `/invoice/:billId` |
| Paid / Pending filter, totals, patients see their own bills | `GET /bills`, `/bills/my` | `Billing.jsx` |
| Patient medical history (visits, prescriptions, stays, bills) | `/history/my`, `/history/patient/{id}` | `/my-history`, `/history/:patientId` |

## Tests
`backend/src/test/java/.../service/` - AccessGuard, Bill, Admission, Prescription services (Mockito).
Run: `cd backend && ./mvnw test` (or `mvn test`).

## Not included
- Online payment (Razorpay): needs your Razorpay keys + a webhook URL. "Mark paid" is still manual by admin.

## Bed management additions
- Admin can edit bed number, ward type, and daily rate.
- Admin can delete a bed only when it is empty and has no admission history (protects billing/audit records).
- Bed list now supports text search and ward filtering.
- Existing admission/discharge workflow remains: discharge releases the bed and creates room-charge billing.
- Existing account roles are ADMIN, DOCTOR, PATIENT. Receptionist, Nurse, and Ward In-charge accounts are not defined in this project, so those roles were not added implicitly; role/account provisioning and permissions need a coordinated authentication change before those users can sign in.
