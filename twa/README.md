# Packaging Rule or Drool as a Trusted Web Activity

The web app is a complete installable PWA: manifest, icons, offline service worker. A TWA
wraps that same URL in an Android package for Play. Nothing in `src/` changes to build one.

## The blocker to solve first

**Digital Asset Links must be served from the origin root, not the app path.** Android
verifies a TWA by fetching:

```
https://rcjlabs.github.io/.well-known/assetlinks.json
```

That path belongs to the **user Pages site**, which is a different repository
(`RCJLabs/rcjlabs.github.io`), not this one. This repo can only publish under
`/Rule-or-Drool/`, and a file there will not be read. Without verification the app still
runs, but it shows a Chrome address bar across the top, which defeats the point.

Three ways out, in order of preference:

1. **Point a custom domain at this project** and serve `/.well-known/assetlinks.json` from
   its root. Cleanest, and it also makes the URL something you would put on a store listing.
2. **Add the file to the `RCJLabs/rcjlabs.github.io` repository** at `.well-known/assetlinks.json`.
   Works, but couples this game's release to another repo.
3. **Ship without verification.** Not recommended: the address bar stays visible.

`assetlinks.template.json` here is the file to publish. Replace the fingerprint with the
SHA-256 of whichever key signs the release. If you use Play App Signing, take the
fingerprint from Play Console under Setup → App integrity, not from your local keystore.

## Build steps

Needs a JDK, the Android SDK, and network access to Maven and the Play servers, so this runs
on a development machine rather than in CI here.

```
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://rcjlabs.github.io/Rule-or-Drool/manifest.webmanifest
# or, to reuse the settings in this folder:
cp twa/twa-manifest.json ./twa-manifest.json && bubblewrap build
```

`twa-manifest.json` here is a filled-in starting point. Update `appVersionName` to match
`APP_VERSION` in `src/version.ts` and bump `appVersionCode` on every upload, since Play
rejects a repeated code.

## Play policy: not verified from here

TRANSFER.md section 13 asks for a policy check before this phase. **It has not been done.**
The sandbox that built this cannot reach Google's policy pages, so treat the following as a
checklist to work through in the Play Console, not as advice that has been confirmed:

- **Elections and political content.** Policy has historically had specific rules for apps
  about elections and political actors. This game uses fictional countries, parties and
  people throughout, with no real names, which is the ground that matters most, but confirm
  how the current wording treats satire of politics in general.
- **Sensitive events.** Check that famine, pandemic and war cards do not read as
  capitalising on a specific ongoing real event.
- **Content rating questionnaire.** Answer honestly about political themes and any
  references to violence; the questionnaire drives the age rating, not the store copy.
- **Store listing.** Describe it as fiction and satire. Do not imply endorsement by, or
  association with, any real party or government.
- **Target API level** for new uploads changes annually; Bubblewrap usually tracks it, but
  confirm before submitting.
