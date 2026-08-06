# edimah.github.io

Personal site: about page, blog, CV. Jekyll, hosted on GitHub Pages at <https://edimah.github.io>.

## Run it

```bash
bundle install
bundle exec jekyll serve
```

The site is served at <http://127.0.0.1:4000>. A full build takes about 0.2 seconds.

Run Prettier before committing:

```bash
npx prettier --write .
```

## Structure

```text
_config.yml           site settings, plugins, archive permalinks
_layouts/             default, home, page, post, cv, archive, redirect
_includes/            head, header, footer, social, pagination, cv_dates
_pages/               about.md, blog.html, cv.md, 404.md, redirects/
_posts/               published posts
_scheduled/           posts waiting for their date
_data/                resume.json (drives /cv/), socials.yml (footer links)
_plugins/cache-bust.rb  appends a content hash to asset URLs
assets/css/main.scss  the entire stylesheet
assets/js/theme.js    light/dark toggle
assets/fonts/site/    Inter and Source Serif 4, latin subset, self-hosted
affiche/              standalone poster generator, served at /affiche/
```

## Design

One stylesheet, no CSS framework. The palette is Sage & Plum, the same one the
figures use: sage `#2F8A55`, plum `#93498B`, ocre `#B07A2E`, ink `#3A3A3A`, lin
`#EFEAE3`. Link colours are a darker step than the mark colours so body-text
links clear WCAG AA on the lin background; the marks keep the brand values.

Headings are Source Serif 4, body text is Inter. Both are self-hosted, latin
subset, 95 KB in total. No external font host, no CDN, no analytics: a page
loads only files from this repository.

Text sits in a 42 rem measure. Figures and tables may break wider, to 52 rem.

Light and dark are both supported. The toggle is in the header and the choice
is stored in `localStorage`; with no stored choice the system preference wins.

## Posts

Front matter:

```yaml
---
layout: post
title: "Title"
description: One sentence, shown in listings and as the meta description.
date: 2026-07-19 09:00:00
tags: mnar censoring
categories: posts
lang: fr # only for French posts; omit otherwise
math: true # only if the post contains LaTeX; loads MathJax
---
```

Figures are plain HTML, no Liquid tag:

```html
<figure>
  <img src="/assets/img/name.png" alt="What the figure shows" loading="lazy" />
  <figcaption><strong>Figure 1.</strong> Caption.</figcaption>
</figure>
```

MathJax loads only on pages with `math: true` in the front matter.

## Publishing

Dated posts go in `_posts/`. Future posts go in `_scheduled/`, named
`YYYY-MM-DD-slug.md`.

`schedule-posts.yml` runs daily at 12:00 UTC. It moves any `_scheduled/` file
dated today into `_posts/`, pushes, then triggers `deploy.yml`. The cron runs
after the 09:00 timestamp the posts carry, because `future: false` in
`_config.yml` hides a post whose date is still ahead of build time.

Known limit: the workflow matches today's date exactly. A post whose date has
already passed while it sat in `_scheduled/` will not be picked up. Move it to
`_posts/` by hand.

## Plugins

Five, all doing visible work. `jekyll-archives-v2` builds the year, tag and
category archives under `/blog/`. `jekyll-paginate-v2` paginates `/blog/` at ten
posts a page. `jekyll-feed` writes `/feed.xml` and `jekyll-sitemap` writes
`/sitemap.xml`. `jekyll-minifier` minifies the production build.

Adding a plugin that needs `nokogiri` pulls a native extension into every CI
build. `jekyll-link-attributes` was dropped for that reason.

## Redirects

`_pages/redirects/` holds meta-refresh stubs for URLs that used to exist:
`/freelance/`, `/portfolio/`, `/projects/`, `/projects/apple_health_project/`,
`/santepub/`, `/santepub/2025-11-15-prostate-dom-metropole/`. They are excluded
from the sitemap and marked `noindex`. Delete a stub once nothing links to it.

## History

The site ran on the al-folio theme until August 2026. The chrome was replaced
with the layouts in this repository; the posts were unaffected, because they
contain no theme-specific Liquid.
