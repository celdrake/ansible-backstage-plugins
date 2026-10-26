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
