# Submission Deliverables

## 1) GitHub Repository URL (Required)

https://github.com/123Sarthak-cyber/Zorvyn

## 2) Live Demo or API Documentation URL

Use one of the following depending on what the form accepts:

- GitHub Pages landing page:
  - https://123sarthak-cyber.github.io/Zorvyn/
- Repository README (recommended if not deployed):
  - https://github.com/123Sarthak-cyber/Zorvyn#readme
- Local Swagger docs (only works on your machine):
  - http://localhost:4000/docs
- OpenAPI spec JSON (local):
  - http://localhost:4000/openapi.json

## 3) Primary Framework or Library Used (Required)

Node.js (Express)

## Project Notes

- Data persistence: SQLite via better-sqlite3
- Validation: Zod
- Access control: Role-based middleware (viewer, analyst, admin)
- Auth approach: Mock header-based auth via x-user-id

## Required API Header for Protected Routes

x-user-id: 1 | 2 | 3

Seeded users:
- 1: admin
- 2: analyst
- 3: viewer
