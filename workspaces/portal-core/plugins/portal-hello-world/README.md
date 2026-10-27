# Hello World Portal plugin

This proof of concept demonstrates a native Backstage NFS page, a Portal SDK
entity-tab contribution, and an authenticated frontend-to-backend request.

With the source app's default `full` or `scaffolder` development profile,
`yarn start` loads the plugin. Open `/hello-world` or choose **Hello World** in
the sidebar. The **Hello World** tab also appears on catalog entities whose
Portal content type is `playbook-repository`, when
`ansible.hello-world.enabled` is `true`.

The page calls `GET /api/hello-world/whoami`. The backend requires a signed-in
Backstage user and returns the identity information available from
`UserInfoService`:

- `authenticated` confirms that the backend accepted the signed-in user's
  credentials.
- `userEntityRef` identifies the Backstage catalog user.
- `ownershipEntityRefs` lists ownership references associated with that user;
  it may include groups.

```json
{
  "authenticated": true,
  "userEntityRef": "user:development/guest",
  "ownershipEntityRefs": ["user:development/guest"]
}
```

This service does not return profile fields such as display name or email, and
the response does not include the access token. If the request runs before
sign-in completes, use **Try again** after signing in. The tab uses the current
`@ansible/portal-extension-api/alpha` NFS contract; the legacy registration
helpers shown in the Portal SDK quickstart are not used.

## AAP token and organization mapping example

The page also demonstrates an AAP-authenticated request to an application API.
It gets an AAP OAuth access token from `rhAapAuthApiRef`, asks the Hello World
backend for the signed-in AAP user's organizations, and displays the external
AAP organization ID beside its mapped internal API organization ID. Choose a
mapped organization and select **Call application API** to run the example.

The AAP token and organizations are user-specific, so the example loads them
after the page mounts for a signed-in user. The backend checks that the AAP
token belongs to the same user as the Backstage session. It then maps the
external AAP organization ID and calls the configured API using:

```http
GET <apiPath>?orgId=<internalOrgId>
Authorization: Bearer <AAP access token>
```

Configure the mapping and API in `app-config.local.yaml`:

```yaml
ansible:
  hello-world:
    aapApi:
      apiBaseUrl: https://api.example.com
      apiPath: /v1/example
      organizationMappings:
        - externalOrgId: '42'
          internalOrgId: tenant-acme
```

The mapping is server-side. AAP organization IDs come from the user's AAP
membership response, and only organizations available to that user can be
selected. Guest auth can exercise the Backstage `/whoami` request, but it cannot
provide an AAP token or AAP organizations; use the RH AAP provider for this
example. The local `.invalid` AAP host in the no-environment setup is only a
startup placeholder and cannot complete RH AAP sign-in.
