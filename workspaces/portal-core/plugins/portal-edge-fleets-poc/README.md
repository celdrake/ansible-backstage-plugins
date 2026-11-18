# Edge Fleets Portal plugin

This proof of concept provides the Edge Fleets page at `/edge-fleets-poc`. It
loads fleets from Flightctl and retrieves the catalog items associated with
those fleets to display their operating system information.

The page calls these backend API routes:

- `GET /api/edge-fleets-poc/fleets`
- `GET /api/edge-fleets-poc/fleets/<fleet-name>?addDevicesSummary=true` to
  retrieve a fleet with its device summary
- `PATCH /api/edge-fleets-poc/fleets/<fleet-name>` to update a fleet's OS
  catalog reference
- `GET /api/edge-fleets-poc/catalogitems?fleet=<fleet-name>` (one to 100 fleet
  names are accepted)

All routes require a signed-in Backstage user and an AAP access token. The
Portal identity middleware resolves the user and trusted AAP organization, then
the backend sends the AAP token to Flightctl. On each request the plugin lists
the Flightctl organizations the user can access and matches the Portal
organization against the Flightctl organization `externalId` (Flightctl stores
the AAP organization name there). The matched Flightctl organization is sent as
`org_id` on every Flightctl call. Update operations emit Portal audit events,
and backend health is reported through the host health registry.

Configure the Flightctl endpoint in `app-config.local.yaml`:

```yaml
ansible:
  edge-fleets-poc:
    flightctl:
      apiBaseUrl: https://flightctl.example.com
      skipTlsVerify: false
```

Set `skipTlsVerify` to `true` only for a local endpoint using a self-signed
certificate.
