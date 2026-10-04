# Maintainer keys

Each maintainer's public GPG key, ASCII-armoured, as `<maintainer-id>.asc`
(kebab-case, e.g. `jane-doe.asc`). Every publish encrypts its full report to
all keys here; with no key, a publish stops before uploading anything
(ADR-0004). Export yours with:

```sh
gpg --armor --export you@example.test > deploy/maintainers/<your-id>.asc
```

Adding or removing a key is a reviewed change (CODEOWNERS covers `deploy/`).
Keep an offline backup of your private key: without it no maintainer can read
the server listing, and deletion must stay off.
