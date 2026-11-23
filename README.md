# Coaching Management System (Class 1-12)

.NET 9 microservices (Clean Architecture) + Angular/NgRx. Subject-wise attendance via fingerprint / RFID / face devices.

## Services
| Service | Port | DB | Responsibility |
|---|---|---|---|
| ApiGateway (YARP) | 5000 | - | Single entry point for the Angular app |
| Identity | 5001 | PostgreSQL | Users, roles, JWT (skeleton) |
| Academic | 5002 | PostgreSQL | Classes 1-12, subjects (routine/timetable next) |
| Students | 5003 | PostgreSQL | Students, guardians, device user id; publishes `StudentEnrolled` |
| Attendance | 5004 | PostgreSQL | Class sessions, subject-wise attendance; consumes punches |
| Devices | 5005 | MongoDB | Device registry, raw punch log; publishes `DevicePunchReceived` |
| Accounts | 5006 | PostgreSQL | Fee invoices, payments, ledger (skeleton) |
| Exams | 5007 | PostgreSQL | Exams, marks, results (skeleton) |
| RabbitMQ / Redis | 5672 / 6379 | - | Async events (MassTransit) / caching |

Each service: `X.Domain` -> `X.Application` (MediatR, FluentValidation) -> `X.Infrastructure` (EF Core/Mongo, MassTransit) -> `X.Api`.
Dependencies point inward only. Shared kernel: `src/BuildingBlocks`.

## Attendance flow
Device -> `POST /api/devices/{serial}/punches` (X-Device-Key) -> Devices stores raw punch, publishes `DevicePunchReceived`
-> Attendance resolves student (by DeviceUserId) + class level + room + time to the open `ClassSession` (a subject period)
-> records Present/Late once per session -> publishes `AttendanceMarked` (for guardian SMS later).

## Run
```bash
# First time only: copy deploy/.env.example to deploy/.env and replace its secrets.
cd deploy && docker compose up --build        # everything
# or locally: docker compose up postgres mongo rabbitmq, then ./scripts/create-solution.sh and run the Api projects
```
Swagger: http://localhost:500X/swagger. Frontend: see `web/README.md`.

## Authentication and authorization

`POST /api/auth/login` authenticates an email/password pair and returns an access token, expiry, and safe user profile. It also sets an HttpOnly, `SameSite=Strict` refresh-token cookie; the raw refresh token is never returned in JSON or stored in the browser's web storage. Send the access token to protected endpoints as `Authorization: Bearer <accessToken>` (Swagger's **Authorize** dialog accepts the raw access token and adds the prefix automatically). Passwords are PBKDF2-hashed server-side and are never returned by the user APIs.

`POST /api/auth/refresh` uses that cookie to issue a new access token and rotates the refresh token. Refresh tokens are random 512-bit values, stored only as SHA-256 hashes on the server, and may be used once. Reuse of a rotated token revokes the user's remaining active refresh sessions. `POST /api/auth/logout` revokes the presented cookie session and clears the cookie, including when the access token has expired. The Angular overlay refreshes once after a protected `401` and retries the failed request. Configure the cookie lifetime with `RefreshToken:LifetimeDays` (1-90; default 7).

The first administrator is provisioned only from the three `BootstrapAdmin__*` settings. For Docker Compose, set `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_FULL_NAME`, and `BOOTSTRAP_ADMIN_PASSWORD` in `deploy/.env` before the first start. The password must be 12–128 characters. The seed runs only when the database has no `Admin` role, so the same explicit configuration can recover a legacy database that has users but no administrator. Remove the bootstrap password from deployed configuration after setup.

All APIs validate the same signed JWT. The checked-in key is development-only; non-Development environments refuse to start until `JWT_SIGNING_KEY` is supplied. Docker Compose forwards the signing configuration to every API service. Use a random secret of at least 32 bytes and keep `deploy/.env` out of source control.

| API area | Authorized roles |
|---|---|
| `/api/users` | Admin |
| `GET /api/subjects` | Admin, Teacher |
| `POST /api/subjects` | Admin |
| `/api/students`, `/api/attendance`, `/api/exams` | Admin, Teacher |
| `/api/devices` management | Admin |
| `/api/fee-invoices` | Admin, Accountant |
| `/api/devices/{serial}/punches` | Device key (`X-Device-Key`), not JWT |

Student and Guardian tokens intentionally do not receive broad read access yet: the current model has no user-to-student/guardian ownership relation to enforce safely.

> The development database lifecycle uses `EnsureCreated`, not EF migrations. Startup includes a compatibility step that creates the refresh-token table in an existing local `identity_db`, but it will not add other schema changes such as the unique email index. Reset a disposable local database or apply proper EF migrations before upgrading a persistent deployment.

## Status / next steps
Fully worked: Attendance, Devices, Students->Attendance event sync, gateway, compose, Angular attendance feature.
Skeleton only (generic list/create over the entity): Academic, Students, Accounts, Exams.
Not done yet: FluentValidation pipeline behavior (validators exist but are not wired into MediatR),
EF migrations (dev uses EnsureCreated), transactional outbox, Academic timetable -> auto-generate ClassSessions,
Accounts payments/ledger, Exam marks/results, Notification service (SMS to guardians), absent-marking job at session end,
real device adapters (ZKTeco ADMS push / SDK bridge). Run `scripts/create-solution.sh` to regenerate the solution, restore, build, and test it.
