# Portal Trust Signals quickstart plugin

This workspace package implements the Git Repository tab example from
`docs/next/portal-sdk-quickstart.md`. It registers the documented legacy tab and
declares the equivalent NFS tab for the source app's default shell. It is
separate from the `portal-hello-world` plugin.

The frontend registers a Trust Signals tab with the legacy contribution
registry, reads trusted memberships through `usePortalContext`, and calls
`GET /api/trust-signals/trust-signals/:repoId`. The backend sample returns
static demo checks, and its middleware derives the user and organization from
Backstage credentials. The backend also pushes health status and writes an
audit event for a successful read.

With the source app's `full` or `scaffolder` development profile, open a Git
Repository detail page to see the tab. The example route requires one resolved
organization. Without a configured AAP organization membership, the tab shows
that context error and does not call the sample route.
