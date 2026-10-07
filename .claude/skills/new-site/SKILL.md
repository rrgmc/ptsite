---
name: new-site
description: Create a new poker league site from this repository (PTSite). Makes the site's own repository with this one as a git submodule, its settings (name, logo, main color, money, time zone), its Laravel skeleton and a first build. Use when asked to create, start, set up or bootstrap a new site, a new league or a new tournament site from PTSite.
---

# Create a new site from PTSite

The steps are in [`docs/new-site.md`](../../../docs/new-site.md), shared with every coding assistant. Read that
file now and follow it in order. Do not work from memory of it: it changes with the core.

In short:

1. Ask the owner the questions of its first table before creating anything. Use one message.
2. Make the site's repository next to this one, never inside it, with this repository as the `core` submodule.
3. Copy `examples/site` into it, and change only files outside `core/`.
4. Write `site/site.json`, draw the icons, run `task setup`, then do the checks of step 5.

Ask before creating a repository on GitHub, pushing or deploying. Never write a league's name, people or host
into this repository.
