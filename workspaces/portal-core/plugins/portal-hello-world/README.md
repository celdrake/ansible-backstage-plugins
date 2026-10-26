# Hello World Portal plugin

This frontend-only proof of concept demonstrates a native Backstage NFS page
and a Portal SDK entity-tab contribution. It has no backend because both
surfaces display static text.

With the source app's default `full` or `scaffolder` development profile,
`yarn start` loads the plugin. Open `/hello-world` or choose **Hello World** in
the sidebar. The **Hello World** tab also appears on catalog entities whose
Portal content type is `playbook-repository`, when
`ansible.hello-world.enabled` is `true`.

The tab uses the current `@ansible/portal-extension-api/alpha` NFS contract.
The legacy registration helpers shown in the Portal SDK quickstart are not
used.
