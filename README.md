# Necrotix Workspace

Independent project delivery and client collaboration system for [NecrotixLab Services](https://necrotixlab.com/services).

## Purpose

When a service request is accepted in NecrotixLab, the server sends a signed, one-time handoff to this application. Necrotix Workspace creates its own client, project, task and audit records in a separate PostgreSQL database. The projects can then evolve and deploy independently from the main NecrotixLab website.

## Current foundation

- One-time `/install` flow protected by `INSTALL_TOKEN`; it returns 404 after successful setup
- Default Web, Security and Engineering project templates
- Operations dashboard for projects, tasks and client work
- Database-backed delivery metrics and recent activity
- Five-column project task board with auditable status changes
- Milestones and client action requests
- Client-visible comments and private internal notes
- Client completion flow for requested actions
- Drag-and-drop task movement with an auditable server-side update
- Scoped change requests with estimates and client approval or rejection
- Version-ready file metadata model with a storage-provider boundary
- Update Center backed by a release manifest and hosting deployment hook
- Private client project view with hashed, expiring access tokens
- HMAC-SHA256 integration endpoint with five-minute timestamp tolerance
- Nonce and service-request replay protection
- Idempotent project creation
- Health endpoint with database connectivity status
- PostgreSQL data model for clients, projects, tasks, milestones, comments, actions, attachments, events and integration receipts
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

Open `http://localhost:3000/install` once and use the server-configured `INSTALL_TOKEN`. After setup the installer is permanently locked by the database installation record and responds with 404. Admin access uses `ADMIN_ACCESS_KEY`. Production is intended for `projects.necrotixlab.com`.

The production start command applies pending Prisma migrations before starting Next.js. The Update Center compares `package.json` with `WORKSPACE_UPDATE_MANIFEST_URL` and calls `WORKSPACE_DEPLOY_HOOK_URL` when an update is approved. The deployment provider remains responsible for checkout, build, activation and rollback.

## Deployment boundaries

- Separate GitHub repository and release history
- Separate deployment and PostgreSQL database
- Shared integration secret stored only in both deployments
- NecrotixLab sends accepted work to Workspace and receives signed status webhooks

## Roadmap

- Drag-and-drop ordering within columns and template editing
- Secure object-storage uploads and file previews
- Time tracking, budget stages and invoices
- Calendar, saved filters and scheduled reminders
- Outbound signed status webhooks to NecrotixLab
- Role-based accounts and two-factor authentication

## Security

Rotate integration and admin secrets regularly. Use HTTPS, managed PostgreSQL backups and a private object store for deliverables. Client tokens are hashed at rest and should be short-lived or revocable.
