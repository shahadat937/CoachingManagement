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
cd deploy && docker compose up --build        # everything
# or locally: docker compose up postgres mongo rabbitmq, then ./scripts/create-solution.sh and run the Api projects
```
Swagger: http://localhost:500X/swagger. Frontend: see `web/README.md`.

## Status / next steps
Fully worked: Attendance, Devices, Students->Attendance event sync, gateway, compose, Angular attendance feature.
Skeleton only (generic list/create over the entity): Identity, Academic, Students, Accounts, Exams.
Not done yet: JWT auth + role policies, FluentValidation pipeline behavior (validators exist but are not wired into MediatR),
EF migrations (dev uses EnsureCreated), transactional outbox, Academic timetable -> auto-generate ClassSessions,
Accounts payments/ledger, Exam marks/results, Notification service (SMS to guardians), absent-marking job at session end,
real device adapters (ZKTeco ADMS push / SDK bridge). **Nothing here has been compiled yet** - run `scripts/create-solution.sh` first and fix any build errors.
