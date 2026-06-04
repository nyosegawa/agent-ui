---
"@nyosegawa/agent-ui-core": patch
"@nyosegawa/agent-ui-codex": patch
"@nyosegawa/agent-ui-react": patch
"@nyosegawa/agent-ui-server": patch
"@nyosegawa/agent-ui-web-components": patch
---

Fix npm release packaging so published tarballs include built `dist` artifacts.

The release publish script now builds the workspace inside the publish job before
running Changesets publish, and packlist validation checks the npm packlist for
missing `dist` entries.
