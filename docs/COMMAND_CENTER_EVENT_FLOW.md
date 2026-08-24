# Command-Center Event Flow

The public brand website is the conversion surface. The command center is the private operating brain.

New website analytics events should flow into the command-center Supabase project, not the legacy audit project.

## Flow

1. Browser posts event data to `/api/events` on the public site.
2. The public site's server validates and normalizes the event.
3. The public site's server forwards the event to the command-center ingestion endpoint.
4. The command center validates the shared secret.
5. The command center stores the event in its own `site_events` table.

## Required Public-Site Environment Variables

```bash
COMMAND_CENTER_EVENTS_URL=https://247-ops-dashboard.vercel.app/api/site-events/ingest
COMMAND_CENTER_EVENTS_SECRET=
```

The secret must match the command-center deployment value. It must stay server-only.

## Legacy Supabase Project

The old project documented in `docs/ATHENA_ONBOARDING.md`:

- `ytdufsxqywkvtnpyetco`
- `247ROI Audit App`

appears to be the historical audit funnel backend. It should not receive new operational stats tables.

Keep legacy audit data separate until an explicit inventory/migration is performed.
