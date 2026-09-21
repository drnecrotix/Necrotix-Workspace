# Necrotix Workspace

Independent project delivery and client collaboration system for [NecrotixLab Services](https://necrotixlab.com/services).

## Purpose

When a service request is accepted in NecrotixLab, the server sends a signed, one-time handoff to this application. Necrotix Workspace creates its own client, project, task and audit records in a separate PostgreSQL database. The projects can then evolve and deploy independently from the main NecrotixLab website.

## Current foundation

- Operations dashboard for projects, tasks and client work
- Private client project view with hashed, expiring access tokens
- HMAC-SHA256 integration endpoint with five-minute timestamp tolerance
- Nonce and service-request replay protection
- Idempotent project creation
- Health endpoint with database connectivity status
- PostgreSQL data model for clients, projects, tasks, events and integration receipts
- CI for lint, type checking, unit tests and production build

## Integration contract

`POST /api/integrations/necrotixlab/handoff`

Headers:

```text
content-type: application/json
x-necrotix-timestamp: <unix-seconds>
x-necrotix-signature: <hex HMAC-SHA256(timestamp.raw-body)>
```

The payload contains the service request reference, a unique nonce, client details and the selected services. The shared secret is used server-to-server only. Never expose it to browser code or place customer data in Git.

## Local setup

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run dev
```

Open `http://localhost:3000`. Admin access uses the server-configured `ADMIN_ACCESS_KEY`. Production is intended for `projects.necrotixlab.com`.

## Deployment boundaries

- Separate GitHub repository and release history
- Separate deployment and PostgreSQL database
- Shared integration secret stored only in both deployments
- NecrotixLab sends accepted work to Workspace and receives signed status webhooks

## Roadmap

- Editable project and task boards
- Client comments, approvals and secure file delivery
- Time tracking, milestones and invoices
- Outbound signed status webhooks to NecrotixLab
- Role-based accounts and two-factor authentication

## Security

Rotate integration and admin secrets regularly. Use HTTPS, managed PostgreSQL backups and a private object store for deliverables. Client tokens are hashed at rest and should be short-lived or revocable.
