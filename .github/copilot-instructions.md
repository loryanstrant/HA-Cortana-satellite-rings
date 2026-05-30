# Copilot instructions — HA-Cortana-satellite-rings

> Canonical standards live in the `dev-standards` repo on SOUNDWAVE/Gitea.
> Read by Copilot chat **and** inline suggestions. For full HA build conventions,
> see the `build-ha-component` skill in dev-standards.

## What this repo is

A **Home Assistant custom component with a bundled Lovelace card** — animated
Cortana-style assist rings (config flow + a card + sound assets). Domain:
`cortana_rings`.

## Repo shape

- `custom_components/cortana_rings/` — `manifest.json`, `__init__.py`,
  `config_flow.py`, `const.py`, `strings.json`, `translations/`, `brand/icon.png`.
- `custom_components/cortana_rings/www/cortana-rings-card.js` — bundled card.
- `custom_components/cortana_rings/www/sounds/` — WAV assets.
- `hacs.json`, `.github/workflows/` (validate + release).

## Conventions

- Bump `manifest.json` **version** on every release (semver); `domain` matches
  the folder name. CI auto-cuts the release.
- Test: `hassfest` + HACS validation, then `pytest` with
  `pytest-homeassistant-custom-component`.
- Deploy/test via the published release artifact into TEST1/TEST2, not host
  file-copy. Backup + auto-rollback.
- Keep the bundled card JS + sound asset paths stable (dashboards reference them).

## Never

- Don't commit HA long-lived tokens or deploy keys — Gitea Actions secrets only.
