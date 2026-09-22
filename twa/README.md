# Packaging Rule or Drool as a Trusted Web Activity

The web app is a complete installable PWA: manifest, icons, offline service worker. A TWA
wraps that same URL in an Android package for Play. Nothing in `src/` changes to build one.

The store listing, the graphics, the Data safety and content rating notes, and the
decisions only the owner can make are in [STORE.md](STORE.md).

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
STORE.md sets out the two ways out and what each one takes.

`assetlinks.template.json` here is the file to publish, with the SHA-256 fingerprint of the
key that signs the release. With Play App Signing, take it from the console's App integrity
page, not from your local keystore.

## The manifest

`twa-manifest.json` is loaded by Bubblewrap as it stands. It was checked by loading it in
`@bubblewrap/core` 1.25.0 (released 31 July 2026), which targets Android API 36. That
check caught two fields the file had carried since phase 7 without anything noticing:

- the version was written as `appVersionName`, which Bubblewrap does not read (its key is
  `appVersion`), so a build would have had no version name;
- `splashScreenFadeOutDuration` was missing, and Bubblewrap copies it through with no
  default.

Bubblewrap's own `validate()` passes both, so the only way to see them is to load the file
and read back what it holds. The dark-mode status and navigation bar colours are also set
now; they defaulted to black against the game's paper colour.

**Versioning.** The app is a shell around the live site, so every web deploy reaches Play
players without a store release. `appVersion` and `appVersionCode` version the shell:
bump them only when it is rebuilt (a new host, icons, signing key or target API), and
`appVersionCode` must go up on every upload, since Play rejects a repeated code.

## Build steps

Needs a JDK, the Android SDK, and network access to Maven and the Play servers, so this runs
on a development machine rather than in CI here.

```
npm install -g @bubblewrap/cli
cp twa/twa-manifest.json ./twa-manifest.json && bubblewrap build
```
