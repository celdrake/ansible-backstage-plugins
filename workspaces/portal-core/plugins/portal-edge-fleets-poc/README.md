# Edge Fleets Portal plugin

This proof of concept provides the Edge Fleets page at `/edge-fleets-poc`. It
loads fleets from Flightctl and retrieves the catalog items associated with
those fleets to display their operating system information.

The page calls these backend API routes:

- `GET /api/edge-fleets-poc/fleets`
- `PATCH /api/edge-fleets-poc/fleets/<fleet-name>` to update a fleet's OS
  catalog reference
- `GET /api/edge-fleets-poc/catalogitems?fleet=<fleet-name>` (one to 100 fleet
  names are accepted)

Both routes require a signed-in Backstage user and an AAP access token. The
backend reads the AAP profile and organization memberships, then sends the AAP
token to Flightctl. The temporary organization mapping allows AAP organization
`1` to use the Flightctl organization configured below.

Configure the Flightctl endpoint and organization in `app-config.local.yaml`:

```yaml
ansible:
  edge-fleets-poc:
    flightctl:
      apiBaseUrl: https://flightctl.example.com
      organizationId: 8093ada4-3380-4098-8391-519d7e81d732
      skipTlsVerify: false
```

Set `skipTlsVerify` to `true` only for a local endpoint using a self-signed
certificate.
